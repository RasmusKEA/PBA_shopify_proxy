import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
app.use(cors());
const PORT = 3000;

app.get("/getUnpublished", async (req, res) => {
  try {
    const shopifyUrl =
      "https://718a5d-3.myshopify.com/admin/api/2024-01/products.json";

    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

    const response = await fetch(shopifyUrl, {
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({ error: errorData });
    }

    const allProducts = await response.json();

    // Filter products with the "unpublished" tag
    const unpublishedProducts = allProducts.products.filter(
      (product) =>
        product.tags && product.tags.split(", ").includes("unpublished")
    );

    res.json({ products: unpublishedProducts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/publishProduct/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

    // Get the product data
    const productUrl = `https://718a5d-3.myshopify.com/admin/api/2024-01/products/${productId}.json`;
    const productResponse = await fetch(productUrl, {
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
    });

    if (!productResponse.ok) {
      const errorData = await productResponse.json();
      return res.status(productResponse.status).json({ error: errorData });
    }

    const productData = await productResponse.json();

    // Remove "unpublished" tag and add "published" tag
    let updatedTags;

    if (typeof productData.product.tags === "string") {
      const tagsArray = productData.product.tags.split(", ");
      updatedTags = tagsArray
        .filter((tag) => tag !== "unpublished")
        .concat("published")
        .join(", ");
    } else {
      // Handle the case where productData.product.tags is not a string or array
      console.error("Tags is not a string:", productData.product.tags);
      // You can provide a default value or handle it in a way that makes sense for your application
      updatedTags = "published";
    }

    // Update the product with the new tags
    const updateProductUrl = `https://718a5d-3.myshopify.com/admin/api/2024-01/products/${productId}.json`;
    const updateProductResponse = await fetch(updateProductUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
      body: JSON.stringify({
        product: {
          id: productId,
          tags: updatedTags,
        },
      }),
    });

    if (!updateProductResponse.ok) {
      const errorData = await updateProductResponse.json();
      return res
        .status(updateProductResponse.status)
        .json({ error: errorData });
    }

    res.json({ message: "Product published successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`Express server running on ${PORT}`);
});
