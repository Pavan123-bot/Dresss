"use strict";

const router      = require("express").Router();
const multer      = require("multer");
const axios       = require("axios");
const auth        = require("../middleware/auth");
const Product     = require("../models/Product");
const TryOnResult = require("../models/TryOnResult");
const { uploadFile } = require("../utils/storage");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Images only."));
  },
});

/**
 * Call Replicate IDM-VTON via REST API (no ESM import needed).
 * Returns the result image URL, or throws on failure.
 */
async function runReplicateTryOn(personUrl, garmentUrl, garmentName) {
  var token = process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error("No REPLICATE_API_TOKEN");

  // Create prediction
  var createRes = await axios.post(
    "https://api.replicate.com/v1/models/cuuupid/idm-vton/predictions",
    {
      input: {
        human_img:       personUrl,
        garm_img:        garmentUrl,
        garment_des:     garmentName || "clothing item",
        is_checked:      true,
        is_checked_crop: false,
        denoise_steps:   30,
        seed:            42,
      },
    },
    {
      headers: {
        Authorization:  "Token " + token,
        "Content-Type": "application/json",
        Prefer:         "wait=60",
      },
      timeout: 120000,
    }
  );

  var prediction = createRes.data;

  // If Prefer:wait didn't return a final result, poll
  if (prediction.status !== "succeeded") {
    var pollUrl = prediction.urls && prediction.urls.get;
    if (!pollUrl) throw new Error("No poll URL from Replicate");

    for (var i = 0; i < 30; i++) {
      await new Promise(function (r) { setTimeout(r, 3000); });
      var pollRes = await axios.get(pollUrl, {
        headers: { Authorization: "Token " + token },
        timeout: 10000,
      });
      prediction = pollRes.data;
      if (prediction.status === "succeeded") break;
      if (prediction.status === "failed" || prediction.status === "canceled") {
        throw new Error("Replicate prediction failed: " + (prediction.error || prediction.status));
      }
    }
  }

  if (prediction.status !== "succeeded" || !prediction.output) {
    throw new Error("Replicate did not return output");
  }

  var output = prediction.output;
  return Array.isArray(output) ? output[0] : output;
}

// POST /api/tryon
router.post("/", auth, upload.single("photo"), async function (req, res) {
  try {
    var productId = req.body.productId;
    if (!req.file)  return res.status(400).json({ error: "Photo required." });
    if (!productId) return res.status(400).json({ error: "productId required." });

    var product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: "Product not found." });

    // Upload person photo
    var personUrl = await uploadFile(
      req.file.buffer,
      "tryon/people/" + req.user._id + "/" + Date.now() + ".jpg",
      req.file.mimetype
    );

    var isMock = !process.env.REPLICATE_API_TOKEN;
    var resultUrl = personUrl; // default fallback

    if (!isMock) {
      try {
        resultUrl = await runReplicateTryOn(personUrl, product.imageUrl, product.name);
      } catch (rErr) {
        console.error("[tryon] Replicate failed, using mock:", rErr.message);
        isMock = true;
      }
    }

    var tryOn = await TryOnResult.create({
      user:      req.user._id,
      product:   productId,
      personUrl: personUrl,
      resultUrl: resultUrl,
      isMock:    isMock,
      status:    "completed",
    });

    res.json({
      success: true,
      isMock:  isMock,
      tryOn: {
        id:         tryOn._id,
        personUrl:  personUrl,
        resultUrl:  resultUrl,
        isFavorite: false,
        product: {
          id:       product._id,
          name:     product.name,
          price:    product.price,
          imageUrl: product.imageUrl,
        },
      },
    });
  } catch (err) {
    console.error("[tryon] Error:", err.message);
    res.status(500).json({ error: "Try-on failed: " + err.message });
  }
});

// GET /api/tryon/history
router.get("/history", auth, async function (req, res) {
  try {
    var results = await TryOnResult
      .find({ user: req.user._id, status: "completed" })
      .populate("product", "name imageUrl price category")
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ results: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tryon/:id/favorite
router.post("/:id/favorite", auth, async function (req, res) {
  try {
    var r = await TryOnResult.findOne({ _id: req.params.id, user: req.user._id });
    if (!r) return res.status(404).json({ error: "Not found." });
    r.isFavorite = !r.isFavorite;
    await r.save();
    res.json({ isFavorite: r.isFavorite });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
