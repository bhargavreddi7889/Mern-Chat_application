import express from "express";
import multer from "multer";
import { checkAuth, login, logout, signup, updateProfile, getUsers } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Multer setup for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log('Processing file upload:', file.originalname, file.mimetype);
    
    if (file.mimetype.match(/^image\/(jpeg|jpg|png|gif|webp)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, GIF, WEBP) are allowed'), false);
    }
  }
});

// Wrapper function to handle multer errors
const handleProfileUpload = (req, res, next) => {
  console.log('Profile update request received');
  console.log('Content-Type:', req.headers['content-type']);
  
  upload.single('profilePic')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.error('Multer error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File size too large. Maximum size is 5MB.' });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ error: 'Unexpected field name for file upload. Use "profilePic" field.' });
      }
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    } else if (err) {
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
      console.log('No file uploaded, proceeding with text-only update');
    }
    
    // Log body for debugging
    console.log('Request body after upload:', req.body);
    
    next();
  });
};

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

// Protected routes
router.get("/check", protectRoute, checkAuth);
router.put("/update-profile", protectRoute, handleProfileUpload, updateProfile);
router.get("/users", protectRoute, getUsers);

export default router;
