const multer = require('multer');
const { uploadToS3, generateS3Key } = require('./s3');

// Use memory storage since we'll upload directly to S3
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Get resource type from body (if available) or infer from request URL
  const resourceType = req.body?.resource_type;
  const requestUrl = req.originalUrl || req.url || '';
  
  // Determine resource type from URL if not in body
  let inferredType = resourceType;
  if (!inferredType) {
    if (requestUrl.includes('/templates') || requestUrl.includes('templates')) {
      inferredType = 'template';
    } else if (requestUrl.includes('/videos') || requestUrl.includes('videos')) {
      inferredType = 'video';
    } else if (requestUrl.includes('/articles') || requestUrl.includes('articles')) {
      inferredType = 'article';
    }
  }

  console.log('File filter:', {
    resourceType,
    inferredType,
    requestUrl,
    mimetype: file.mimetype,
    originalname: file.originalname,
  });

  // Articles should not accept any file uploads - only links
  if (inferredType === 'article' || resourceType === 'article') {
    return cb(new Error('Articles only accept links, not file uploads'));
  }

  // For video resources, accept all video MIME types only
  if (inferredType === 'video' || resourceType === 'video') {
    if (file.mimetype && file.mimetype.startsWith('video/')) {
      console.log('Video file accepted');
      return cb(null, true);
    } else {
      return cb(new Error('Only video files are allowed for video library'));
    }
  }

  // For template resources, only accept PDF files
  if (inferredType === 'template' || resourceType === 'template') {
    const isPdf =
      file.mimetype === 'application/pdf' || /\.pdf$/i.test(file.originalname);
    if (isPdf) {
      console.log('PDF file accepted for template');
      return cb(null, true);
    } else {
      return cb(new Error('Only PDF files are allowed for templates'));
    }
  }

  // Fallback: If URL indicates templates and file is PDF, accept it
  if (requestUrl.includes('/templates') || requestUrl.includes('templates')) {
    const isPdf =
      file.mimetype === 'application/pdf' || /\.pdf$/i.test(file.originalname);
    if (isPdf) {
      console.log('PDF file accepted for template (URL-based fallback)');
      return cb(null, true);
    }
  }

  // If resource_type is not specified, check if it's a video file
  // This handles /api/videos endpoint which doesn't send resource_type
  const isVideo = file.mimetype && file.mimetype.startsWith('video/');
  if (isVideo) {
    // Accept all video files when no resource_type is specified (for /api/videos endpoint)
    // OR if URL indicates videos endpoint
    if (requestUrl.includes('/videos') || requestUrl.includes('videos')) {
      console.log('Video file accepted (URL-based fallback)');
      return cb(null, true);
    }
    // Also accept if no specific endpoint (general fallback)
    console.log('Video file accepted (fallback)');
    return cb(null, true);
  }

  // If resource_type is not specified and it's not a video, reject
  console.log('File rejected - no resource type match', {
    resourceType,
    inferredType,
    requestUrl,
    mimetype: file.mimetype,
  });
  cb(
    new Error(
      'Invalid file type. Videos must be video files, templates must be PDF files, and articles only accept links.'
    )
  );
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
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

      // Ensure we have a buffer (should always be available with memoryStorage)
      if (!req.file.buffer) {
        return res.status(500).json({
          success: false,
          message: 'File buffer is missing. Please ensure file was uploaded correctly.',
        });
      }

      const s3Key = generateS3Key(prefix, req.file.originalname, req.file.mimetype);
      const s3Url = await uploadToS3(req.file.buffer, s3Key, req.file.mimetype);
      
      // Store S3 URL in req.file.location for controllers to use
      req.file.location = s3Url;
      req.file.s3Key = s3Key;
      console.log('File uploaded to S3:', s3Url);
    } catch (error) {
      console.error('S3 upload error:', error);
      return res.status(500).json({
        success: false,
        message: `Failed to upload file to S3: ${error.message}`,
      });
    }
  }
  next();
};

module.exports = { upload, uploadToS3Middleware };
