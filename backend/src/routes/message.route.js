import express from 'express';
import { sendMessage, getMessages, deleteMessage } from '../controllers/message.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply auth protection to all routes
router.use(protectRoute);

// Get messages with a specific user or group
router.get('/:otherUserId', getMessages);

// Send a message to a user or group
router.post('/send/:receiverId', sendMessage);

// Delete a message
router.delete('/:messageId', deleteMessage);

export default router;
