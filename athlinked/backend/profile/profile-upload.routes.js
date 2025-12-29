const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'profile');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'profile-' + uniqueSuffix + ext);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = /\.(png|jpeg|jpg|gif)$/i;
  const allowedMimeTypes = /^image\/(png|jpeg|jpg|gif)/;

  const hasValidExtension = allowedExtensions.test(file.originalname);
  const hasValidMimeType = allowedMimeTypes.test(file.mimetype);

  if (hasValidExtension && hasValidMimeType) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files (PNG, JPG, GIF) are allowed'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: fileFilter,
});

/**
 * POST /api/profile/upload
 * Upload profile or cover image
 */
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    const fileUrl = `/uploads/profile/${req.file.filename}`;
    
    return res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      fileUrl: fileUrl,
      filename: req.file.filename,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload file',
    });
  }
});

module.exports = router;

