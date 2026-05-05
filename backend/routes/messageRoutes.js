const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/messageController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/contacts',           verifyToken, ctrl.getContacts);
router.get('/conversation/:userId', verifyToken, ctrl.getConversation);
router.post('/',                  verifyToken, ctrl.sendMessage);
router.put('/:userId/read',       verifyToken, ctrl.markAsRead);
router.get('/unread/count',       verifyToken, ctrl.getUnreadCount);

module.exports = router;