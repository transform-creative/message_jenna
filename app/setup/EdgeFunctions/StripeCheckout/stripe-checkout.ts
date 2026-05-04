import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Redis } from "https://esm.sh/@upstash/redis@1.22.0";
import { Ratelimit } from "https://esm.sh/@upstash/ratelimit@0.4.3";

type CartItem = {
    product: {
        [key: string]: any;
        id: number;
        amount: number | null;
        name: string;
    };
    quantity: number;
}
// 1. INIT STRIPE
const stripeClient = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  httpClient: Stripe.createFetchHttpClient(),
});

// 2. INIT REDIS & RATELIMITER
// We initialize this outside the handler so the connection is reused
const redis = new Redis({
  url: Deno.env.get("UPSTASH_REDIS_REST_URL") ?? "",
  token: Deno.env.get("UPSTASH_REDIS_REST_TOKEN") ?? "",
});

// Limit: 5 requests per 60 seconds (Sliding Window)
// This prevents card testing scripts from hammering your API
const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, "60 s"),
  analytics: false,
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 3. AUTHENTICATION
    // We need to know WHO they are before we decide if they are spamming
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    let identifier = user ? user.id : req.headers.get("x-forwarded-for") ?? "anon_ip";

    // Default to TRUE. If Redis is down/full, we let them pay.
    let isAllowed = true;
    let limitData = { limit: 0, remaining: 0 };

    try {
      const { success, limit, remaining } = await ratelimit.limit(identifier);
      isAllowed = success;
      limitData = { limit, remaining };
    } catch (err) {
      // ⚠️ CRITICAL: Upstash is down or Quota exceeded.
      // We Log it, but we DO NOT throw an error. 
      // We allow the payment to proceed ("Fail Open").
      console.error("RATE LIMITER FAILURE (Failing Open):", err);
    }

    // Only block if Redis explicitly told us to (success === false)
    if (!isAllowed) {
      console.warn(`Rate limit hit for ${identifier}`);
      return new Response(
        JSON.stringify({
          error: "Too many checkout attempts. Please wait a minute."
        }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    if (userError || !user) console.info("Unauthorized user making payment");

    // 5. PARSE BODY
    const { payment, identity } = await req.json();
    console.log("Processing payment for:", identity?.email);

    // 6. VALIDATION
    if (!payment.cents || payment.cents < 500) throw new Error("Minimum amount is $5.00");

    const customerEmail = user?.email || identity.email;
    if (!customerEmail) throw new Error("Email is required for receipt.");

    // 7. BUILD PRICE DATA
    const line_items: any = (payment.metadata.cart) ? 
    // If it's an order (with cart)
    payment.metadata.cart.map((cart_item: CartItem) => ({
          price_data: {
            currency: payment.currency,
            product_data: {
              name: cart_item.product.name
            },
            unit_amount: Math.floor(cart_item.product.amount),
          }, quantity: cart_item.quantity || 1
        }))
     : 
     //Otherwise create a default price item
      [
        {
          price_data: {
            currency: payment.currency,
            product_data: {
              name: payment.title
            },
            unit_amount: Math.floor(payment.cents),
          }, quantity: 1
        }
      ];

    if (payment.freq && line_items[0].price_data) {
      line_items[0].price_data.recurring = { interval: payment.freq };
    }
    
    // Insert a new order if it's an order
    if (payment.metadata.cart) {
      console.log("INSERTING NEW ORDER")
      const {data, error} = await supabaseClient.from("orders").insert({}).select().single();
      if(error) console.error(error);
      else payment.metadata.id = data.id
    }

    // 8. CREATE STRIPE SESSION
    const session = await stripeClient.checkout.sessions.create({
      ui_mode: 'embedded',
      payment_method_types: ["card"],
      line_items,
      mode: payment.freq ? "subscription" : "payment",
      return_url: `${payment.returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
      customer_email: customerEmail,
      shipping_address_collection: {
    allowed_countries: [payment.metadata.cart && "AU"], // Example countries
  },
      metadata: {
        user_id: user?.id,
        name: `${identity.first} ${identity.last}`,
        phone: identity.phone,
        org: identity.org,
        order_id: payment.metadata.id
      },
    });


    // RETURN SUCCESS
    return new Response(JSON.stringify({
      clientSecret: session.client_secret
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 200,
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});