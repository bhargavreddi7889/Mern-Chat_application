import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group"
  },
  text: {
    type: String,
    default: ""
  },
  image: {
    type: String,
    default: ""
  }
}, {
  timestamps: true
});

// Add indexes for faster querying
messageSchema.index({ senderId: 1, receiverId: 1 });
messageSchema.index({ groupId: 1 });
messageSchema.index({ createdAt: 1 });

export const Message = mongoose.model("Message", messageSchema);
