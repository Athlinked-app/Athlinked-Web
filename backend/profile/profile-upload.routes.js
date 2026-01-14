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

const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * /api/profile/upload:
 *   post:
 *     summary: Upload profile or cover image
 *     description: Upload a profile picture or cover image (PNG, JPG, GIF, max 10MB)
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Image file (PNG, JPG, GIF, max 10MB)
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 fileUrl:
 *                   type: string
 *                   example: "/uploads/profile/profile-1234567890.jpg"
 *                 filename:
 *                   type: string
 *                   example: "profile-1234567890.jpg"
 *       400:
 *         description: Bad request (no file or invalid file type)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/upload', authenticateToken, upload.single('file'), (req, res) => {
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
