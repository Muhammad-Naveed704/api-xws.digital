import mongoose from "mongoose";
const { Schema } = mongoose;

const contactMessageSchema = new Schema(
  {
    name: { type: String, required: true, minlength: 2, maxlength: 120 },
    email: { type: String, required: true },
    message: { type: String, required: true, minlength: 10, maxlength: 4000 },
    status: { type: String, enum: ['new', 'read', 'archived'], default: 'new' }
  },
  { timestamps: true }
);

const ContactMessage = mongoose.model('ContactMessage', contactMessageSchema);
export default ContactMessage;

