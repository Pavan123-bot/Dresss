const router   = require("express").Router();
const multer   = require("multer");
const Product  = require("../models/Product");
const auth     = require("../middleware/auth");
const admin    = require("../middleware/admin");
const { uploadFile } = require("../utils/storage");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_, file, cb) =>
    file.mimetype.startsWith("image/") ? cb(null, true) : cb(new Error("Images only.")),
});

// GET /api/products
router.get("/", async (req, res) => {
  try {
    const { category, search } = req.query;
    const q = { inStock: true };
    if (category && category !== "All") q.category = category;
    if (search) q.name = { $regex: search, $options: "i" };
    const products = await Product.find(q).sort({ createdAt: -1 });
    res.json({ products });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/all  (admin - includes out-of-stock)
router.get("/all", auth, admin, async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json({ products });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/:id
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found." });
    res.json({ product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/products  (admin)
router.post("/", auth, admin, upload.single("image"), async (req, res) => {
  try {
    const { name, description, price, category, sizes } = req.body;
    if (!name || !price || !category) return res.status(400).json({ error: "name, price, category required." });
    if (!req.file) return res.status(400).json({ error: "Product image required." });

    const imageUrl = await uploadFile(
      req.file.buffer,
      `products/${Date.now()}-${req.file.originalname}`,
      req.file.mimetype
    );

    const product = await Product.create({
      name, description, price: Number(price), category, imageUrl,
      sizes: sizes ? sizes.split(",").map(s => s.trim()).filter(Boolean) : ["XS", "S", "M", "L", "XL"],
    });
    res.status(201).json({ product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/products/:id  (admin)
router.put("/:id", auth, admin, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ error: "Product not found." });
    res.json({ product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/products/:id  (admin)
router.delete("/:id", auth, admin, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
