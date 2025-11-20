const express = require('express');
const { createReport } = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticateToken, createReport);

module.exports = router;

