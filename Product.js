const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  price:       { type: Number, required: true, min: 0 },
  category:    { type: String, required: true, enum: ["Tops", "Bottoms", "Dresses", "Formal", "Sport", "Outerwear"] },
  imageUrl:    { type: String, required: true },
  sizes:       [{ type: String }],
  inStock:     { type: Boolean, default: true },
  featured:    { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("Product", schema);
