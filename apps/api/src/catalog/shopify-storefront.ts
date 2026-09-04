import { env } from "../config/env.js";

export interface StorefrontProduct {
  id: string;
  title: string;
  description: string;
  productType: string;
  vendor: string;
  tags: string[];
  variants: {
    id: string;
    title: string;
    price: string;
    availableForSale: boolean;
  }[];
  images: {
    url: string;
    altText?: string;
  }[];
}

export class ShopifyStorefrontClient {
  private domain: string;
  private accessToken: string;
  private apiVersion: string;

  constructor() {
    this.domain = env.SHOPIFY_STORE_DOMAIN.replace(/^https?:\/\//, "").replace(/\/$/, "");
    this.accessToken = env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
    this.apiVersion = env.SHOPIFY_API_VERSION;
  }

  private get endpoint(): string {
    return `https://${this.domain}/api/${this.apiVersion}/graphql.json`;
  }

  async executeGraphQL<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
    if (!this.accessToken) {
      throw new Error("SHOPIFY_STOREFRONT_ACCESS_TOKEN is not configured.");
    }

    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": this.accessToken,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Shopify Storefront GraphQL HTTP ${response.status}: ${errorText}`);
    }

    const result = (await response.json()) as { data?: T; errors?: { message: string }[] };
    if (result.errors && result.errors.length > 0) {
      const messages = result.errors.map((e) => e.message).join(", ");
      throw new Error(`Shopify Storefront GraphQL Error: ${messages}`);
    }

    if (!result.data) {
      throw new Error("Shopify Storefront GraphQL returned no data.");
    }

    return result.data;
  }

  async getProducts(first = 50, query?: string): Promise<StorefrontProduct[]> {
    const gql = `
      query getProducts($first: Int!, $query: String) {
        products(first: $first, query: $query) {
          edges {
            node {
              id
              title
              description
              productType
              vendor
              tags
              variants(first: 10) {
                edges {
                  node {
                    id
                    title
                    price {
                      amount
                      currencyCode
                    }
                    availableForSale
                  }
                }
              }
              images(first: 5) {
                edges {
                  node {
                    url
                    altText
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
              description: string;
              productType: string;
              vendor: string;
              tags: string[];
              variants: {
                edges: {
                  node: {
                    id: string;
                    title: string;
                    price: { amount: string; currencyCode: string };
                    availableForSale: boolean;
                  };
                }[];
              };
              images: {
                edges: {
                  node: {
                    url: string;
                    altText?: string;
                  };
                }[];
              };
            };
          }[];
        };
      }>(gql, { first, query });

      return data.products.edges.map((e) => ({
        id: e.node.id,
        title: e.node.title,
        description: e.node.description,
        productType: e.node.productType,
        vendor: e.node.vendor,
        tags: e.node.tags,
        variants: e.node.variants.edges.map((v) => ({
          id: v.node.id,
          title: v.node.title,
          price: v.node.price.amount,
          availableForSale: v.node.availableForSale,
        })),
        images: e.node.images.edges.map((img) => ({
          url: img.node.url,
          altText: img.node.altText,
        })),
      }));
    } catch (err) {
      console.warn("Could not query products from Shopify Storefront API:", (err as Error).message);
      return [];
    }
  }
}

export const shopifyStorefront = new ShopifyStorefrontClient();
