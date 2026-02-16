import express from "express";
import {
  listBlogs,
  getBlogBySlug,
  getRelatedBlogs,
  getCategories,
  getTags,
  createBlog,
  updateBlog,
  deleteBlog,
} from "../controllers/blog.Controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

const uploadBlogFiles = upload.fields([
  { name: "featuredImage", maxCount: 1 },
]);

// Public routes
router.get("/", listBlogs);
router.get("/categories", getCategories);
router.get("/tags", getTags);
router.get("/related", getRelatedBlogs);
router.get("/:slug", getBlogBySlug);

// Admin routes (add auth middleware later)
router.post("/create", uploadBlogFiles, createBlog);
router.put("/:id", uploadBlogFiles, updateBlog);
router.delete("/:id", deleteBlog);

export default router;
