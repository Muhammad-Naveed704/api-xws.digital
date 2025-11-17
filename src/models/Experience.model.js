import mongoose from "mongoose";
const { Schema } = mongoose;

const experienceSchema = new Schema(
  {
    company: { type: String, required: true },
    title: { type: String, required: true },
    period: { type: String, required: true },
    logo: { type: String },
    bullets: { type: [String], default: [] },
    location: { type: String },
    website: { type: String },
    order: { type: Number, default: 0 }
  },
  { timestamps: true }
);

const Experience = mongoose.model('Experience', experienceSchema);
export default Experience;
