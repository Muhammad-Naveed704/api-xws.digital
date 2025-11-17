import Project from "../models/Project.model.js";

export const listProjects = async (req, res, next) => {
  try {
    const { tag, featured } = req.query;
    const query = {};
    if (tag) query.tags = tag;
    if (featured) query.featured = featured === 'true';
    const projects = await Project.find(query).sort({ order: 1, createdAt: -1 });
    res.json(projects);
  } catch (err) {
    next(err);
  }
}

export const getProjectBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const project = await Project.findOne({ slug });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (err) {
    next(err);
  }
}

export const createProject = async (req, res, next) => {
  try {
    // Destructure body fields
    let {
      title,
      slug,
      description,
      featured,
      techStack,
      tags,
      ...rest
    } = req.body;

    // Validate required fields
    if (!title || !slug || !description) {
      return res
        .status(400)
        .json({ message: "title, slug, description required" });
    }

    // Coerce boolean field
    if (typeof featured !== "undefined") {
      featured =
        featured === "true" || featured === "on" || featured === "1";
    }

    // Parse techStack
    if (typeof techStack === "string") {
      try {
        techStack = JSON.parse(techStack);
      } catch {
        techStack = String(techStack)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }

    // Parse tags
    if (typeof tags === "string") {
      try {
        tags = JSON.parse(tags);
      } catch {
        tags = String(tags)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }

    // Check for duplicate slug
    const exists = await Project.findOne({ slug });
    if (exists) {
      return res.status(409).json({ message: "Slug already exists" });
    }

    // Handle single image (logo/feature image)
    let imagePath;
    if (req.files && req.files.image && req.files.image[0]) {
      imagePath = req.files.image[0].path
        .replaceAll("\\", "/")
        .replace("public/", "");
    }

    // Handle gallery (multiple images)
    let galleryPaths = [];
    if (req.files && req.files.gallery && req.files.gallery.length > 0) {
      galleryPaths = req.files.gallery.map((file) =>
        file.path.replaceAll("\\", "/").replace("public/", "")
      );
    }

    // Prepare payload
    const payload = {
      title,
      slug,
      description,
      featured,
      techStack,
      tags,
      image: imagePath,
      gallery: galleryPaths,
      ...rest,
    };

    // Save project
    const doc = await Project.create(payload);
    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payload = { ...req.body };

    // Handle new image file
    if (req.files?.image && req.files.image[0]) {
      payload.image = req.files.image[0].path.replaceAll("\\", "/").replace("public/", "");
    }

    // Handle new gallery files
    if (req.files?.gallery && req.files.gallery.length > 0) {
      payload.gallery = req.files.gallery.map((file) =>
        file.path.replaceAll("\\", "/").replace("public/", "")
      );
    }

    // Boolean conversion for "featured"
    if (typeof payload.featured !== "undefined") {
      payload.featured =
        payload.featured === "true" ||
        payload.featured === "on" ||
        payload.featured === "1";
    }

    // Parse techStack & tags if they are strings
    if (typeof payload.techStack === "string") {
      try {
        payload.techStack = JSON.parse(payload.techStack);
      } catch {
        payload.techStack = String(payload.techStack)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }

    if (typeof payload.tags === "string") {
      try {
        payload.tags = JSON.parse(payload.tags);
      } catch {
        payload.tags = String(payload.tags)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }

    const updated = await Project.findByIdAndUpdate(id, payload, { new: true });
    if (!updated) return res.status(404).json({ message: "Project not found" });

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

export default { listProjects, getProjectBySlug, createProject, updateProject };


