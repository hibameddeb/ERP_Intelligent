const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/notificationController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

router.get('/',            verifyToken, isAdmin, ctrl.getNotifications);
router.get('/unread',      verifyToken, isAdmin, ctrl.getUnreadCount);
router.put('/:id/read',    verifyToken, isAdmin, ctrl.markAsRead);
router.put('/read-all',    verifyToken, isAdmin, ctrl.markAllAsRead);
router.delete('/:id',      verifyToken, isAdmin, ctrl.deleteNotification);

module.exports = router;