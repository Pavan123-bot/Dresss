const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const schema = new mongoose.Schema({
  name:      { type: String,  required: true,  trim: true },
  email:     { type: String,  required: true,  unique: true, lowercase: true, trim: true },
  password:  { type: String,  required: true,  minlength: 6 },
  role:      { type: String,  enum: ["customer", "admin"], default: "customer" },
  avatarUrl: { type: String },
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
}, { timestamps: true });

schema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

schema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model("User", schema);
