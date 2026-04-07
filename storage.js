"use strict";

const fs   = require("fs");
const path = require("path");

const UPLOADS_DIR = path.join(__dirname, "../uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Try to load sharp — gracefully skip compression if it fails (e.g. bad native build)
let sharp;
try {
  sharp = require("sharp");
} catch (e) {
  console.warn("[storage] sharp not available — skipping image compression:", e.message);
}

// Try to load S3 — only if AWS env vars are present
const useS3 = () => !!(process.env.AWS_ACCESS_KEY && process.env.AWS_SECRET_KEY && process.env.S3_BUCKET);

let s3Client;
let PutObjectCommand;

if (useS3()) {
  try {
    const sdk = require("@aws-sdk/client-s3");
    PutObjectCommand = sdk.PutObjectCommand;
    s3Client = new sdk.S3Client({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId:     process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY,
      },
    });
  } catch (e) {
    console.warn("[storage] @aws-sdk/client-s3 not available:", e.message);
  }
}

/**
 * Upload a buffer. Returns a publicly accessible URL.
 * Falls back to local disk when S3 is not configured.
 */
async function uploadFile(buffer, key, mimetype) {
  mimetype = mimetype || "image/jpeg";

  // Compress images if sharp is available
  let processed = buffer;
  if (sharp && mimetype.startsWith("image/")) {
    try {
      processed = await sharp(buffer)
        .resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 88 })
        .toBuffer();
      mimetype = "image/jpeg";
      key = key.replace(/\.[^.]+$/, ".jpg");
    } catch (e) {
      console.warn("[storage] Image compression failed, using original:", e.message);
    }
  }

  // S3 upload
  if (useS3() && s3Client) {
    await s3Client.send(new PutObjectCommand({
      Bucket:      process.env.S3_BUCKET,
      Key:         key,
      Body:        processed,
      ContentType: mimetype,
    }));
    return "https://" + process.env.S3_BUCKET + ".s3." + (process.env.AWS_REGION || "us-east-1") + ".amazonaws.com/" + key;
  }

  // Local disk fallback
  const filename = key.replace(/[/\\]/g, "_");
  fs.writeFileSync(path.join(UPLOADS_DIR, filename), processed);

  // Build public URL — use RENDER_EXTERNAL_URL on Render, else localhost
  const base = process.env.RENDER_EXTERNAL_URL
    ? process.env.RENDER_EXTERNAL_URL.replace(/\/$/, "")
    : "http://localhost:" + (process.env.PORT || 5000);

  return base + "/uploads/" + filename;
}

module.exports = { uploadFile, useS3 };
