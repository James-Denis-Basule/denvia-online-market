import mongoose from "mongoose";
import Product from "../models/Product.js";
import env from "../config/env.js";

async function migrateProductCategories() {
  try {
    if (!env.mongoUri) {
      throw new Error("MONGODB_URI is not defined");
    }

    await mongoose.connect(env.mongoUri);

    console.log("Connected to MongoDB");

    const collection = Product.collection;

    const products = await collection
      .find(
        {
          category: {
            $exists: true,
          },
        },
        {
          projection: {
            _id: 1,
            category: 1,
            categoryId: 1,
          },
        },
      )
      .toArray();

    console.log(
      `Products with legacy category field: ${products.length}`,
    );

    for (const product of products) {
      console.log(
        `Removing legacy category from product ${product._id}`,
      );

      await collection.updateOne(
        {
          _id: product._id,
        },
        {
          $unset: {
            category: "",
          },
        },
      );
    }

    const remaining = await collection.countDocuments({
      category: {
        $exists: true,
      },
    });

    console.log(
      `Products with legacy category remaining: ${remaining}`,
    );

    if (remaining === 0) {
      console.log(
        "Legacy product category migration completed successfully.",
      );
    } else {
      console.error(
        "Migration completed, but legacy category fields still remain.",
      );
      process.exitCode = 1;
    }
  } catch (error) {
    console.error(
      "Product category migration failed:",
      error,
    );

    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

migrateProductCategories();