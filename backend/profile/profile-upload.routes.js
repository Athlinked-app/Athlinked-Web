const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadToS3, generateS3Key } = require('../utils/s3');

// Use memory storage since we'll upload directly to S3
const storage = multer.memoryStorage();

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
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    // Upload to S3
    try {
      const s3Key = generateS3Key('profile', req.file.originalname, req.file.mimetype);
      const s3Url = await uploadToS3(req.file.buffer, s3Key, req.file.mimetype);

      return res.status(200).json({
        success: true,
        message: 'File uploaded successfully',
        fileUrl: s3Url,
        filename: req.file.originalname,
      });
    } catch (s3Error) {
      console.error('S3 upload error:', s3Error);
      return res.status(500).json({
        success: false,
        message: `Failed to upload file to S3: ${s3Error.message}`,
      });
    }
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload file',
    });
  }
});

module.exports = router;
