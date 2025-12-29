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
    } else if (file.mimetype) {
      if (file.mimetype.startsWith('video/')) {
        prefix = 'resource-video-';
      } else if (file.mimetype === 'application/pdf') {
        prefix = 'resource-template-';
      }
    }
    cb(null, prefix + uniqueSuffix + ext);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = /\.(mp4|mov|pdf)$/i;
  const allowedMimeTypes = /^(video\/(mp4|quicktime)|application\/pdf)/;

  const hasValidExtension = allowedExtensions.test(file.originalname);
  const hasValidMimeType = allowedMimeTypes.test(file.mimetype);

  if (hasValidExtension && hasValidMimeType) {
    return cb(null, true);
  } else {
    cb(
      new Error(
        'Only video files (MP4, MOV) and PDF files are allowed for resources'
      )
    );
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
  fileFilter: fileFilter,
});

module.exports = upload;

