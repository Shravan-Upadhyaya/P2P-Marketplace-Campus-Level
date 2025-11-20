const pool = require('../config/db');

const buildItemResponse = (item) => ({
  id: item.id,
  title: item.title,
  description: item.description,
  price: Number(item.price),
  category: item.category,
  image_url: item.image_url,
  created_at: item.created_at,
  owner:
    item.owner_id && item.owner_name
      ? {
          id: item.owner_id,
          name: item.owner_name,
          email: item.owner_email,
        }
      : undefined,
});

exports.createItem = async (req, res) => {
  try {
    const { title, description, price, category, image_url } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : image_url;

    if (!title || !description || !price || !category) {
      return res.status(400).json({ message: 'All fields except image are required' });
    }

    const [result] = await pool.execute(
      'INSERT INTO items (user_id, title, description, price, category, image_url) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, title.trim(), description.trim(), price, category.trim(), imagePath || null],
    );

    return res.status(201).json({ id: result.insertId, image_url: imagePath });
  } catch (error) {
    console.error('createItem error', error);
    return res.status(500).json({ message: 'Failed to create item' });
  }
};

exports.getItems = async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         i.id,
         i.title,
         i.description,
         i.price,
         i.category,
         i.image_url,
         i.created_at,
         u.id   AS owner_id,
         u.name AS owner_name,
         u.email AS owner_email
       FROM items i
       JOIN users u ON u.id = i.user_id
       ORDER BY i.created_at DESC`,
    );

    return res.json({ items: rows.map(buildItemResponse) });
  } catch (error) {
    console.error('getItems error', error);
    return res.status(500).json({ message: 'Failed to fetch items' });
  }
};

exports.getMyItems = async (req, res) => {
  try {
    const [items] = await pool.execute('SELECT * FROM items WHERE user_id = ? ORDER BY created_at DESC', [
      req.user.id,
    ]);
    return res.json(items);
  } catch (error) {
    console.error('getMyItems error', error);
    return res.status(500).json({ message: 'Failed to fetch your items' });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, price, category, image_url } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : image_url;

    const [items] = await pool.execute('SELECT * FROM items WHERE id = ?', [id]);
    if (!items.length) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const item = items[0];

    if (req.user.role !== 'admin' && item.user_id !== req.user.id) {
      return res.status(403).json({ message: 'You cannot edit this item' });
    }

    await pool.execute(
      `UPDATE items
       SET title = ?, description = ?, price = ?, category = ?, image_url = ?
       WHERE id = ?`,
      [
        title || item.title,
        description || item.description,
        price ?? item.price,
        category || item.category,
        imagePath || item.image_url,
        id,
      ],
    );

    return res.json({ message: 'Item updated' });
  } catch (error) {
    console.error('updateItem error', error);
    return res.status(500).json({ message: 'Failed to update item' });
  }
};

exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const [items] = await pool.execute('SELECT user_id FROM items WHERE id = ?', [id]);

    if (!items.length) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (req.user.role !== 'admin' && items[0].user_id !== req.user.id) {
      return res.status(403).json({ message: 'You cannot delete this item' });
    }

    await pool.execute('DELETE FROM items WHERE id = ?', [id]);
    return res.json({ message: 'Item deleted' });
  } catch (error) {
    console.error('deleteItem error', error);
    return res.status(500).json({ message: 'Failed to delete item' });
  }
};

