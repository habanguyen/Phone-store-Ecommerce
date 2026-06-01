const multer = require('multer');
const fs = require('fs');
const path = require('path');

const uploadDir = path.join(__dirname, '../../uploads/products');

const ensureUploadDir = () => {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureUploadDir();
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9.-]/g, '');
    const uniqueSuffix = `${timestamp}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `product-${uniqueSuffix}-${safeName}`);
  }
});

const allowedExtensions = /\.(jpg|jpeg|png|webp)$/i;

const fileFilter = (req, file, cb) => {
  if (!allowedExtensions.test(file.originalname)) {
    return cb(new Error('Only image files are allowed for product upload.'));
  }
  cb(null, true);
};

const uploadProductFiles = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
}).fields([
  { name: 'images', maxCount: 10 },
  { name: 'thumbnail', maxCount: 1 }
]);

module.exports = {
  uploadProductFiles
};
