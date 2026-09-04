import { prisma } from "../database/prisma.js";
import { shopifyStorefront } from "./shopify-storefront.js";
import { seedShopifyCatalog } from "./product-seeder.js";

export interface SearchProductsOptions {
  query?: string;
  category?: string;
  maxPrice?: number;
  minPrice?: number;
  brand?: string;
  inStockOnly?: boolean;
  limit?: number;
}

export interface NormalizedProduct {
  id: string;
  externalId: string | null;
  shopifyProductId: string | null;
  shopifyVariantId: string | null;
  title: string;
  description: string;
  category: string;
  brand: string;
  price: number;
  currency: string;
  imageUrl: string;
  attributes: Record<string, unknown>;
  inStock: boolean;
  availableQuantity: number;
}

export class CatalogService {
  async searchProducts(options: SearchProductsOptions = {}): Promise<NormalizedProduct[]> {
    const {
      query,
      category,
      maxPrice,
      minPrice,
      brand,
      inStockOnly = true,
      limit = 20,
    } = options;

    const where: Record<string, unknown> = {};

    if (inStockOnly) {
      where.inStock = true;
    }

    if (category) {
      where.category = {
        equals: category,
        mode: "insensitive",
      };
    }

    if (brand) {
      where.brand = {
        equals: brand,
        mode: "insensitive",
      };
    }

    if (maxPrice !== undefined || minPrice !== undefined) {
      where.price = {};
      if (maxPrice !== undefined) {
        (where.price as Record<string, unknown>).lte = maxPrice;
      }
      if (minPrice !== undefined) {
        (where.price as Record<string, unknown>).gte = minPrice;
      }
    }

    if (query) {
      const cleanQuery = query.trim();
      where.OR = [
        { title: { contains: cleanQuery, mode: "insensitive" } },
        { description: { contains: cleanQuery, mode: "insensitive" } },
        { category: { contains: cleanQuery, mode: "insensitive" } },
        { brand: { contains: cleanQuery, mode: "insensitive" } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        inventory: true,
      },
      take: limit,
      orderBy: { price: "asc" },
    });

    return products.map((p) => ({
      id: p.id,
      externalId: p.externalId,
      shopifyProductId: p.shopifyProductId,
      shopifyVariantId: p.shopifyVariantId,
      title: p.title,
      description: p.description,
      category: p.category,
      brand: p.brand,
      price: Number(p.price),
      currency: p.currency,
      imageUrl: p.imageUrl,
      attributes: (p.attributes as Record<string, unknown>) || {},
      inStock: p.inStock && (p.inventory?.availableQuantity ?? 0) > 0,
      availableQuantity: p.inventory?.availableQuantity ?? 0,
    }));
  }

  async getProductById(id: string): Promise<NormalizedProduct | null> {
    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id }, { externalId: id }, { shopifyProductId: id }],
      },
      include: {
        inventory: true,
      },
    });

    if (!product) return null;

    return {
      id: product.id,
      externalId: product.externalId,
      shopifyProductId: product.shopifyProductId,
      shopifyVariantId: product.shopifyVariantId,
      title: product.title,
      description: product.description,
      category: product.category,
      brand: product.brand,
      price: Number(product.price),
      currency: product.currency,
      imageUrl: product.imageUrl,
      attributes: (product.attributes as Record<string, unknown>) || {},
      inStock: product.inStock && (product.inventory?.availableQuantity ?? 0) > 0,
      availableQuantity: product.inventory?.availableQuantity ?? 0,
    };
  }

  async checkInventory(productId: string): Promise<{
    available: boolean;
    availableQuantity: number;
    reservedQuantity: number;
  }> {
    const product = await this.getProductById(productId);
    if (!product) {
      return { available: false, availableQuantity: 0, reservedQuantity: 0 };
    }

    const inv = await prisma.inventory.findUnique({
      where: { productId: product.id },
    });

    const qty = inv?.availableQuantity ?? 0;
    return {
      available: qty > 0,
      availableQuantity: qty,
      reservedQuantity: inv?.reservedQuantity ?? 0,
    };
  }

  async compareProducts(productIds: string[]): Promise<{
    products: NormalizedProduct[];
    comparisonMatrix: Record<string, Record<string, unknown>>;
  }> {
    const products: NormalizedProduct[] = [];
    for (const id of productIds) {
      const p = await this.getProductById(id);
      if (p) products.push(p);
    }

    const comparisonMatrix: Record<string, Record<string, unknown>> = {};
    for (const p of products) {
      comparisonMatrix[p.id] = {
        title: p.title,
        brand: p.brand,
        price: `₹${p.price.toLocaleString("en-IN")}`,
        category: p.category,
        inStock: p.inStock ? "In Stock" : "Out of Stock",
        availableQuantity: p.availableQuantity,
        ...p.attributes,
      };
    }

    return {
      products,
      comparisonMatrix,
    };
  }

  async seedCatalog() {
    return await seedShopifyCatalog();
  }

  async syncStorefrontCatalog(): Promise<{ syncedCount: number }> {
    const storefrontProducts = await shopifyStorefront.getProducts(50);
    let syncedCount = 0;

    if (storefrontProducts.length === 0) {
      // If storefront access token is not yet configured, use internal seeding
      const result = await seedShopifyCatalog();
      return { syncedCount: result.syncedToDb };
    }

    const merchant = await prisma.merchant.findFirst();
    if (!merchant) {
      await seedShopifyCatalog();
      return { syncedCount: storefrontProducts.length };
    }

    for (const sp of storefrontProducts) {
      const primaryVariant = sp.variants[0];
      const primaryImage = sp.images[0]?.url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800";
      const priceNum = primaryVariant ? parseFloat(primaryVariant.price) : 2499;

      const product = await prisma.product.upsert({
        where: { shopifyProductId: sp.id },
        update: {
          title: sp.title,
          description: sp.description || sp.title,
          category: sp.productType || "Accessories",
          brand: sp.vendor || "AgentCart",
          price: priceNum,
          imageUrl: primaryImage,
          inStock: primaryVariant?.availableForSale ?? true,
          shopifyVariantId: primaryVariant?.id,
        },
        create: {
          shopifyProductId: sp.id,
          shopifyVariantId: primaryVariant?.id,
          title: sp.title,
          description: sp.description || sp.title,
          category: sp.productType || "Accessories",
          brand: sp.vendor || "AgentCart",
          price: priceNum,
          imageUrl: primaryImage,
          inStock: primaryVariant?.availableForSale ?? true,
          merchantId: merchant.id,
        },
      });

      await prisma.inventory.upsert({
        where: { productId: product.id },
        update: {
          availableQuantity: primaryVariant?.availableForSale ? 15 : 0,
        },
        create: {
          productId: product.id,
          availableQuantity: primaryVariant?.availableForSale ? 15 : 0,
          reservedQuantity: 0,
        },
      });

      syncedCount++;
    }

    return { syncedCount };
  }
}

export const catalogService = new CatalogService();
