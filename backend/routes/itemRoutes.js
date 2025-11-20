const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  createItem,
  getItems,
  getMyItems,
  updateItem,
  deleteItem,
} = require('../controllers/itemController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const uploadDir = path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, or WEBP images are allowed'));
    }
  },
});

router.get('/browse', authenticateToken, getItems);
router.get('/mine', authenticateToken, getMyItems);
router.post('/', authenticateToken, upload.single('image'), createItem);
router.put('/:id', authenticateToken, upload.single('image'), updateItem);
router.delete('/:id', authenticateToken, deleteItem);

module.exports = router;

