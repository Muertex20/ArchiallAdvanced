const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

router.post('/uploads', upload.single('file'), uploadController.uploadFile);
router.get('/archivos/:idRepositorio', uploadController.getFiles);
router.delete('/archivo/:id', uploadController.deleteFile);
router.get('/download/:filename', uploadController.downloadFile);

module.exports = router;
