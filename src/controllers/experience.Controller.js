import Experience from "../models/Experience.model.js";

export const listExperience = async (req, res, next) => {
  try {
    const items = await Experience.find({}).sort({ order: 1, createdAt: -1 });
    res.json(items);
  } catch (err) {
    next(err);
  }
}

export const createExperience = async (req, res, next) => {
  try {
    const { company, title, period, bullets = [], location, website, order = 0 } = req.body;
    if (!company || !title || !period) return res.status(400).json({ message: 'company, title, period required' });
    
    let logoPath;
    if (req.files && req.files.logo && req.files.logo[0]) {
      logoPath = req.files.logo[0].path.replaceAll("\\", "/").replace("public/", "");
    }
    const doc = await Experience.create({ company, title, period, bullets, location, website, order, logo: logoPath });
    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
}

export const updateExperience = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payload = req.body || {};

   
    if (req.files && req.files.logo && req.files.logo[0]) {
      payload.logo = req.files.logo[0].path
        .replaceAll("\\", "/")
        .replace("public/", "");
    }

    const updated = await Experience.findByIdAndUpdate(id, payload, { new: true });
    if (!updated) {
      return res.status(404).json({ message: "Experience not found" });
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
};


export const getExperienceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doc = await Experience.findById(id);
    if (!doc) return res.status(404).json({ message: 'Experience not found' });
    res.json(doc);
  } catch (err) {
    next(err);
  }
}

export default { listExperience, createExperience, updateExperience, getExperienceById };


