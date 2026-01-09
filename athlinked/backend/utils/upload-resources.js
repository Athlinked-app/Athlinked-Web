const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
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
    let prefix = 'resource-';
    if (req.body && req.body.resource_type) {
      if (req.body.resource_type === 'video') {
        prefix = 'resource-video-';
      } else if (req.body.resource_type === 'template') {
        prefix = 'resource-template-';
      }
    }
    cb(null, prefix + uniqueSuffix + ext);
  },
});

const fileFilter = (req, file, cb) => {
  const resourceType = req.body?.resource_type;
  
  // Articles should not accept any file uploads - only links
  if (resourceType === 'article') {
    return cb(
      new Error('Articles only accept links, not file uploads')
    );
  }
  
  // For video resources, accept all video MIME types only
  if (resourceType === 'video') {
    if (file.mimetype && file.mimetype.startsWith('video/')) {
      return cb(null, true);
    } else {
      return cb(
        new Error('Only video files are allowed for video library')
      );
    }
  }
  
  // For template resources, only accept PDF files
  if (resourceType === 'template') {
    const isPdf = file.mimetype === 'application/pdf' || /\.pdf$/i.test(file.originalname);
    if (isPdf) {
      return cb(null, true);
    } else {
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
    return cb(null, true);
  }
  
  // If resource_type is not specified and it's not a video, reject
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

module.exports = upload;
