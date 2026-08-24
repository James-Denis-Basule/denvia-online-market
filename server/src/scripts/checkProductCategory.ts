import mongoose from "mongoose";
import Product from "../models/Product.js";
import env from "../config/env.js";

async function checkProductCategory() {
  try {
    if (!env.mongoUri) {
      throw new Error("MONGODB_URI is not defined");
    }

    await mongoose.connect(env.mongoUri);

    console.log("Connected to MongoDB");

    const product = await Product.findById(
      "6a88d47b2096295b095543a8",
    ).lean();

    if (!product) {
      console.log("Product not found");
      return;
    }

    console.log(
      JSON.stringify(
        {
          _id: product._id,
          category: (product as any).category,
          categoryId: product.categoryId,
        },
        null,
        2,
      ),
    );
  } catch (error) {
    console.error("Check failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

checkProductCategory();