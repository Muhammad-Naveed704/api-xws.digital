import Blog from "../models/Blog.model.js";

// Get all blogs with filters
export const listBlogs = async (req, res, next) => {
  try {
    const { 
      category, 
      tag, 
      featured, 
      published,
      search,
      limit = 10,
      page = 1,
      sort = '-createdAt'
    } = req.query;

    const query = {};
    
    // Build query
    if (category) query.category = category;
    if (tag) query.tags = tag;
    if (featured !== undefined) query.featured = featured === 'true';
    if (published !== undefined) {
      query.published = published === 'true';
    } else {
      // Default: only show published blogs
      query.published = true;
    }

    // Search in title, excerpt, and content
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const blogs = await Blog.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-content'); // Don't send full content in list

    const total = await Blog.countDocuments(query);

    res.json({
      blogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
};

// Get blog by slug
export const getBlogBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const blog = await Blog.findOne({ slug, published: true });
    
    if (!blog) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    // Increment views
    blog.views += 1;
    await blog.save();

    res.json(blog);
  } catch (err) {
    next(err);
  }
};

// Get related blogs (same category or tags)
export const getRelatedBlogs = async (req, res, next) => {
  try {
    const { slug, limit = 3 } = req.query;
    const currentBlog = await Blog.findOne({ slug });
    
    if (!currentBlog) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    const related = await Blog.find({
      _id: { $ne: currentBlog._id },
      published: true,
      $or: [
        { category: currentBlog.category },
        { tags: { $in: currentBlog.tags } },
      ],
    })
      .limit(parseInt(limit))
      .select('-content')
      .sort('-createdAt');

    res.json(related);
  } catch (err) {
    next(err);
  }
};

// Get categories
export const getCategories = async (req, res, next) => {
  try {
    const categories = await Blog.distinct('category', { published: true });
    res.json(categories);
  } catch (err) {
    next(err);
  }
};

// Get tags
export const getTags = async (req, res, next) => {
  try {
    const tags = await Blog.distinct('tags', { published: true });
    res.json(tags.filter(Boolean));
  } catch (err) {
    next(err);
  }
};

// Create blog (Admin only - add auth middleware later)
export const createBlog = async (req, res, next) => {
  try {
    const {
      title,
      slug,
      excerpt,
      content,
      category,
      tags,
      featured,
      published,
      author,
      seo,
      ...rest
    } = req.body;

    // Validate required fields
    if (!title || !excerpt || !content || !category) {
      return res.status(400).json({
        message: "title, excerpt, content, and category are required",
      });
    }

    // Parse tags if string
    let parsedTags = tags;
    if (typeof tags === "string") {
      try {
        parsedTags = JSON.parse(tags);
      } catch {
        parsedTags = String(tags)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }

    // Handle featured image
    let featuredImage;
    if (req.files?.featuredImage && req.files.featuredImage[0]) {
      featuredImage = req.files.featuredImage[0].path
        .replaceAll("\\", "/")
        .replace("public/", "");
    }

    // Generate slug if not provided
    let finalSlug = slug;
    if (!finalSlug) {
      finalSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    // Check for duplicate slug
    const exists = await Blog.findOne({ slug: finalSlug });
    if (exists) {
      return res.status(409).json({ message: "Slug already exists" });
    }

    // Calculate reading time
    const wordCount = content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);

    const payload = {
      title,
      slug: finalSlug,
      excerpt,
      content,
      category,
      tags: parsedTags || [],
      featured: featured === true || featured === 'true' || featured === '1',
      published: published !== false && published !== 'false' && published !== '0',
      featuredImage,
      author: author || { name: "Xws Solution" },
      seo: seo || {},
      readingTime,
      ...rest,
    };

    const blog = await Blog.create(payload);
    res.status(201).json(blog);
  } catch (err) {
    next(err);
  }
};

// Update blog
export const updateBlog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payload = { ...req.body };

    // Handle featured image
    if (req.files?.featuredImage && req.files.featuredImage[0]) {
      payload.featuredImage = req.files.featuredImage[0].path
        .replaceAll("\\", "/")
        .replace("public/", "");
    }

    // Parse tags if string
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

    // Boolean conversions
    if (typeof payload.featured !== "undefined") {
      payload.featured =
        payload.featured === "true" ||
        payload.featured === "on" ||
        payload.featured === "1";
    }

    if (typeof payload.published !== "undefined") {
      payload.published =
        payload.published !== "false" &&
        payload.published !== "off" &&
        payload.published !== "0";
    }

    // Recalculate reading time if content changed
    if (payload.content) {
      const wordCount = payload.content.split(/\s+/).length;
      payload.readingTime = Math.ceil(wordCount / 200);
    }

    const updated = await Blog.findByIdAndUpdate(id, payload, { new: true });
    if (!updated) {
      return res.status(404).json({ message: "Blog not found" });
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// Delete blog
export const deleteBlog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await Blog.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Blog not found" });
    }
    res.json({ message: "Blog deleted successfully" });
  } catch (err) {
    next(err);
  }
};

export default {
  listBlogs,
  getBlogBySlug,
  getRelatedBlogs,
  getCategories,
  getTags,
  createBlog,
  updateBlog,
  deleteBlog,
};
