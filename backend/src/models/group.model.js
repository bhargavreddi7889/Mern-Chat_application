import mongoose from "mongoose";

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Changed to support multiple admins
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    role: { type: String, enum: ['admin', 'member'], default: 'member' }
  }],
  createdAt: { type: Date, default: Date.now },
  description: { type: String, default: '' }
}, {
  timestamps: true
});

// Add an index for faster querying
groupSchema.index({ "members.user": 1 });

export const Group = mongoose.model("Group", groupSchema);
