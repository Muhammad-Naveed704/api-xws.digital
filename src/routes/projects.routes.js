const express = require("express");
const router = express.Router();
const { createProject, getProjectBySlug, listProjects, updateProject } = require('../../../../controllers/portfolio-controller/projectsController.js');
const { fileUpload } = require("../../../../middleware/file-upload.js");

// const uploadProjectLogo = fileUpload(
//   "projects", // folder name
//   ["image"],  // allowed mime types
//   [{ name: "image", maxCount: 1 }]
// );

// const uploadProjectGallery = fileUpload(
//   "projects", // folder name
//   ["image"],  // allowed mime types
//   [{ name: "gallery", maxCount: 10 }]
// );
const uploadProjectFiles = fileUpload(
  "projects", // folder name
  ["image"],  // allowed mime types
  [
    { name: "image", maxCount: 1 },     // single image
    { name: "gallery", maxCount: 10 },  // multiple gallery images
  ]
);
router.get('/', listProjects);
router.get('/:slug', getProjectBySlug);
router.post('/create', uploadProjectFiles, createProject);
router.put('/:id', uploadProjectFiles, updateProject);

module.exports = router;
