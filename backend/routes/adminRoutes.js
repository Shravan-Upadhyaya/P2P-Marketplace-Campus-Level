const express = require('express');
const {
  getAllUsers,
  updateUser,
  deleteUser,
  getAllItems,
  updateItem,
  deleteItem,
} = require('../controllers/adminController');
const { getReports, resolveReport } = require('../controllers/reportController');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken, authorizeAdmin);

router.get('/users', getAllUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

router.get('/items', getAllItems);
router.put('/items/:id', updateItem);
router.delete('/items/:id', deleteItem);

router.get('/reports', getReports);
router.put('/reports/:id', resolveReport);

module.exports = router;

