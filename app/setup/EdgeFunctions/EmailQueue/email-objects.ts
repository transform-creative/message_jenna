export function generateEmailBody(email) {
  let data;
  const date = new Date(email.bookings.start).toLocaleDateString('sv-SE', {
  timeZone: 'Australia/Adelaide'
});
  const locName = (email.bookings.locums.name as string)?.split(" ")[0]

  console.log("DATE",date);

  // Locum request notification
  if (email.type === "locum_request")
    data = {
      to: { address: email.bookings.locums.email, display_name: locName },
      from: { display_name: "TWC Locum", address: "noreply@twclocum.com.au" },
      subject: `${email.bookings.pharmacies.name} sent you a request.`,
      template_id: 4893,
      template_data: {
        locum_name: locName,
        pharmacy_name: email.bookings.pharmacies.name,
        date: date,
        pharmacy_message: email.bookings.pharmacy_message || "See you soon!"
      }
    };
  // Pharmacy request notification
  if (email.type === "pharmacy_request")
    data = {
      to: { address: email.bookings.pharmacies.email, display_name: email.bookings.pharmacies.name },
      from: { display_name: "TWC Locum", address: "noreply@twclocum.com.au" },
      subject: `Confirming your request for ${locName}.`,
      template_id: 4899,
      template_data: {
        locum_name: (email.bookings.locums.name as string)?.split(" ")[0],
        pharm_name: email.bookings.pharmacies.name,
        date: date
      }
    };
    // Pharmacy confirm notificaton
    if (email.type === "pharmacy_confirm") {
    data = {
      to: { address: email.bookings.pharmacies.email, display_name: email.bookings.pharmacies.name },
      from: { display_name: "TWC Locum", address: "noreply@twclocum.com.au" },
      subject: `${locName} has ${email.bookings.is_approved===true ? "accepted" : "declined"} your request.`,
      template_id: 4902,
      template_data: {
        locum_name: (email.bookings.locums.name as string)?.split(" ")[0],
        pharm_name: email.bookings.pharmacies.name,
        date: date,
        locum_message: email.bookings.locum_message,
        confirm_status: email.bookings.is_approved===true ? "accepted" : "declined"
      }
    };
    }



  return {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      'X-API-Key': `${Deno.env.get("MAILEROO_SENDING_KEY")}`,
      "content-type": 'application/json'
    }
  };
}