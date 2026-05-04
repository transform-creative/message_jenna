import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { generateEmailBody } from "./email-objects.ts"

const BATCH_SIZE = 20 // Process 20 emails at a time

serve(async (req) => {
  // 1. Setup Supabase Client with Service Role (Admin)
  // We need admin access to bypass RLS and update queue statuses
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    // We get 'pending' items and immediately update them to 'processing'
    // so other concurrent runs don't grab them.

    // Step A: Get the IDs of the pending items
    const { data: queueItems, error: fetchError } = await supabase
      .from('email_queue')
      .select(`
        *,
        bookings (*,
          locums(*),
          pharmacies(*))`
      )
      .eq('status', 'pending')
      .limit(BATCH_SIZE)

    if (fetchError) throw fetchError;
    if (!queueItems || queueItems.length === 0) {
      return new Response(JSON.stringify({ message: 'Queue is empty' }), { status: 200 })
    }

    // Step B: Mark these IDs as 'processing' immediately
    const queueIds = queueItems.map(item => item.id)
    await supabase
      .from('email_queue')
      .update({ status: 'processing', updated_at: new Date() })
      .in('id', queueIds)

    // 3. PROCESS THE BATCH
    // We use Promise.allSettled so one failure doesn't crash the whole batch
    const results = await Promise.allSettled(
      queueItems.map(async (email) => {

        if (!email) {
          throw new Error(`Data missing for queue item ${email.id}`)
        }
        
        const response = await fetch(" https://smtp.maileroo.com/api/v2/emails/template", generateEmailBody(email));

        if (!response.ok) {
          console.error(response);
          throw new Error();
        }
        return { queueId: email.id, response: response }
      })
    )

    // 4. HANDLE RESULTS & UPDATE STATUS
    const updates = results.map((result, index) => {
      const queueId = queueIds[index]

      if (result.status === 'fulfilled') {
        // Success: Mark as sent
        return supabase
          .from('email_queue')
          .update({ status: 'sent', updated_at: new Date() })
          .eq('id', queueId)
      } else {
        // Failure: Mark as failed and increment retry count
        // (You can add logic here to only set 'failed' after 3 retries)
        console.error(`Failed to send email for queue item ${queueId}:`, result.reason)

        //return supabase.rpc('increment_retry_and_fail', { row_id: queueId }) 
        // ^ Note: I recommend a small SQL function for atomic increments, 
        // but for now, you can just set status='failed'
      }
    })

    await Promise.all(updates)

    return new Response(
      JSON.stringify({ message: `Processed ${queueItems.length} emails` }),
      { headers: { "Content-Type": "application/json" } }
    )

  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), { status: 502 })
  }
})