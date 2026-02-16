import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { 
  getMessages, 
  listConversations, 
  sendMessage, 
  sendAnonymousMessage, 
  getAnonymousMessages,
  initializeGuestUser,
  getOnlineUsers,
  sendGuestMessage,
  getGuestMessages,
  getAdminConversations,
  adminReplyToGuest,
} from "../controllers/chat.Controller.js";
const router = express.Router();

// Authenticated routes
router.get('/conversations', verifyJWT, listConversations);
router.get('/messages/:userId', verifyJWT, getMessages);
router.post('/messages', verifyJWT, sendMessage);

// Admin routes
router.get('/admin/conversations', verifyJWT, getAdminConversations);
router.post('/admin/reply', verifyJWT, adminReplyToGuest);

// Anonymous/Support chat routes
router.post('/anonymous/send', sendAnonymousMessage);
router.get('/anonymous/history', getAnonymousMessages);

// Guest user routes (no authentication required)
router.post('/guest/init', initializeGuestUser);
router.get('/users/online', getOnlineUsers);
router.post('/guest/send', sendGuestMessage);
router.get('/guest/messages/:userId', getGuestMessages);

export default router;


