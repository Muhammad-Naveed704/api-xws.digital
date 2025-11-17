const express = require("express");
const router = express.Router();
const { createExperience, listExperience, updateExperience, getExperienceById } = require('../../../../controllers/portfolio-controller/experienceController.js');
const { fileUpload } = require("../../../../middleware/file-upload.js");

const uploadExperienceLogo = fileUpload(
  "experience", 
  ["image"],  
  [{ name: "logo", maxCount: 1 }]
);

router.get('/', listExperience);
router.get('/:id', getExperienceById);
router.post('/create', uploadExperienceLogo, createExperience);
router.put('/:id', uploadExperienceLogo, updateExperience);

module.exports = router;
