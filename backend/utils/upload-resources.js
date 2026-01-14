const multer = require('multer');
const { uploadToS3, generateS3Key } = require('./s3');

// Use memory storage since we'll upload directly to S3
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Infer resource type from URL first (most reliable since body may not be parsed yet)
  // Use originalUrl which is always available
  const url = req.originalUrl || req.url || req.path || '';
  let inferredResourceType = null;
  
  if (url.includes('/templates')) {
    inferredResourceType = 'template';
  } else if (url.includes('/videos')) {
    inferredResourceType = 'video';
  }
  
  // Also check body if available (may be parsed by some middleware)
  if (!inferredResourceType && req.body?.resource_type) {
    inferredResourceType = req.body.resource_type;
  }
  
  console.log('File filter - URL:', url, 'inferredResourceType:', inferredResourceType, 'mimetype:', file.mimetype, 'originalname:', file.originalname);
  
  // Articles should not accept any file uploads - only links
  if (inferredResourceType === 'article') {
    return cb(
      new Error('Articles only accept links, not file uploads')
    );
  }
  
  // For video resources, accept all video MIME types only
  if (inferredResourceType === 'video') {
    if (file.mimetype && file.mimetype.startsWith('video/')) {
      console.log('Video file accepted');
      return cb(null, true);
    } else {
      console.log('File rejected - not a video file');
      return cb(
        new Error('Only video files are allowed for video library')
      );
    }
  }
  
  // For template resources, only accept PDF files
  if (inferredResourceType === 'template') {
    const isPdf = file.mimetype === 'application/pdf' || /\.pdf$/i.test(file.originalname);
    if (isPdf) {
      console.log('PDF file accepted for template');
      return cb(null, true);
    } else {
      console.log('File rejected - not a PDF for template. mimetype:', file.mimetype, 'originalname:', file.originalname);
      return cb(
        new Error('Only PDF files are allowed for templates')
      );
    }
  }
  
  // If resource_type is not specified, check if it's a video file
  // This handles /api/videos endpoint which doesn't send resource_type
  const isVideo = file.mimetype && file.mimetype.startsWith('video/');
  if (isVideo) {
    // Accept all video files when no resource_type is specified (for /api/videos endpoint)
    console.log('Video file accepted (fallback)');
    return cb(null, true);
  }
  
  // If resource_type is not specified and it's not a video, reject
  console.log('File rejected - no resource type match. URL:', url);
  cb(
    new Error(
      'Invalid file type. Videos must be video files, templates must be PDF files, and articles only accept links.'
    )
  );
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
  fileFilter: fileFilter,
});

// Middleware to upload file to S3 after multer processes it
const uploadToS3Middleware = async (req, res, next) => {
  if (req.file) {
    try {
      let prefix = 'resources';
      if (req.body && req.body.resource_type) {
        if (req.body.resource_type === 'video') {
          prefix = 'resources';
        } else if (req.body.resource_type === 'template') {
          prefix = 'resources';
        }
      }

      const s3Key = generateS3Key(prefix, req.file.originalname, req.file.mimetype);
      const s3Url = await uploadToS3(req.file.buffer, s3Key, req.file.mimetype);
      
      // Store S3 URL in req.file.location for controllers to use
      req.file.location = s3Url;
      req.file.s3Key = s3Key;
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
