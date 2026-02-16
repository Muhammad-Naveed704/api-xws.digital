import mongoose from "mongoose";
const { Schema } = mongoose;

const blogSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    excerpt: { type: String, required: true }, // Short description
    content: { type: String, required: true }, // Full blog content (HTML/Markdown)
    featuredImage: { type: String },
    category: { type: String, required: true, index: true },
    tags: [{ type: String, index: true }],
    author: {
      name: { type: String, required: true, default: "Xws Solution" },
      email: { type: String },
      avatar: { type: String },
    },
    featured: { type: Boolean, default: false, index: true },
    published: { type: Boolean, default: true, index: true },
    publishedAt: { type: Date, default: Date.now },
    readingTime: { type: Number }, // in minutes
    views: { type: Number, default: 0 },
    seo: {
      metaTitle: { type: String },
      metaDescription: { type: String },
      keywords: [{ type: String }],
    },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Calculate reading time before saving
blogSchema.pre('save', function(next) {
  if (this.content) {
    // Average reading speed: 200 words per minute
    const wordCount = this.content.split(/\s+/).length;
    this.readingTime = Math.ceil(wordCount / 200);
  }
  next();
});

// Generate slug from title if not provided
blogSchema.pre('save', function(next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

const Blog = mongoose.model('Blog', blogSchema);
export default Blog;
