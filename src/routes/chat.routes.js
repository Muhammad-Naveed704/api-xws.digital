import express from "express";
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
} from "../controllers/chat.Controller.js";
const router = express.Router();

// Authenticated routes
router.get('/conversations', listConversations);
router.get('/messages/:userId', getMessages);
router.post('/messages', sendMessage);

// Anonymous/Support chat routes
router.post('/anonymous/send', sendAnonymousMessage);
router.get('/anonymous/history', getAnonymousMessages);

// Guest user routes (no authentication required)
router.post('/guest/init', initializeGuestUser);
router.get('/users/online', getOnlineUsers);
router.post('/guest/send', sendGuestMessage);
router.get('/guest/messages/:userId', getGuestMessages);

export default router;


