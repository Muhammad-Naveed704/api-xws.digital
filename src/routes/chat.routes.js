import express from "express";
import { getMessages, listConversations, sendMessage, sendAnonymousMessage, getAnonymousMessages } from "../controllers/chat.Controller.js";
const router = express.Router();

router.get('/conversations', listConversations);
router.get('/messages/:userId', getMessages);
router.post('/messages', sendMessage);

router.post('/anonymous/send', sendAnonymousMessage);
router.get('/anonymous/history', getAnonymousMessages);

export default router;


