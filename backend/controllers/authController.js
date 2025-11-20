const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const EMAIL_DOMAIN = '@mite.ac.in';

const buildToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '12h' });

const isCampusEmail = (email) =>
  email && email.toLowerCase().endsWith(EMAIL_DOMAIN);

exports.registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!isCampusEmail(email)) {
      return res.status(400).json({ message: 'Please use your @mite.ac.in email' });
    }

    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [
      email.toLowerCase(),
    ]);

    if (existing.length) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name.trim(), email.toLowerCase(), hashed],
    );

    const token = buildToken({
      id: result.insertId,
      name: name.trim(),
      email: email.toLowerCase(),
      role: 'user',
    });

    return res.status(201).json({
      token,
      user: { id: result.insertId, name, email: email.toLowerCase(), role: 'user' },
    });
  } catch (error) {
    console.error('registerUser error', error);
    return res.status(500).json({ message: 'Registration failed' });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const [users] = await pool.execute(
      'SELECT id, name, email, password, role FROM users WHERE email = ?',
      [email.toLowerCase()],
    );

    if (!users.length) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = users[0];
    const matches = await bcrypt.compare(password, user.password);

    if (!matches) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = buildToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    return res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error('loginUser error', error);
    return res.status(500).json({ message: 'Login failed' });
  }
};

exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const [admins] = await pool.execute(
      'SELECT id, email, password FROM admins WHERE email = ?',
      [email.toLowerCase()],
    );

    if (!admins.length) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    const admin = admins[0];
    const matches = await bcrypt.compare(password, admin.password);

    if (!matches) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    const token = buildToken({
      id: admin.id,
      email: admin.email,
      role: 'admin',
    });

    return res.json({
      token,
      user: { id: admin.id, name: 'Administrator', email: admin.email, role: 'admin' },
    });
  } catch (error) {
    console.error('loginAdmin error', error);
    return res.status(500).json({ message: 'Admin login failed' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const { id, role } = req.user;

    if (role === 'admin') {
      return res.json({ id, name: 'Administrator', email: req.user.email, role: 'admin' });
    }

    const [users] = await pool.execute(
      'SELECT id, name, email, role FROM users WHERE id = ?',
      [id],
    );

    if (!users.length) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json(users[0]);
  } catch (error) {
    console.error('getProfile error', error);
    return res.status(500).json({ message: 'Failed to fetch profile' });
  }
};

