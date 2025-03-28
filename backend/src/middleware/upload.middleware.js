import multer from 'multer';

// Configure multer storage to use memory storage
const storage = multer.memoryStorage();

// Configure file filter
const fileFilter = (req, file, cb) => {
  console.log('File filter processing file:', file.originalname, file.mimetype);
  
  // Validate image file
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Only JPEG, PNG, GIF, and WebP images are allowed.`), false);
  }
};

// Configure upload limits
const limits = {
  fileSize: 5 * 1024 * 1024, // 5MB
  files: 1 // Only allow 1 file per request
};

// Create multer instance
const upload = multer({
  storage,
  fileFilter,
  limits
});

// Wrapper function to handle multer errors
export const uploadMiddleware = (req, res, next) => {
  console.log('Upload middleware processing request...');
  console.log('Request headers:', req.headers);
  console.log('Content-Type:', req.headers['content-type']);
  
  // Handle file upload if present
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // Handle multer-specific errors
      console.error('Multer error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File size too large. Maximum size is 5MB.' });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ error: 'Unexpected field name for file upload. Use "image" field.' });
      }
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    } else if (err) {
      // Handle other errors
      console.error('Upload error:', err);
      return res.status(400).json({ error: err.message });
    }

    // Log file information if uploaded
    if (req.file) {
      console.log('File uploaded to memory:', {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        buffer: req.file.buffer ? 'Buffer present' : 'No buffer'
      });
    } else {
      console.log('No file uploaded, proceeding with text-only message');
    }

    // Log body for debugging
    console.log('Request body after upload:', req.body);

    next();
  });
};
