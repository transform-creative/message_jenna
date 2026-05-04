/***************************************************************
 * This function allows admins to invite a locum to the system
 */

import { createClient } from 'npm:@supabase/supabase-js@2';
Deno.serve(async (req)=>{
  // Handle OPTIONS preflight requests for CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Authorization, x-client-info, apikey, Content-Type",
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    });
  }
  // Create Supabase client with service role
  const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));

  // Ensure only admin can call function
  const authHeader = req.headers.get('Authorization').split("Bearer ")[1]?.trim();
  const user = await supabase.auth.getUser(authHeader);
  console.log("USER", user.data.user.user_metadata);
  if (user.data.user.user_metadata.role != 'admin') {
    console.error("NOT AUTHORISED");
    return new Response(JSON.stringify({
      error: 'Unauthorized'
    }), {
      status: 403,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({
      error: 'Method Not Allowed'
    }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
  try {
    //Parse the request body
    const requestBody = await req.json();
    const { email, name,role } = requestBody;

    // Validate input
    if (!email || !name || !role) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: email, name, role'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    // Invite the user
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: {
        name,
        role,
        invited_at: new Date().toISOString()
      }
    });
    if (error) {
      console.error("500-1", error);
      return new Response(JSON.stringify({
        error: error.message
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    console.info("SUCCESS!");
    return new Response('ok', {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Authorization, x-client-info, apikey, Content-Type",
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    });
  } catch (catchError) {
    console.error("500-2", catchError);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: catchError.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
});
