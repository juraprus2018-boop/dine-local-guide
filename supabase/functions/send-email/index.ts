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
      hostname: "mijn-restaurant.nl",
      port: 465,
      tls: true,
      auth: {
        username: "info@mijn-restaurant.nl",
        password: Deno.env.get("SMTP_PASSWORD") || "",
      },
    },
  });

  const toAddresses = Array.isArray(request.to) ? request.to : [request.to];

  try {
    await client.send({
      from: "Mijn Restaurant <info@mijn-restaurant.nl>",
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
      case 'verification': {
        // Email verification link
        const { email, displayName, confirmationUrl } = data;
        
        await sendEmail({
          to: email,
          subject: "Bevestig je Mijn Restaurant account",
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .card { background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                .header { background: #E86A5C; padding: 40px 30px; text-align: center; }
                .header img { height: 50px; margin-bottom: 15px; }
                .header h1 { color: white; margin: 0; font-size: 24px; font-weight: 700; }
                .content { padding: 40px 30px; }
                .content h2 { font-size: 22px; margin: 0 0 20px 0; color: #333; }
                .button { display: inline-block; background: #E86A5C; color: white !important; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 25px 0; }
                .button:hover { background: #d55a4c; }
                .note { background: #fff8f7; border: 1px solid #fde2df; padding: 15px; border-radius: 8px; margin: 20px 0; font-size: 14px; color: #666; }
                .footer { background: #f8f8f8; padding: 25px 30px; text-align: center; font-size: 12px; color: #999; }
                .link-text { color: #E86A5C; word-break: break-all; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="card">
                  <div class="header">
                    <h1>🍽️ Mijn Restaurant</h1>
                  </div>
                  <div class="content">
                    <h2>Hallo ${displayName || 'daar'}! 👋</h2>
                    <p>Bedankt voor je registratie bij Mijn Restaurant! Klik op de knop hieronder om je emailadres te bevestigen en je account te activeren.</p>
                    
                    <div style="text-align: center;">
                      <a href="${confirmationUrl}" class="button">✉️ Bevestig mijn email</a>
                    </div>
                    
                    <div class="note">
                      <strong>Werkt de knop niet?</strong><br>
                      Kopieer en plak deze link in je browser:<br>
                      <span class="link-text">${confirmationUrl}</span>
                    </div>
                    
                    <p style="color: #666; font-size: 14px;">Deze link is 24 uur geldig. Als je geen account hebt aangemaakt, kun je deze email negeren.</p>
                  </div>
                  <div class="footer">
                    <p>© ${new Date().getFullYear()} Mijn Restaurant. Alle rechten voorbehouden.</p>
                    <p>Ontdek de beste restaurants in Nederland</p>
                  </div>
                </div>
              </div>
            </body>
            </html>
          `,
        });

        // Notify admin about new registration
        await sendEmail({
          to: "info@mijn-restaurant.nl",
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
                  <p>Er heeft zich een nieuwe gebruiker geregistreerd bij Mijn Restaurant:</p>
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

      case 'welcome': {
        // Welcome email to new user (after verification)
        const { email, displayName } = data;
        
        await sendEmail({
          to: email,
          subject: "Welkom bij Mijn Restaurant! 🎉",
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .card { background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                .header { background: #E86A5C; padding: 40px 30px; text-align: center; }
                .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
                .content { padding: 40px 30px; }
                .button { display: inline-block; background: #E86A5C; color: white !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
                .feature { display: flex; align-items: flex-start; margin: 15px 0; }
                .feature-icon { font-size: 24px; margin-right: 15px; }
                .footer { background: #f8f8f8; padding: 25px 30px; text-align: center; font-size: 12px; color: #999; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="card">
                  <div class="header">
                    <h1>Welkom bij Mijn Restaurant! 🎉</h1>
                  </div>
                  <div class="content">
                    <p style="font-size: 18px;">Hallo ${displayName || 'daar'}! 👋</p>
                    <p>Je account is nu actief. Dit kun je doen met Mijn Restaurant:</p>
                    
                    <div class="feature">
                      <span class="feature-icon">🍽️</span>
                      <div>
                        <strong>Ontdek restaurants</strong><br>
                        <span style="color: #666;">Vind de beste eetplekken in jouw buurt</span>
                      </div>
                    </div>
                    
                    <div class="feature">
                      <span class="feature-icon">⭐</span>
                      <div>
                        <strong>Lees & schrijf reviews</strong><br>
                        <span style="color: #666;">Deel je ervaringen met anderen</span>
                      </div>
                    </div>
                    
                    <div class="feature">
                      <span class="feature-icon">❤️</span>
                      <div>
                        <strong>Bewaar favorieten</strong><br>
                        <span style="color: #666;">Sla je favoriete restaurants op</span>
                      </div>
                    </div>
                    
                    <div style="text-align: center;">
                      <a href="https://mijn-restaurant.nl" class="button">Begin met ontdekken →</a>
                    </div>
                  </div>
                  <div class="footer">
                    <p>© ${new Date().getFullYear()} Mijn Restaurant. Alle rechten voorbehouden.</p>
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
                    <p>© ${new Date().getFullYear()} Mijn Restaurant. Alle rechten voorbehouden.</p>
                  </div>
                </div>
              </body>
              </html>
            `,
          });
        }

        // Notify admin about new review
        await sendEmail({
          to: "info@mijn-restaurant.nl",
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

      case 'review_approved': {
        // Email to reviewer when review is approved
        const { email, name, restaurantName, restaurantUrl, rating } = data;
        
        await sendEmail({
          to: email,
          subject: `Je review van ${restaurantName} staat nu online! 🎉`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .card { background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                .header { background: #22c55e; padding: 40px 30px; text-align: center; }
                .header h1 { color: white; margin: 0; font-size: 24px; font-weight: 700; }
                .content { padding: 40px 30px; }
                .button { display: inline-block; background: #E86A5C; color: white !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
                .review-box { background: #f0fdf4; border: 1px solid #86efac; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
                .stars { color: #f59e0b; font-size: 24px; }
                .footer { background: #f8f8f8; padding: 25px 30px; text-align: center; font-size: 12px; color: #999; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="card">
                  <div class="header">
                    <h1>✅ Je review is goedgekeurd!</h1>
                  </div>
                  <div class="content">
                    <p style="font-size: 18px;">Hallo ${name || 'daar'}! 👋</p>
                    <p>Goed nieuws! Je review voor <strong>${restaurantName}</strong> is goedgekeurd en staat nu online.</p>
                    
                    <div class="review-box">
                      <p style="margin: 0 0 10px 0; font-weight: 600;">Je beoordeling:</p>
                      <p class="stars">${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}</p>
                    </div>
                    
                    <p>Bedankt voor je bijdrage! Je helpt anderen bij het vinden van de beste restaurants.</p>
                    
                    <div style="text-align: center;">
                      <a href="${restaurantUrl}" class="button">Bekijk je review →</a>
                    </div>
                  </div>
                  <div class="footer">
                    <p>© ${new Date().getFullYear()} Mijn Restaurant. Alle rechten voorbehouden.</p>
                  </div>
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
