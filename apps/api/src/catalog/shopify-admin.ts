import { env } from "../config/env.js";

export interface ShopifyAdminProductInput {
  title: string;
  bodyHtml: string;
  vendor: string;
  productType: string;
  tags: string[];
  price: string;
  sku?: string;
  imageUrl?: string;
  inventoryQuantity?: number;
}

export interface ShopifyAdminProductResult {
  id: string;
  title: string;
  handle: string;
  tags: string[];
  variants: {
    id: string;
    price: string;
    sku?: string;
    inventoryQuantity?: number;
  }[];
}

export class ShopifyAdminClient {
  private domain: string;
  private accessToken: string;
  private apiVersion: string;

  constructor() {
    this.domain = env.SHOPIFY_STORE_DOMAIN.replace(/^https?:\/\//, "").replace(/\/$/, "");
    this.accessToken = env.SHOPIFY_ADMIN_ACCESS_TOKEN;
    this.apiVersion = env.SHOPIFY_API_VERSION;
  }

  private get endpoint(): string {
    return `https://${this.domain}/admin/api/${this.apiVersion}/graphql.json`;
  }

  async executeGraphQL<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
    if (!this.accessToken) {
      throw new Error("SHOPIFY_ADMIN_ACCESS_TOKEN is not configured.");
    }

    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": this.accessToken,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Shopify Admin GraphQL HTTP ${response.status}: ${errorText}`);
    }

    const result = (await response.json()) as { data?: T; errors?: { message: string }[] };
    if (result.errors && result.errors.length > 0) {
      const messages = result.errors.map((e) => e.message).join(", ");
      throw new Error(`Shopify Admin GraphQL Error: ${messages}`);
    }

    if (!result.data) {
      throw new Error("Shopify Admin GraphQL returned no data.");
    }

    return result.data;
  }

  /**
   * Search for products tagged with a specific tag (e.g. agentcart-demo)
   */
  async getProductsByTag(tag: string): Promise<ShopifyAdminProductResult[]> {
    const query = `
      query getProductsByTag($query: String!) {
        products(first: 50, query: $query) {
          edges {
            node {
              id
              title
              handle
              tags
              variants(first: 10) {
                edges {
                  node {
                    id
                    price
                    sku
                  }
                }
              }
            }
          }
        }
      }
    `;

    try {
      const data = await this.executeGraphQL<{
        products: {
          edges: {
            node: {
              id: string;
              title: string;
              handle: string;
              tags: string[];
              variants: {
                edges: {
                  node: {
                    id: string;
                    price: string;
                    sku?: string;
                  };
                }[];
              };
            };
          }[];
        };
      }>(query, { query: `tag:${tag}` });

      return data.products.edges.map((e) => ({
        id: e.node.id,
        title: e.node.title,
        handle: e.node.handle,
        tags: e.node.tags,
        variants: e.node.variants.edges.map((v) => ({
          id: v.node.id,
          price: v.node.price,
          sku: v.node.sku,
        })),
      }));
    } catch (err) {
      console.warn("Could not query products from Shopify Admin GraphQL:", (err as Error).message);
      return [];
    }
  }

  /**
   * Create a product in Shopify via modern Admin GraphQL productCreate mutation
   */
  async createProduct(input: ShopifyAdminProductInput): Promise<{
    id: string;
    variantId?: string;
  } | null> {
    const mutation = `
      mutation productCreate($product: ProductCreateInput!) {
        productCreate(product: $product) {
          product {
            id
            variants(first: 1) {
              edges {
                node {
                  id
                }
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const variables: Record<string, unknown> = {
      product: {
        title: input.title,
        descriptionHtml: input.bodyHtml,
        vendor: input.vendor,
        productType: input.productType,
        tags: input.tags,
        status: "ACTIVE",
      },
    };

    try {
      const data = await this.executeGraphQL<{
        productCreate: {
          product?: {
            id: string;
            variants: { edges: { node: { id: string } }[] };
          };
          userErrors: { field: string[]; message: string }[];
        };
      }>(mutation, variables);

      if (data.productCreate.userErrors && data.productCreate.userErrors.length > 0) {
        console.warn("Shopify productCreate userErrors:", data.productCreate.userErrors);
        return null;
      }

      const product = data.productCreate.product;
      if (!product) return null;

      const variantId = product.variants.edges[0]?.node?.id;
      return { id: product.id, variantId };
    } catch (err) {
      console.warn(`Failed to create product "${input.title}" on Shopify:`, (err as Error).message);
      return null;
    }
  }
}

export const shopifyAdmin = new ShopifyAdminClient();
