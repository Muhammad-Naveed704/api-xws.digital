import express from "express";
import { createMessage, listMessages } from "../controllers/contact.Controller.js";
const router = express.Router();

router.post('/create', createMessage);
router.get('/get', listMessages);

export default router;


