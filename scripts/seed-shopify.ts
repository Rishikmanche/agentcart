import { seedShopifyCatalog } from "../apps/api/src/catalog/product-seeder.js";

async function main() {
  console.log("🌱 Executing Shopify demo catalog provisioning script...");
  try {
    const result = await seedShopifyCatalog();
    console.log("🎉 Seeding completed successfully!");
    console.log(`Created in Shopify: ${result.createdInShopify}`);
    console.log(`Synced to PostgreSQL: ${result.syncedToDb}`);
    console.log("Products in Catalog:");
    result.products.forEach((p, idx) => {
      console.log(`  ${idx + 1}. [${p.inStock ? "IN STOCK" : "OUT OF STOCK"}] ${p.title} — ₹${p.price}`);
    });
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  }
}

main();
