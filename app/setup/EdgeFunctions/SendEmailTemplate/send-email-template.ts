// Edge Function Code (e.g., in send-email-edge.ts)
Deno.serve(async (req)=>{
  const emailData = await req.json();
  // Extract email data from the request (e.g., body)
  const { to, from, subject, template_id, dynamic_template_data } = await emailData;
  const data = new FormData();
  data.append('to', to);
  data.append('from', from);
  data.append('subject', subject);
  data.append('template_id', template_id);
  if (dynamic_template_data) {
    data.append('template_data', JSON.stringify(dynamic_template_data));
  }
  console.info("SENDING Email with form params", data);
  // Set up the request options
  const options = {
    method: "POST",
    body: data,
    headers: {
      'X-API-Key': `${Deno.env.get("MAILEROO_SENDING_KEY")}`
    }
  };
  try {
    // Send the email using fetch
    const response = await fetch("https://smtp.maileroo.com/send-template", options);
    // Check for errors
    if (!response.ok) {
      console.error("Error sending email:", await response.json());
      return new Response(JSON.stringify({
        error: "Failed to send email"
      }), {
        status: 501
      });
    }
    console.log(await response);
    // Return a success response
    return new Response(JSON.stringify({
      message: "Email sent successfully"
    }), {
      status: 200
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return new Response(JSON.stringify({
      error: "Failed to send email"
    }), {
      status: 502
    });
  }
});
