const router  = require("express").Router();
const auth    = require("../middleware/auth");
const admin   = require("../middleware/admin");
const Order   = require("../models/Order");

// POST /api/orders
router.post("/", auth, async (req, res) => {
  try {
    const { productId, tryOnImageUrl, size, notes } = req.body;
    if (!productId) return res.status(400).json({ error: "productId required." });
    const order = await Order.create({ user: req.user._id, product: productId, tryOnImageUrl, size, notes });
    await order.populate("product", "name imageUrl price");
    res.status(201).json({ order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders  (user's own)
router.get("/", auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate("product", "name imageUrl price category")
      .sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/all  (admin)
router.get("/all", auth, admin, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user",    "name email")
      .populate("product", "name price")
      .sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/orders/:id/status  (admin)
router.put("/:id/status", auth, admin, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true })
      .populate("user",    "name email")
      .populate("product", "name price");
    if (!order) return res.status(404).json({ error: "Order not found." });
    res.json({ order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
