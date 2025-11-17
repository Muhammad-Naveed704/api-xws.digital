const express = require("express");
const router = express.Router();
const { createMessage, listMessages } = require('../../../../controllers/portfolio-controller/contactController.js');



router.post('/create', createMessage);
router.get('/get', listMessages);

module.exports = router;


