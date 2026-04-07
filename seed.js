/**
 * Run: cd server && node seed.js
 * Adds sample products so the shop isn't empty on first load.
 */
require("dotenv").config();
const mongoose = require("mongoose");
const Product  = require("./models/Product");

const PRODUCTS = [
  {
    name: "Classic White Tee",
    description: "Premium cotton essential — the perfect foundation for any outfit.",
    price: 29,
    category: "Tops",
    imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&fit=crop&auto=format",
    sizes: ["XS","S","M","L","XL","XXL"],
    featured: true,
  },
  {
    name: "Oversized Hoodie",
    description: "Super-soft French terry hoodie with a relaxed, cozy fit.",
    price: 79,
    category: "Tops",
    imageUrl: "https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600&fit=crop&auto=format",
    sizes: ["S","M","L","XL"],
    featured: true,
  },
  {
    name: "Slim Fit Jeans",
    description: "Modern straight-leg denim with just the right amount of stretch.",
    price: 69,
    category: "Bottoms",
    imageUrl: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&fit=crop&auto=format",
    sizes: ["28","30","32","34","36"],
  },
  {
    name: "Floral Midi Dress",
    description: "Light and breezy midi dress with a flattering wrap silhouette.",
    price: 89,
    category: "Dresses",
    imageUrl: "https://images.unsplash.com/photo-1572804013427-4d7ca7268217?w=600&fit=crop&auto=format",
    sizes: ["XS","S","M","L"],
    featured: true,
  },
  {
    name: "Tailored Blazer",
    description: "Sharp single-breasted blazer for polished everyday looks.",
    price: 149,
    category: "Formal",
    imageUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&fit=crop&auto=format",
    sizes: ["S","M","L","XL"],
  },
  {
    name: "Sport Performance Set",
    description: "Moisture-wicking 2-piece set built for high-intensity workouts.",
    price: 85,
    category: "Sport",
    imageUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&fit=crop&auto=format",
    sizes: ["XS","S","M","L","XL"],
  },
  {
    name: "Trench Coat",
    description: "Timeless double-breasted trench in a water-resistant cotton blend.",
    price: 199,
    category: "Outerwear",
    imageUrl: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=600&fit=crop&auto=format",
    sizes: ["S","M","L","XL"],
    featured: true,
  },
  {
    name: "Linen Wide-Leg Pants",
    description: "Effortlessly chic wide-leg trousers in breathable linen.",
    price: 65,
    category: "Bottoms",
    imageUrl: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&fit=crop&auto=format",
    sizes: ["XS","S","M","L","XL"],
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/fitverse");
  const existing = await Product.countDocuments();
  if (existing > 0) {
    console.log(`⚠️  ${existing} products already exist — skipping seed. Delete them first if you want a fresh seed.`);
    process.exit(0);
  }
  await Product.insertMany(PRODUCTS);
  console.log(`✅  Seeded ${PRODUCTS.length} products.`);
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
