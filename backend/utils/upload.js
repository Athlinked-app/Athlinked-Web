const multer = require('multer');
const { uploadToS3, generateS3Key } = require('./s3');

// Use memory storage since we'll upload directly to S3
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedExtensions = /\.(mp4|mov|png|jpeg|jpg|gif)$/i;
  const allowedMimeTypes =
    /^(video\/(mp4|quicktime)|image\/(png|jpeg|jpg|gif))/;

  const hasValidExtension = allowedExtensions.test(file.originalname);
  const hasValidMimeType = allowedMimeTypes.test(file.mimetype);

  if (hasValidExtension && hasValidMimeType) {
    return cb(null, true);
  } else {
    cb(
      new Error(
        'Only video (MP4, MOV) and image (PNG, JPG, GIF) files are allowed'
      )
    );
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: fileFilter,
});

// Middleware to upload file to S3 after multer processes it
const uploadToS3Middleware = async (req, res, next) => {
  if (req.file) {
    try {
      // Check if buffer exists (should always be available with memoryStorage)
      if (!req.file.buffer) {
        console.error('File buffer is missing:', {
          file: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
        });
        return res.status(500).json({
          success: false,
          message: 'File buffer is missing. Please ensure file was uploaded correctly.',
        });
      }

      // Determine prefix based on route or body
      let prefix = 'posts';
      if (req.path && req.path.includes('/clips')) {
        prefix = 'clips';
      } else if (req.body && req.body.post_type) {
        prefix = req.body.post_type === 'video' ? 'posts' : 'posts';
      }

      console.log('Uploading to S3:', {
        prefix,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.buffer.length,
      });

      const s3Key = generateS3Key(prefix, req.file.originalname, req.file.mimetype);
      const s3Url = await uploadToS3(req.file.buffer, s3Key, req.file.mimetype);
      
      // Store S3 URL in req.file.location for controllers to use
      req.file.location = s3Url;
      req.file.s3Key = s3Key;
      
      console.log('File uploaded successfully to S3:', s3Url);
    } catch (error) {
      console.error('S3 upload error in middleware:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        name: error.name,
        stack: error.stack,
      });
      return res.status(500).json({
        success: false,
        message: `Failed to upload file to S3: ${error.message}`,
      });
    }
  }
  next();
};

module.exports = { upload, uploadToS3Middleware };
