import express from "express";
import { createExperience, listExperience, updateExperience, getExperienceById } from "../controllers/experience.Controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

const uploadExperienceLogo = upload.fields([{ name: "logo", maxCount: 1 }]);

router.get('/', listExperience);
router.get('/:id', getExperienceById);
router.post('/create', uploadExperienceLogo, createExperience);
router.put('/:id', uploadExperienceLogo, updateExperience);

export default router;
