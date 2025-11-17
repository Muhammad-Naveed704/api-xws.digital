import express from "express";
import { createProject, getProjectBySlug, listProjects, updateProject } from "../controllers/projects.Controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

const uploadProjectFiles = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "gallery", maxCount: 10 },
]);

router.get('/', listProjects);
router.get('/:slug', getProjectBySlug);
router.post('/create', uploadProjectFiles, createProject);
router.put('/:id', uploadProjectFiles, updateProject);

export default router;
