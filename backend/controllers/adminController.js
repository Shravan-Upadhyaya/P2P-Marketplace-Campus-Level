const pool = require('../config/db');

exports.getAllUsers = async (_req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC',
    );
    return res.json(users);
  } catch (error) {
    console.error('getAllUsers error', error);
    return res.status(500).json({ message: 'Failed to fetch users' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role } = req.body;

    const [result] = await pool.execute(
      'UPDATE users SET name = COALESCE(?, name), role = COALESCE(?, role) WHERE id = ?',
      [name, role, id],
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ message: 'User updated' });
  } catch (error) {
    console.error('updateUser error', error);
    return res.status(500).json({ message: 'Failed to update user' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);

    if (!result.affectedRows) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ message: 'User deleted' });
  } catch (error) {
    console.error('deleteUser error', error);
    return res.status(500).json({ message: 'Failed to delete user' });
  }
};

exports.getAllItems = async (_req, res) => {
  try {
    const [items] = await pool.query(
      `SELECT i.*, u.name AS owner_name, u.email AS owner_email
       FROM items i
       JOIN users u ON u.id = i.user_id
       ORDER BY i.created_at DESC`,
    );
    return res.json(items);
  } catch (error) {
    console.error('getAllItems error', error);
    return res.status(500).json({ message: 'Failed to fetch items' });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, price, category, image_url } = req.body;

    const [result] = await pool.execute(
      `UPDATE items
       SET title = COALESCE(?, title),
           description = COALESCE(?, description),
           price = COALESCE(?, price),
           category = COALESCE(?, category),
           image_url = COALESCE(?, image_url)
       WHERE id = ?`,
      [title, description, price, category, image_url, id],
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: 'Item not found' });
    }

    return res.json({ message: 'Item updated' });
  } catch (error) {
    console.error('admin.updateItem error', error);
    return res.status(500).json({ message: 'Failed to update item' });
  }
};

exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.execute('DELETE FROM items WHERE id = ?', [id]);

    if (!result.affectedRows) {
      return res.status(404).json({ message: 'Item not found' });
    }

    return res.json({ message: 'Item removed' });
  } catch (error) {
    console.error('admin.deleteItem error', error);
    return res.status(500).json({ message: 'Failed to delete item' });
  }
};

