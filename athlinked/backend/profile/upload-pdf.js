const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'profile', 'pdfs');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log('Saving file to:', uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const filename = 'pdf-' + uniqueSuffix + ext;
    console.log('Generated filename:', filename);
    cb(null, filename);
  },
});

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

module.exports = upload;
