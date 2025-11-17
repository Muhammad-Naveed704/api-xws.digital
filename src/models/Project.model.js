import mongoose from "mongoose";
const { Schema } = mongoose;

const projectSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, required: true },
    longDescription: { type: String },
    image: { type: String },
    gallery: [{ type: String }],
    techStack: [{ type: String }],
    tags: [{ type: String, index: true }],
    githubUrl: { type: String },
    liveUrl: { type: String },
    featured: { type: Boolean, default: false },
    order: { type: Number, default: 0 }
  },
  { timestamps: true }
);

const Project = mongoose.model('Project', projectSchema);
export default Project;


