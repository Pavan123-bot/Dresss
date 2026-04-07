const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  user:          { type: mongoose.Schema.Types.ObjectId, ref: "User",    required: true },
  product:       { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  personUrl:     { type: String, required: true },
  resultUrl:     { type: String },
  isMock:        { type: Boolean, default: false },
  isFavorite:    { type: Boolean, default: false },
  status:        { type: String, enum: ["processing", "completed", "failed"], default: "processing" },
}, { timestamps: true });

module.exports = mongoose.model("TryOnResult", schema);
