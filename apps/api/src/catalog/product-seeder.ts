import { prisma } from "../database/prisma.js";
import { shopifyAdmin } from "./shopify-admin.js";
import { shopifyStorefront } from "./shopify-storefront.js";

export interface DemoProductDefinition {
  externalId: string;
  title: string;
  category: "Headphones" | "Keyboards" | "Smartwatches" | "Backpacks" | "Speakers" | "Accessories";
  brand: string;
  price: number;
  currency: string;
  description: string;
  imageUrl: string;
  attributes: {
    batteryHours?: number;
    hasANC?: boolean;
    weightGrams?: number;
    connectivity?: string;
    waterResistance?: string;
    warrantyYears?: number;
    keySwitches?: string;
    displayType?: string;
    capacityLiters?: number;
    outputWatts?: number;
    fastCharging?: boolean;
    highlights?: string[];
  };
  inventoryQuantity: number;
}

export const DEMO_CATALOG: DemoProductDefinition[] = [
  // --- HEADPHONES ---
  {
    externalId: "demo-hp-sony-wh520",
    title: "Sony WH-CH520 Wireless Bluetooth Headphones",
    category: "Headphones",
    brand: "Sony",
    price: 2499,
    currency: "INR",
    description: "Lightweight on-ear wireless headphones with up to 50 hours battery life, multipoint connection, and DSEE audio upscaling. Ideal for daily commutes, work, and casual listening.",
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
    attributes: {
      batteryHours: 50,
      hasANC: false,
      weightGrams: 147,
      connectivity: "Bluetooth 5.2",
      fastCharging: true,
      warrantyYears: 1,
      highlights: ["50-Hour Battery", "Ultra Lightweight (147g)", "Multipoint Pairing", "Custom EQ via App"],
    },
    inventoryQuantity: 18,
  },
  {
    externalId: "demo-hp-jbl-760nc",
    title: "JBL Tune 760NC Active Noise Cancelling Headphones",
    category: "Headphones",
    brand: "JBL",
    price: 2799,
    currency: "INR",
    description: "Over-ear wireless headphones featuring Active Noise Cancellation, Pure Bass Sound, and 35 hours battery with ANC on (50h ANC off). Built for distraction-free flights and focused work.",
    imageUrl: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80",
    attributes: {
      batteryHours: 40,
      hasANC: true,
      weightGrams: 220,
      connectivity: "Bluetooth 5.0",
      fastCharging: true,
      warrantyYears: 1,
      highlights: ["Active Noise Cancellation (ANC)", "JBL Pure Bass Sound", "Foldable Design for Travel", "Voice Assistant Support"],
    },
    inventoryQuantity: 12,
  },
  {
    externalId: "demo-hp-boat-450pro",
    title: "boAt Rockerz 450 Pro On-Ear Bluetooth Headphones",
    category: "Headphones",
    brand: "boAt",
    price: 1499,
    currency: "INR",
    description: "Budget wireless headphones offering 70 hours playtime, ASAP Charge, and 40mm dynamic drivers with signature boAt bass sound.",
    imageUrl: "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=800&q=80",
    attributes: {
      batteryHours: 70,
      hasANC: false,
      weightGrams: 168,
      connectivity: "Bluetooth 5.0",
      fastCharging: true,
      warrantyYears: 1,
      highlights: ["70-Hour Battery Marathon", "ASAP Fast Charge (10min = 10h)", "Padded Ergonomic Cushions"],
    },
    inventoryQuantity: 25,
  },
  {
    externalId: "demo-hp-noise-two",
    title: "Noise Two Wireless Active Headphones with Low Latency",
    category: "Headphones",
    brand: "Noise",
    price: 1899,
    currency: "INR",
    description: "Dual pairing wireless headphones featuring ultra low-latency gaming mode, 50 hours battery, IPX5 water resistance, and 4 play modes including SD card and FM.",
    imageUrl: "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80",
    attributes: {
      batteryHours: 50,
      hasANC: false,
      weightGrams: 190,
      connectivity: "Bluetooth 5.3",
      waterResistance: "IPX5",
      warrantyYears: 1,
      highlights: ["Low Latency (40ms)", "Dual Pairing", "IPX5 Water Resistant", "Multiple Play Modes"],
    },
    inventoryQuantity: 15,
  },

  // --- KEYBOARDS ---
  {
    externalId: "demo-kb-keychron-k2",
    title: "Keychron K2 V2 Wireless Mechanical Keyboard (Gateron Red)",
    category: "Keyboards",
    brand: "Keychron",
    price: 4499,
    currency: "INR",
    description: "Compact 75% layout wireless mechanical keyboard with Mac and Windows layout compatibility, hot-swappable switches, and white LED backlighting.",
    imageUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80",
    attributes: {
      batteryHours: 72,
      connectivity: "Bluetooth 5.1 / Type-C Cable",
      keySwitches: "Gateron Red (Linear)",
      weightGrams: 790,
      highlights: ["75% Compact Layout", "Connects up to 3 Devices", "Mac & Windows Keycaps Included", "4000mAh Battery"],
    },
    inventoryQuantity: 8,
  },
  {
    externalId: "demo-kb-logi-mxkeys",
    title: "Logitech MX Keys Mini Minimalist Wireless Illuminated Keyboard",
    category: "Keyboards",
    brand: "Logitech",
    price: 4999,
    currency: "INR",
    description: "Premium minimalist wireless keyboard designed for creators with smart illumination, Perfect Stroke spherically dished keys, and USB-C quick recharging.",
    imageUrl: "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=800&q=80",
    attributes: {
      batteryHours: 240,
      connectivity: "Bluetooth Low Energy / Logi Bolt",
      weightGrams: 506,
      highlights: ["Smart Backlighting Sensor", "Ultra-Quiet Tactile Typing", "Multi-OS Easy-Switch", "USB-C Quick Charge"],
    },
    inventoryQuantity: 10,
  },
  {
    externalId: "demo-kb-rk-rk68",
    title: "Royal Kludge RK68 Wireless 65% RGB Mechanical Keyboard",
    category: "Keyboards",
    brand: "Royal Kludge",
    price: 3299,
    currency: "INR",
    description: "Versatile 65% mechanical keyboard with triple connectivity (BT/2.4G/Wired), hot-swappable PCB, dynamic RGB lighting, and custom sound dampening foam.",
    imageUrl: "https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=800&q=80",
    attributes: {
      batteryHours: 48,
      connectivity: "Triple Mode (2.4Ghz / BT5.0 / USB-C)",
      keySwitches: "RK Brown (Tactile)",
      weightGrams: 620,
      highlights: ["68-Key Compact Form Factor", "Hot-Swappable 3/5 Pin", "Dynamic RGB Backlight", "Factory Lubed Stabilizers"],
    },
    inventoryQuantity: 14,
  },

  // --- SMARTWATCHES ---
  {
    externalId: "demo-sw-amazfit-gts4",
    title: "Amazfit GTS 4 Mini Smart Watch with AMOLED Display",
    category: "Smartwatches",
    brand: "Amazfit",
    price: 3999,
    currency: "INR",
    description: "Ultra-slim 1.65-inch HD AMOLED smartwatch with 15-day battery life, 120+ sports modes, 5 ATM water resistance, and 24H heart rate, SpO2 & stress tracking.",
    imageUrl: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80",
    attributes: {
      batteryHours: 360,
      displayType: "1.65\" HD AMOLED",
      waterResistance: "5 ATM (50m)",
      weightGrams: 31,
      highlights: ["15-Day Battery Life", "Always-On AMOLED", "120+ Sports Modes", "5 Satellite Positioning Systems"],
    },
    inventoryQuantity: 16,
  },
  {
    externalId: "demo-sw-noise-colorfit",
    title: "Noise ColorFit Pro 5 Max Bluetooth Calling Smartwatch",
    category: "Smartwatches",
    brand: "Noise",
    price: 2999,
    currency: "INR",
    description: "Advanced smartwatch with a massive 1.96-inch AMOLED display, Tru Sync BT calling, post-workout analysis, emergency SOS, and rapid magnetic charging.",
    imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
    attributes: {
      batteryHours: 168,
      displayType: "1.96\" AMOLED (60Hz)",
      waterResistance: "IP68",
      weightGrams: 42,
      highlights: ["1.96\" 60Hz AMOLED", "Single-Chip Bluetooth Calling", "Rapid Charging (10m = 24h)", "Noise Health Suite"],
    },
    inventoryQuantity: 20,
  },

  // --- BACKPACKS ---
  {
    externalId: "demo-bp-mokobara-transit",
    title: "Mokobara The Transit Pro 15.6\" Tech Backpack",
    category: "Backpacks",
    brand: "Mokobara",
    price: 3499,
    currency: "INR",
    description: "Sleek water-resistant everyday commuter backpack with dedicated padded laptop sleeve, quick-access passport pocket, luggage pass-through, and premium vegan leather accents.",
    imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
    attributes: {
      capacityLiters: 22,
      waterResistance: "Water Repellent 900D Nylon",
      weightGrams: 850,
      highlights: ["15.6\" Padded Laptop Compartment", "Luggage Pass-Through Sleeve", "Hidden Anti-Theft Pocket", "YKK Zippers"],
    },
    inventoryQuantity: 11,
  },
  {
    externalId: "demo-bp-daily-city",
    title: "DailyObjects City Commuter Weatherproof Backpack",
    category: "Backpacks",
    brand: "DailyObjects",
    price: 2699,
    currency: "INR",
    description: "Urban minimalist roll-top backpack constructed from tarpaulin and recycled polyester. Features magnetic Fidlock closures, breathable mesh back panel, and expandable volume.",
    imageUrl: "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=800&q=80",
    attributes: {
      capacityLiters: 24,
      waterResistance: "All-Weather Tarpaulin",
      weightGrams: 780,
      highlights: ["Expandable Roll-Top Design", "Magnetic Quick-Snap Buckles", "Ergonomic Lumbar Support", "Organizer Pockets"],
    },
    inventoryQuantity: 15,
  },

  // --- SPEAKERS ---
  {
    externalId: "demo-sp-jbl-flip6",
    title: "JBL Flip 6 Portable Waterproof Bluetooth Speaker",
    category: "Speakers",
    brand: "JBL",
    price: 4799,
    currency: "INR",
    description: "Rugged portable speaker delivering powerful 2-way sound with racetrack woofer, separate tweeter, IP67 waterproof/dustproof rating, and 12 hours playtime.",
    imageUrl: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=800&q=80",
    attributes: {
      batteryHours: 12,
      outputWatts: 30,
      waterResistance: "IP67 Waterproof & Dustproof",
      weightGrams: 550,
      highlights: ["Bold 30W 2-Way Audio", "IP67 Certified for Outdoors", "PartyBoost Pairing", "USB-C Charge Protection"],
    },
    inventoryQuantity: 9,
  },
  {
    externalId: "demo-sp-tribit-stormbox",
    title: "Tribit StormBox Micro 2 Compact Outdoor Speaker",
    category: "Speakers",
    brand: "Tribit",
    price: 2499,
    currency: "INR",
    description: "Pocket-sized Bluetooth 5.3 speaker with surprising bass, 12 hours playtime, built-in tear-resistant silicone strap for bikes/backpacks, and power bank function.",
    imageUrl: "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80",
    attributes: {
      batteryHours: 12,
      outputWatts: 10,
      waterResistance: "IP67 Submersible",
      weightGrams: 315,
      highlights: ["RunStretch Battery (12h)", "Reverse Power Bank (Charges Phones)", "Integrated Bike/Backpack Strap", "XBass Technology"],
    },
    inventoryQuantity: 19,
  },

  // --- ACCESSORIES ---
  {
    externalId: "demo-acc-anker-65w",
    title: "Anker 735 GaNPrime 65W 3-Port Fast Wall Charger",
    category: "Accessories",
    brand: "Anker",
    price: 2499,
    currency: "INR",
    description: "Compact GaN III fast wall charger with 2 USB-C ports and 1 USB-A port. Fast charges laptops, phones, and tablets simultaneously with PowerIQ 4.0 dynamic power distribution.",
    imageUrl: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80",
    attributes: {
      outputWatts: 65,
      weightGrams: 130,
      fastCharging: true,
      highlights: ["Power 3 Devices at Once", "GaN III High Efficiency", "ActiveShield 2.0 Safety", "Ultra-Compact Foldable Plug"],
    },
    inventoryQuantity: 30,
  },
];

