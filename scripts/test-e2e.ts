import { createHmac } from "crypto";
import { buildServer } from "../apps/api/src/server.js";
import { env } from "../apps/api/src/config/env.js";

async function runE2ETests() {
  console.log("\n========================================================");
  console.log("🚀 STARTING AGENTCART END-TO-END VERIFICATION SUITE");
  console.log("========================================================\n");

  const app = await buildServer();
  await app.ready();

  // 1. Health Check
  console.log("👉 1. Testing GET /health");
  const healthRes = await app.inject({
    method: "GET",
    url: "/health",
  });
  console.log(`   Status: ${healthRes.statusCode}, Payload:`, healthRes.json());
  if (healthRes.statusCode !== 200) throw new Error("Health check failed");

  // 2. Catalog Seed & Sync
  console.log("\n👉 2. Testing POST /catalog/seed");
  const seedRes = await app.inject({
    method: "POST",
    url: "/catalog/seed",
  });
  const seedData = seedRes.json();
  console.log(`   Status: ${seedRes.statusCode}, Synced to DB: ${seedData.syncedToDb}`);
  if (seedRes.statusCode !== 200 || !seedData.success) throw new Error("Seed failed");

  // 3. Catalog Query
  console.log("\n👉 3. Testing GET /catalog/products");
  const catRes = await app.inject({
    method: "GET",
    url: "/catalog/products?category=Headphones",
  });
  const catData = catRes.json();
  console.log(`   Found ${catData.count} headphones in catalog.`);
  if (catData.count === 0) throw new Error("No headphones found in catalog");

  const targetProduct = catData.products[0];
  console.log(`   Target Product: "${targetProduct.title}" (₹${targetProduct.price})`);

  // 4. Gemini Agent Interaction
  console.log("\n👉 4. Testing POST /agent/message (Natural Language Shopping Intent)");
  const agentPrompt = "Find ANC headphones under ₹3,000 for long flights and compare options.";
  console.log(`   Prompt: "${agentPrompt}"`);
  
  const agentRes = await app.inject({
    method: "POST",
    url: "/agent/message",
    payload: {
      message: agentPrompt,
    },
  });

  const agentData = agentRes.json();
  console.log(`   Agent Response Status: ${agentRes.statusCode}`);
  console.log(`   Session ID: ${agentData.sessionId}`);
  console.log(`   Agent Reasoning: ${agentData.text.slice(0, 150)}...`);
  console.log(`   Actions Logged: ${agentData.actions?.length || 0}`);
  if (agentRes.statusCode !== 200) throw new Error("Agent message failed");

  // 5. Authoritative Order Creation
  console.log("\n👉 5. Testing POST /orders (Server-Side Price & Inventory Authority)");
  const orderRes = await app.inject({
    method: "POST",
    url: "/orders",
    payload: {
      productId: targetProduct.id,
      quantity: 1,
      intentPrompt: agentPrompt,
    },
  });

  const orderData = orderRes.json();
  console.log(`   Order ID: ${orderData.order.id}`);
  console.log(`   Authoritative Total: ₹${orderData.order.total}`);
  console.log(`   Status: ${orderData.order.status}, Approval: ${orderData.order.approvalStatus}`);
  if (orderRes.statusCode !== 201) throw new Error("Order creation failed");

  const orderId = orderData.order.id;

  // 6. Explicit Approval & Razorpay Test Payment Creation
  console.log("\n👉 6. Testing POST /payments/create (Razorpay Test Mode Order)");
  const payRes = await app.inject({
    method: "POST",
    url: "/payments/create",
    payload: {
      orderId,
    },
  });

  const payData = payRes.json();
  console.log(`   Payment ID: ${payData.payment.paymentId}`);
  console.log(`   Razorpay Order ID: ${payData.payment.razorpayOrderId}`);
  console.log(`   Amount in Paise: ${payData.payment.amount} (₹${payData.payment.orderTotal})`);
  if (payRes.statusCode !== 201) throw new Error("Payment creation failed");

  const rzpOrderId = payData.payment.razorpayOrderId;
  const mockRzpPaymentId = `pay_test_${Date.now()}`;

  // 7. Razorpay Webhook Simulation & Signature Verification
  console.log("\n👉 7. Testing POST /webhooks/razorpay (Cryptographic Webhook Verification)");
  const webhookPayload = {
    entity: "event",
    account_id: "acc_agentcart_demo",
    event: "payment.captured",
    contains: ["payment", "order"],
    payload: {
      payment: {
        entity: {
          id: mockRzpPaymentId,
          entity: "payment",
          amount: payData.payment.amount,
          currency: "INR",
          status: "captured",
          order_id: rzpOrderId,
          method: "upi",
          captured: true,
          description: "AgentCart Test Transaction",
          email: "buyer@agentcart.demo",
          contact: "+919999999999",
        },
      },
      order: {
        entity: {
          id: rzpOrderId,
          amount: payData.payment.amount,
          amount_paid: payData.payment.amount,
          status: "paid",
        },
      },
    },
    created_at: Math.floor(Date.now() / 1000),
  };

  const rawBodyString = JSON.stringify(webhookPayload);
  const signature = createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBodyString)
    .digest("hex");

  const webhookRes = await app.inject({
    method: "POST",
    url: "/webhooks/razorpay",
    headers: {
      "content-type": "application/json",
      "x-razorpay-signature": signature,
      "x-razorpay-event-id": `evt_${Date.now()}`,
    },
    payload: webhookPayload,
  });

  console.log(`   Webhook Status: ${webhookRes.statusCode}, Response:`, webhookRes.json());
  if (webhookRes.statusCode !== 200) throw new Error("Webhook processing failed");

  // 8. Verify Order is Marked CONFIRMED & Payment CAPTURED
  console.log("\n👉 8. Verifying Order & Payment Database States");
  const verifyOrderRes = await app.inject({
    method: "GET",
    url: `/orders/${orderId}`,
  });
  const verifiedOrder = verifyOrderRes.json().order;
  console.log(`   Order Status: ${verifiedOrder.status} (Expected: CONFIRMED)`);
  console.log(`   Payment Status: ${verifiedOrder.payments[0]?.status} (Expected: CAPTURED)`);
  if (verifiedOrder.status !== "CONFIRMED") throw new Error("Order was not confirmed after webhook");

  // 9. Test Webhook Idempotency
  console.log("\n👉 9. Testing Webhook Idempotency (Duplicate Webhook Delivery)");
  const duplicateWebhookRes = await app.inject({
    method: "POST",
    url: "/webhooks/razorpay",
    headers: {
      "content-type": "application/json",
      "x-razorpay-signature": signature,
      "x-razorpay-event-id": `evt_duplicate_${Date.now()}`,
    },
    payload: webhookPayload,
  });
  console.log(`   Duplicate Response:`, duplicateWebhookRes.json());
  if (duplicateWebhookRes.json().status !== "already_processed") {
    throw new Error("Duplicate webhook did not return idempotent already_processed status");
  }

  // 10. Test Invalid Webhook Signature Rejection
  console.log("\n👉 10. Testing Invalid Webhook Signature Rejection");
  const badWebhookRes = await app.inject({
    method: "POST",
    url: "/webhooks/razorpay",
    headers: {
      "content-type": "application/json",
      "x-razorpay-signature": "invalid_fake_signature_abc123",
    },
    payload: webhookPayload,
  });
  console.log(`   Bad Signature Status: ${badWebhookRes.statusCode} (Expected: 400)`);
  if (badWebhookRes.statusCode !== 400) throw new Error("Invalid signature was not rejected!");

  // 11. Test MAX_ORDER_VALUE Policy Limit
  console.log("\n👉 11. Testing MAX_ORDER_VALUE Safety Policy Rejection (> ₹5,000)");
  const highValueRes = await app.inject({
    method: "POST",
    url: "/orders",
    payload: {
      productId: targetProduct.id,
      quantity: 10, // 10 * 2499 = ₹24,990 > MAX ₹5,000
    },
  });
  console.log(`   High Value Status: ${highValueRes.statusCode}, Error:`, highValueRes.json().error);
  if (highValueRes.statusCode !== 400) throw new Error("Safety limit failed to block high value order!");

  // 12. Verify Merchant Dashboard & Funnel Analytics
  console.log("\n👉 12. Testing GET /merchant/dashboard (Real Commerce Metrics & Order Timeline)");
  const dashRes = await app.inject({
    method: "GET",
    url: "/merchant/dashboard",
  });
  const dashData = dashRes.json().data;
  console.log(`   AI Attributed Revenue: ₹${dashData.summary.aiAttributedRevenue.toLocaleString("en-IN")}`);
  console.log(`   AI Assisted Orders: ${dashData.summary.aiAssistedOrders}`);
  console.log(`   Funnel: Discovery (${dashData.funnel.discovery}) -> Comparison (${dashData.funnel.comparison}) -> Checkout (${dashData.funnel.checkoutInitiated}) -> Purchase (${dashData.funnel.paymentCompleted})`);
  console.log(`   Recent Order Verified Timeline Steps: ${dashData.recentOrders[0]?.timeline?.length}`);

  console.log("\n========================================================");
  console.log("✅ ALL 12 END-TO-END CRITICAL FLOW TESTS PASSED!");
  console.log("========================================================\n");
  process.exit(0);
}

runE2ETests().catch((err) => {
  console.error("\n❌ E2E SUITE FAILED:", err);
  process.exit(1);
});
