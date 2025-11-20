const pool = require('../config/db');

exports.createReport = async (req, res) => {
  try {
    const { item_id, reason } = req.body;

    if (!item_id || !reason) {
      return res.status(400).json({ message: 'Item and reason are required' });
    }

    const [items] = await pool.execute('SELECT id FROM items WHERE id = ?', [item_id]);
    if (!items.length) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const [result] = await pool.execute(
      'INSERT INTO reports (item_id, user_id, reason, status) VALUES (?, ?, ?, ?)',
      [item_id, req.user.id, reason.trim(), 'open'],
    );

    return res.status(201).json({ id: result.insertId });
  } catch (error) {
    console.error('createReport error', error);
    return res.status(500).json({ message: 'Failed to submit report' });
  }
};

exports.getReports = async (_req, res) => {
  try {
    const [reports] = await pool.query(
      `SELECT r.*, i.title AS item_title, u.name AS reporter_name
       FROM reports r
       JOIN items i ON i.id = r.item_id
       JOIN users u ON u.id = r.user_id
       ORDER BY r.created_at DESC`,
    );
    return res.json(reports);
  } catch (error) {
    console.error('getReports error', error);
    return res.status(500).json({ message: 'Failed to fetch reports' });
  }
};

exports.resolveReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { status = 'resolved' } = req.body;

    const [result] = await pool.execute('UPDATE reports SET status = ? WHERE id = ?', [status, id]);

    if (!result.affectedRows) {
      return res.status(404).json({ message: 'Report not found' });
    }

    return res.json({ message: 'Report updated' });
  } catch (error) {
    console.error('resolveReport error', error);
    return res.status(500).json({ message: 'Failed to update report' });
  }
};