export async function getOrCreateDefaultMerchant() {
  const defaultDomain = "agentcart-demo.myshopify.com";
  let merchant = await prisma.merchant.findUnique({
    where: { domain: defaultDomain },
  });

  if (!merchant) {
    merchant = await prisma.merchant.create({
      data: {
        name: "AgentCart Demo Store",
        domain: defaultDomain,
        currency: "INR",
      },
    });
  }

  return merchant;
}

/**
 * Idempotent Seed Procedure:
 * 1. Checks Shopify for existing products tagged `agentcart-demo`.
 * 2. Creates missing demo products in Shopify Admin GraphQL API (if available).
 * 3. Upserts all catalog products, variants, and live inventory into PostgreSQL.
 */
export async function seedShopifyCatalog(): Promise<{
  createdInShopify: number;
  syncedToDb: number;
  products: { id: string; title: string; price: number; inStock: boolean }[];
}> {
  const merchant = await getOrCreateDefaultMerchant();
  const demoTag = "agentcart-demo";

  console.log("🔄 Starting idempotent Shopify demo catalog provisioning...");

  // 1. Check existing Shopify products
  const existingShopifyProducts = await shopifyAdmin.getProductsByTag(demoTag);
  console.log(`Found ${existingShopifyProducts.length} existing products in Shopify tagged "${demoTag}".`);

  let createdInShopify = 0;
  const shopifyProductMap = new Map<string, { shopifyId: string; variantId?: string }>();

  for (const existing of existingShopifyProducts) {
    shopifyProductMap.set(existing.title.toLowerCase().trim(), {
      shopifyId: existing.id,
      variantId: existing.variants[0]?.id,
    });
  }

  // 2. Create missing products in Shopify
  for (const item of DEMO_CATALOG) {
    const key = item.title.toLowerCase().trim();
    if (!shopifyProductMap.has(key)) {
      console.log(`Creating missing demo product in Shopify: "${item.title}"...`);
      const created = await shopifyAdmin.createProduct({
        title: item.title,
        bodyHtml: `<p>${item.description}</p>`,
        vendor: item.brand,
        productType: item.category,
        tags: [demoTag, item.category.toLowerCase(), item.brand.toLowerCase()],
        price: item.price.toString(),
        sku: item.externalId,
        imageUrl: item.imageUrl,
        inventoryQuantity: item.inventoryQuantity,
      });

      if (created) {
        createdInShopify++;
        shopifyProductMap.set(key, {
          shopifyId: created.id,
          variantId: created.variantId,
        });
      }
    }
  }

  // 3. Upsert products into PostgreSQL
  const syncedProducts: { id: string; title: string; price: number; inStock: boolean }[] = [];

  for (const item of DEMO_CATALOG) {
    const key = item.title.toLowerCase().trim();
    const shopifyInfo = shopifyProductMap.get(key);

    const product = await prisma.product.upsert({
      where: { externalId: item.externalId },
      update: {
        title: item.title,
        description: item.description,
        category: item.category,
        brand: item.brand,
        price: item.price,
        currency: item.currency,
        imageUrl: item.imageUrl,
        attributes: item.attributes,
        inStock: item.inventoryQuantity > 0,
        shopifyProductId: shopifyInfo?.shopifyId || `gid://shopify/Product/${item.externalId}`,
        shopifyVariantId: shopifyInfo?.variantId || `gid://shopify/ProductVariant/${item.externalId}-var`,
        merchantId: merchant.id,
      },
      create: {
        externalId: item.externalId,
        title: item.title,
        description: item.description,
        category: item.category,
        brand: item.brand,
        price: item.price,
        currency: item.currency,
        imageUrl: item.imageUrl,
        attributes: item.attributes,
        inStock: item.inventoryQuantity > 0,
        shopifyProductId: shopifyInfo?.shopifyId || `gid://shopify/Product/${item.externalId}`,
        shopifyVariantId: shopifyInfo?.variantId || `gid://shopify/ProductVariant/${item.externalId}-var`,
        merchantId: merchant.id,
      },
    });

    // Upsert Inventory
    await prisma.inventory.upsert({
      where: { productId: product.id },
      update: {
        availableQuantity: item.inventoryQuantity,
      },
      create: {
        productId: product.id,
        availableQuantity: item.inventoryQuantity,
        reservedQuantity: 0,
      },
    });

    syncedProducts.push({
      id: product.id,
      title: product.title,
      price: Number(product.price),
      inStock: item.inventoryQuantity > 0,
    });
  }

  console.log(`✅ Seed/Sync complete! ${createdInShopify} created on Shopify, ${syncedProducts.length} synced to PostgreSQL.`);

  return {
    createdInShopify,
    syncedToDb: syncedProducts.length,
    products: syncedProducts,
  };
}
