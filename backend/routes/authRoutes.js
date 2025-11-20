const express = require('express');
const { registerUser, loginUser, loginAdmin, getProfile } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/admin/login', loginAdmin);
router.get('/me', authenticateToken, getProfile);

module.exports = router;

