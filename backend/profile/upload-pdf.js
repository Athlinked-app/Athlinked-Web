const multer = require('multer');
const { uploadToS3, generateS3Key } = require('../utils/s3');

// Use memory storage since we'll upload directly to S3
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  console.log('File filter - mimetype:', file.mimetype, 'originalname:', file.originalname);
  // Only accept PDF files
  if (file.mimetype === 'application/pdf' || /\.pdf$/i.test(file.originalname)) {
    console.log('PDF file accepted');
    cb(null, true);
  } else {
    console.log('File rejected - not a PDF');
    cb(new Error('Only PDF files are allowed'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: fileFilter,
});

// Middleware to upload file to S3 after multer processes it
const uploadToS3Middleware = async (req, res, next) => {
  if (req.file) {
    try {
      const s3Key = generateS3Key('profile', req.file.originalname, req.file.mimetype);
      // uploadToS3 returns the S3 key (not a presigned URL)
      const uploadedKey = await uploadToS3(req.file.buffer, s3Key, req.file.mimetype);
      
      // Store S3 key (not presigned URL) for controllers to use
      // Use s3Key explicitly to avoid confusion
      req.file.location = uploadedKey; // Keep for backward compatibility
      req.file.s3Key = uploadedKey; // Explicit S3 key (this is what should be stored in DB)
      console.log('File uploaded to S3, key:', uploadedKey);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: `Failed to upload file to S3: ${error.message}`,
      });
    }
  }
  next();
};

module.exports = { upload, uploadToS3Middleware };
