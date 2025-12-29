const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'messages');
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
    let prefix = 'message-';
    if (file.mimetype) {
      if (file.mimetype.startsWith('video/')) {
        prefix = 'message-video-';
      } else if (file.mimetype.startsWith('image/')) {
        prefix = 'message-image-';
      } else {
        prefix = 'message-file-';
      }
    }
    cb(null, prefix + uniqueSuffix + ext);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedImageTypes = /^image\/(png|jpeg|jpg|gif|webp)$/i;
  const allowedVideoTypes = /^video\/(mp4|quicktime|webm|ogg)$/i;
  
  if (allowedImageTypes.test(file.mimetype) || allowedVideoTypes.test(file.mimetype) || file.mimetype.startsWith('application/') || file.mimetype.startsWith('text/')) {
    return cb(null, true);
  } else {
    cb(new Error('File type not allowed'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
  fileFilter: fileFilter,
});

module.exports = upload;

