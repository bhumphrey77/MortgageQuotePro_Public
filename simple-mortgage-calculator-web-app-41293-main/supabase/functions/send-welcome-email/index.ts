import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  fullName: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the user is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase client to verify the user
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Authentication failed:", authError?.message);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { email, fullName }: WelcomeEmailRequest = await req.json();

    // Verify the email matches the authenticated user's email
    if (user.email?.toLowerCase() !== email.toLowerCase()) {
      console.error(`Email mismatch: user ${user.email} tried to send to ${email}`);
      return new Response(
        JSON.stringify({ error: "Forbidden: Can only send welcome email to your own address" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    console.log(`Sending welcome email to ${email} for ${fullName} (verified user: ${user.id})`);

    const firstName = fullName?.split(' ')[0] || 'there';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f9fafb;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb; max-width: 600px;">
          <tr>
            <td style="padding: 40px;">
              <!-- Header -->
              <h1 style="color: #1e40af; font-size: 28px; font-weight: bold; margin: 0 0 30px 0; text-align: center;">
                Mortgage Quote Pro
              </h1>
              
              <!-- Greeting -->
              <p style="color: #111827; font-size: 18px; font-weight: 600; line-height: 28px; margin: 0 0 16px 0;">
                Welcome, ${firstName}! 👋
              </p>
              
              <!-- Main content -->
              <p style="color: #374151; font-size: 16px; line-height: 26px; margin: 0 0 16px 0;">
                Thank you for joining Mortgage Quote Pro! We're excited to have you on board.
              </p>
              
              <p style="color: #374151; font-size: 16px; line-height: 26px; margin: 0 0 24px 0;">
                With your account, you can now access professional mortgage calculation tools designed specifically for loan officers like you.
              </p>
              
              <!-- CTA Button -->
              <a href="https://mortgagequotepro.com/dashboard" target="_blank" style="display: block; background-color: #1e40af; border-radius: 6px; color: #ffffff; font-size: 16px; font-weight: 600; line-height: 50px; text-align: center; text-decoration: none; margin: 24px 0;">
                Go to Dashboard
              </a>
              
              <!-- Features list -->
              <p style="color: #374151; font-size: 16px; line-height: 26px; margin: 24px 0 16px 0;">
                Here's what you can do:
              </p>
              
              <ul style="color: #374151; font-size: 16px; line-height: 26px; margin: 0 0 24px 0; padding-left: 24px;">
                <li style="margin-bottom: 8px;">Calculate accurate mortgage payments</li>
                <li style="margin-bottom: 8px;">Compare loan scenarios side-by-side</li>
                <li style="margin-bottom: 8px;">Generate professional PDF exports</li>
                <li style="margin-bottom: 8px;">Create pre-approval letters</li>
              </ul>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 22px; margin: 24px 0 0 0;">
                If you have any questions, just reply to this email—we're here to help!
              </p>
              
              <!-- Footer -->
              <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
                <p style="color: #6b7280; font-size: 14px; line-height: 22px; margin: 0;">
                  <strong>Mortgage Quote Pro</strong><br>
                  Professional mortgage calculations made easy
                </p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Mortgage Quote Pro <noreply@mortgagequotepro.com>",
      to: [email],
      subject: `Welcome to Mortgage Quote Pro, ${firstName}!`,
      html,
    });

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending welcome email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
