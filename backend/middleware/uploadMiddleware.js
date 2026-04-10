// uploadMiddleware.js
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/produits/');
    },
    filename: (req, file, cb) => {
        const uniqueName = `${crypto.randomUUID()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});


module.exports = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }
});