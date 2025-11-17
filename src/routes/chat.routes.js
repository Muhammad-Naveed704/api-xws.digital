const express = require("express");
const router = express.Router();

// const { getMessages, listConversations, sendMessage, sendAnonymousMessage, getAnonymousMessages } = require('../../../../controllers/Admin/portfolio-controller/chatController.js');
const { getMessages, listConversations, sendMessage, sendAnonymousMessage, getAnonymousMessages } = require('../../../../controllers/portfolio-controller/chatController.js');

router.get('/conversations', listConversations);
router.get('/messages/:userId', getMessages);
router.post('/messages', sendMessage);

router.post('/anonymous/send', sendAnonymousMessage);
router.get('/anonymous/history', getAnonymousMessages);

module.exports = router;


