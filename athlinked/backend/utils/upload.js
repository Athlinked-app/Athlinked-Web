const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    // Determine prefix from file mimetype since req.body may not be available during file processing
    // Multer processes files before parsing form fields, so we infer from mimetype
    let prefix = 'post-media-';
    if (file.mimetype) {
      if (file.mimetype.startsWith('video/')) {
        prefix = 'post-video-';
      } else if (file.mimetype.startsWith('image/')) {
        prefix = 'post-photo-';
      }
    }
    // If req.body.post_type is available (shouldn't happen, but check as fallback)
    if (req.body && req.body.post_type) {
      prefix = req.body.post_type === 'video' ? 'post-video-' : req.body.post_type === 'photo' ? 'post-photo-' : prefix;
    }
    cb(null, prefix + uniqueSuffix + ext);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  // Accept videos and images
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

module.exports = upload;
