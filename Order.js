const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  user:          { type: mongoose.Schema.Types.ObjectId, ref: "User",    required: true },
  product:       { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  tryOnImageUrl: { type: String },
  size:          { type: String },
  status: {
    type: String,
    enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"],
    default: "pending",
  },
  notes: { type: String },
}, { timestamps: true });

module.exports = mongoose.model("Order", schema);
