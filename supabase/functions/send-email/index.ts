import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

async function sendEmail(request: EmailRequest): Promise<void> {
  const client = new SMTPClient({
    connection: {
      hostname: "happio.nl",
      port: 465,
      tls: true,
      auth: {
        username: "info@happio.nl",
        password: Deno.env.get("SMTP_PASSWORD") || "",
      },
    },
  });

  const toAddresses = Array.isArray(request.to) ? request.to : [request.to];

  try {
    await client.send({
      from: "Happio <info@happio.nl>",
      to: toAddresses,
      subject: request.subject,
      content: request.text || "",
      html: request.html,
    });
    console.log(`Email sent to: ${toAddresses.join(", ")}`);
  } finally {
    await client.close();
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, data } = await req.json();
    console.log(`Processing email type: ${type}`);

    switch (type) {
      case 'welcome': {
        // Welcome email to new user
        const { email, displayName } = data;
        
        await sendEmail({
          to: email,
          subject: "Welkom bij Happio! 🎉",
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #f97316, #ea580c); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .header h1 { color: white; margin: 0; font-size: 28px; }
                .content { background: #fff; padding: 30px; border: 1px solid #eee; }
                .footer { background: #f8f8f8; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px; }
                .button { display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Welkom bij Happio!</h1>
                </div>
                <div class="content">
                  <p>Hallo ${displayName || 'daar'}! 👋</p>
                  <p>Bedankt voor je registratie bij Happio. We zijn blij dat je er bent!</p>
                  <p>Met Happio kun je:</p>
                  <ul>
                    <li>De beste restaurants in jouw buurt ontdekken</li>
                    <li>Reviews lezen en schrijven</li>
                    <li>Je favoriete restaurants opslaan</li>
                    <li>Menu's en openingstijden bekijken</li>
                  </ul>
                  <p>Begin nu met het verkennen van restaurants!</p>
                  <a href="https://happio.nl" class="button">Ontdek Restaurants</a>
                </div>
                <div class="footer">
                  <p>© ${new Date().getFullYear()} Happio. Alle rechten voorbehouden.</p>
                  <p>Je ontvangt deze email omdat je een account hebt aangemaakt bij Happio.</p>
                </div>
              </div>
            </body>
            </html>
          `,
        });

        // Notify admin about new registration
        await sendEmail({
          to: "info@happio.nl",
          subject: `Nieuwe registratie: ${displayName || email}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #1a1a1a; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                .header h1 { color: white; margin: 0; font-size: 24px; }
                .content { background: #fff; padding: 30px; border: 1px solid #eee; }
                .info-box { background: #f8f8f8; padding: 15px; border-radius: 6px; margin: 15px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>📧 Nieuwe Registratie</h1>
                </div>
                <div class="content">
                  <p>Er heeft zich een nieuwe gebruiker geregistreerd bij Happio:</p>
                  <div class="info-box">
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Naam:</strong> ${displayName || 'Niet opgegeven'}</p>
                    <p><strong>Datum:</strong> ${new Date().toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' })}</p>
                  </div>
                </div>
              </div>
            </body>
            </html>
          `,
        });
        break;
      }

      case 'review': {
        // Review notification emails
        const { reviewerEmail, reviewerName, restaurantName, rating, content, cityName } = data;
        
        // Email to reviewer
        if (reviewerEmail) {
          await sendEmail({
            to: reviewerEmail,
            subject: `Bedankt voor je review van ${restaurantName}! ⭐`,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <style>
                  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #f97316, #ea580c); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                  .header h1 { color: white; margin: 0; font-size: 28px; }
                  .content { background: #fff; padding: 30px; border: 1px solid #eee; }
                  .review-box { background: #fef3e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f97316; }
                  .stars { color: #f59e0b; font-size: 20px; }
                  .footer { background: #f8f8f8; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>Bedankt voor je review!</h1>
                  </div>
                  <div class="content">
                    <p>Hoi ${reviewerName || 'daar'}! 👋</p>
                    <p>Bedankt dat je de tijd hebt genomen om een review te schrijven voor <strong>${restaurantName}</strong>.</p>
                    <div class="review-box">
                      <p class="stars">${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}</p>
                      <p>${content || 'Geen tekst toegevoegd'}</p>
                    </div>
                    <p>Je review helpt andere bezoekers bij het vinden van de beste restaurants!</p>
                  </div>
                  <div class="footer">
                    <p>© ${new Date().getFullYear()} Happio. Alle rechten voorbehouden.</p>
                  </div>
                </div>
              </body>
              </html>
            `,
          });
        }

        // Notify admin about new review
        await sendEmail({
          to: "info@happio.nl",
          subject: `Nieuwe review: ${restaurantName} - ${rating}★`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #1a1a1a; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                .header h1 { color: white; margin: 0; font-size: 24px; }
                .content { background: #fff; padding: 30px; border: 1px solid #eee; }
                .info-box { background: #f8f8f8; padding: 15px; border-radius: 6px; margin: 15px 0; }
                .stars { color: #f59e0b; font-size: 18px; }
                .review-text { background: #fef3e2; padding: 15px; border-radius: 6px; margin: 10px 0; font-style: italic; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>⭐ Nieuwe Review</h1>
                </div>
                <div class="content">
                  <p>Er is een nieuwe review geplaatst:</p>
                  <div class="info-box">
                    <p><strong>Restaurant:</strong> ${restaurantName}</p>
                    <p><strong>Stad:</strong> ${cityName || 'Onbekend'}</p>
                    <p><strong>Rating:</strong> <span class="stars">${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}</span></p>
                    <p><strong>Reviewer:</strong> ${reviewerName || 'Anoniem'}</p>
                    <p><strong>Email:</strong> ${reviewerEmail || 'Niet opgegeven'}</p>
                    <p><strong>Datum:</strong> ${new Date().toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' })}</p>
                  </div>
                  ${content ? `<div class="review-text">"${content}"</div>` : ''}
                </div>
              </div>
            </body>
            </html>
          `,
        });
        break;
      }

      default:
        throw new Error(`Unknown email type: ${type}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Email error:', error);
    return new Response(
      JSON.stringify({ error: errorMsg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
