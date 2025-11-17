const mongoose = require("mongoose");
const { Schema } = mongoose;
const messageSchema = new Schema(
  {
    senderId: { type: Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    receiverId: { type: Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
