import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.21.4";
import { Redis } from "https://esm.sh/@upstash/redis@1.22.0";
import { Ratelimit } from "https://esm.sh/@upstash/ratelimit@0.4.3";

// 1. Setup Redis (Reuse your existing env vars)
const redis = new Redis({
  url: Deno.env.get("UPSTASH_REDIS_REST_URL") ?? "",
  token: Deno.env.get("UPSTASH_REDIS_REST_TOKEN") ?? "",
});

// A slightly more generous limit for logging (e.g., 20 logs per minute per IP)
const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.fixedWindow(20, "60 s"),
  analytics: false,
});

// 2. Define Strict Schema
// This prevents users from sending garbage data
const logSchema = z.object({
  event_type: z.string().max(500), // Limit length
  severity: z.enum(['info', 'warning', 'error', 'critical']),
  metadata: z.any().optional(), // Limit object size conceptually
  // We don't trust the client to send the user_id or timestamp. We generate those here.
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 3. Rate Limit Check (IP Based)
    const ip = req.headers.get("x-forwarded-for") ?? "anon_ip";
    const { success } = await ratelimit.limit(`log_${ip}`);
    
    if (!success) {
      // Fail silently or with 429 - don't let them know they are blocked effectively
      return new Response(null, { status: 429, headers: { "Access-Control-Allow-Origin": "*" } });
    }

    // 4. Validate Payload
    const body = await req.json();
    const result = logSchema.safeParse(body);


    if (!result.success) {
          console.error(result.error, body)
      return new Response("Invalid Log Format", { status: 400 });
    }

    const { event_type, severity, metadata } = result.data;

    // 5. Initialize Admin Client (Service Role)
    // This client bypasses RLS
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 6. Insert Safely
    // We sanitize the data by reconstructing the object
    const { error } = await supabaseAdmin.from('audit_logs').insert({
      event_type,
      severity,
      metadata: metadata || {},
      ip_address: ip, // We log the IP for security auditing
      user_id: null, // It's anonymous
      timestamp: new Date().toISOString()
    });

    if (error) throw error;

    return new Response("Logged", { 
      status: 200, 
      headers: { "Access-Control-Allow-Origin": "*" } 
    });

  } catch (err) {
    // In logging, we rarely want to return the actual error to the client
    return new Response("Server Error", { status: 500 });
  }
});