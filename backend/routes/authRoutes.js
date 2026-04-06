const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
const multer = require('multer');


const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 }, // 2 Mo max
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Seules les images sont acceptées.'));
    },
});
router.post('/activate', authController.activateUser);
router.post('/login', authController.login);
router.post('/verify-2fa', authController.verify2FA);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/admin/activity-logs', verifyToken, isAdmin, authController.getActivityLogs);
router.put('/profile', verifyToken, authController.updateProfile);
router.post('/avatar', verifyToken, upload.single('avatar'), authController.uploadAvatar);
router.put('/password',   verifyToken, authController.changePassword);

module.exports = router;