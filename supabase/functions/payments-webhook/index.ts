import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, verifyWebhook } from "../_shared/stripe.ts";

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  }
  return _supabase;
}

// Map a Stripe price lookup_key to the user-facing tier on the profile.
const PRICE_TO_TIER: Record<string, "storyteller" | "pro" | "creator"> = {
  storyteller_monthly: "storyteller",
  storyteller_yearly: "storyteller",
  pro_monthly: "pro",
  pro_yearly: "pro",
  creator_monthly: "creator",
  creator_yearly: "creator",
};
const PRICE_TO_INTERVAL: Record<string, "month" | "year"> = {
  storyteller_monthly: "month",
  storyteller_yearly: "year",
  pro_monthly: "month",
  pro_yearly: "year",
  creator_monthly: "month",
  creator_yearly: "year",
};
const CREDIT_PACKS: Record<string, number> = {
  credits_20: 20,
  credits_50: 50,
  credits_200: 200,
};

function resolvePriceId(item: any): string {
  return item?.price?.lookup_key
    || item?.price?.metadata?.lovable_external_id
    || item?.price?.id;
}

async function syncProfileFromSubscription(userId: string, subscription: any) {
  const item = subscription.items?.data?.[0];
  const priceId = resolvePriceId(item);
  const tier = PRICE_TO_TIER[priceId];
  const interval = PRICE_TO_INTERVAL[priceId];
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;
  const trialEnd = subscription.trial_end;

  await getSupabase().from("profiles").update({
    subscription_tier: tier ?? "storyteller",
    subscription_status: subscription.status,
    subscription_interval: interval ?? null,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    trial_ends_at: trialEnd ? new Date(trialEnd * 1000).toISOString() : null,
    stripe_customer_id: subscription.customer,
    stripe_subscription_id: subscription.id,
    updated_at: new Date().toISOString(),
  }).eq("id", userId);
}

async function handleSubscriptionCreated(subscription: any, env: StripeEnv) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error("No userId in subscription metadata");
    return;
  }
  const item = subscription.items?.data?.[0];
  const priceId = resolvePriceId(item);
  const productId = item?.price?.product;
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;

  await getSupabase().from("subscriptions").upsert({
    user_id: userId,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer,
    product_id: productId,
    price_id: priceId,
    status: subscription.status,
    current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    cancel_at_period_end: subscription.cancel_at_period_end || false,
    environment: env,
    updated_at: new Date().toISOString(),
  }, { onConflict: "stripe_subscription_id" });

  await syncProfileFromSubscription(userId, subscription);
  await getSupabase().from("subscription_events").insert({
    user_id: userId, event_type: "subscription.created", payload: subscription,
  });
}

async function handleSubscriptionUpdated(subscription: any, env: StripeEnv) {
  const item = subscription.items?.data?.[0];
  const priceId = resolvePriceId(item);
  const productId = item?.price?.product;
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;

  await getSupabase().from("subscriptions").update({
    status: subscription.status,
    product_id: productId,
    price_id: priceId,
    current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    cancel_at_period_end: subscription.cancel_at_period_end || false,
    updated_at: new Date().toISOString(),
  }).eq("stripe_subscription_id", subscription.id).eq("environment", env);

  const userId = subscription.metadata?.userId;
  if (userId) {
    await syncProfileFromSubscription(userId, subscription);
    await getSupabase().from("subscription_events").insert({
      user_id: userId, event_type: "subscription.updated", payload: subscription,
    });
  }
}

async function handleSubscriptionDeleted(subscription: any, env: StripeEnv) {
  await getSupabase().from("subscriptions").update({
    status: "canceled", updated_at: new Date().toISOString(),
  }).eq("stripe_subscription_id", subscription.id).eq("environment", env);

  const userId = subscription.metadata?.userId;
  if (userId) {
    await getSupabase().from("profiles").update({
      subscription_status: "canceled", updated_at: new Date().toISOString(),
    }).eq("id", userId);
    await getSupabase().from("subscription_events").insert({
      user_id: userId, event_type: "subscription.deleted", payload: subscription,
    });
  }
}

async function handleCheckoutCompleted(session: any) {
  // Used for one-off Reimagined credit purchases.
  if (session.mode !== "payment") return;
  const userId = session.metadata?.userId;
  const priceId = session.metadata?.priceId;
  if (!userId || !priceId) return;
  const credits = CREDIT_PACKS[priceId];
  if (!credits) return;

  // Idempotency: rely on UNIQUE(stripe_session_id). If a duplicate webhook
  // arrives, the insert returns zero rows and we skip the credit grant.
  const { data: inserted, error: insertErr } = await getSupabase()
    .from("credit_purchases")
    .insert({
      user_id: userId,
      pack: priceId,
      credits,
      amount_cents: session.amount_total ?? 0,
      stripe_session_id: session.id,
    })
    .select("id")
    .maybeSingle();

  if (insertErr) {
    // 23505 unique_violation = already processed → safe to ignore.
    if ((insertErr as any).code === "23505") return;
    throw insertErr;
  }
  if (!inserted) return;

  // Atomic increment so concurrent webhooks can't lose credits.
  const { error: rpcErr } = await getSupabase().rpc("increment_reimagine_credits", {
    _user_id: userId,
    _delta: credits,
  });
  if (rpcErr) throw rpcErr;


  await getSupabase().from("subscription_events").insert({
    user_id: userId, event_type: "credits.purchased", payload: session,
  });
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);
  switch (event.type) {
    case "customer.subscription.created":
      await handleSubscriptionCreated(event.data.object, env); break;
    case "customer.subscription.updated":
      await handleSubscriptionUpdated(event.data.object, env); break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object, env); break;
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object); break;
    default:
      console.log("Unhandled event:", event.type);
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const rawEnv = new URL(req.url).searchParams.get("env");
  if (rawEnv !== "sandbox" && rawEnv !== "live") {
    return new Response(JSON.stringify({ received: true, ignored: "invalid env" }), {
      status: 200, headers: { "Content-Type": "application/json" },
    });
  }
  try {
    await handleWebhook(req, rawEnv as StripeEnv);
    return new Response(JSON.stringify({ received: true }), {
      status: 200, headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("Webhook error:", e?.message ?? e);
    return new Response("Webhook error", { status: 400 });
  }
});
