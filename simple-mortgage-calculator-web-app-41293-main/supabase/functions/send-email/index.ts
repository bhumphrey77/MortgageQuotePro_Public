import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { renderAsync } from "https://esm.sh/@react-email/components@0.0.22";
import React from "https://esm.sh/react@18.3.1";
import { PasswordResetEmail } from "./_templates/password-reset.tsx";
import { WelcomeEmail } from "./_templates/welcome.tsx";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);
const hookSecret = Deno.env.get("SEND_EMAIL_HOOK_SECRET") as string;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("=== SEND-EMAIL FUNCTION INVOKED ===");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  console.log("Headers:", Object.fromEntries(req.headers));
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    console.error("Method not allowed:", req.method);
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);
    
    console.log("Payload length:", payload.length);
    console.log("Received webhook request");

    // Verify webhook signature
    const wh = new Webhook(hookSecret);
    let webhookData;
    
    try {
      webhookData = wh.verify(payload, headers) as {
        user: {
          email: string;
          id: string;
          user_metadata?: {
            full_name?: string;
          };
        };
        email_data: {
          token: string;
          token_hash: string;
          redirect_to: string;
          email_action_type: string;
          site_url: string;
        };
      };
    } catch (error) {
      console.error("Webhook verification failed:", error);
      return new Response(
        JSON.stringify({
          error: {
            message: "Webhook verification failed",
          },
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const { user, email_data } = webhookData;
    const { token, token_hash, redirect_to, email_action_type } = email_data;
    
    console.log("Processing email for user:", user.email);
    console.log("Email action type:", email_action_type);

    let html: string;
    let subject: string;
    const userName = user.user_metadata?.full_name || user.email.split("@")[0];

    // Determine which template to use based on email action type
    switch (email_action_type) {
      case "recovery":
        subject = "Reset your Mortgage Quote Pro password";
        html = await renderAsync(
          React.createElement(PasswordResetEmail, {
            supabase_url: Deno.env.get("SUPABASE_URL") ?? "",
            token,
            token_hash,
            redirect_to,
            email_action_type,
          })
        );
        break;

      case "signup":
      case "invite":
      case "magic_link":
        subject = "Welcome to Mortgage Quote Pro! 🎉";
        html = await renderAsync(
          React.createElement(WelcomeEmail, {
            supabase_url: Deno.env.get("SUPABASE_URL") ?? "",
            token,
            token_hash,
            redirect_to,
            email_action_type,
            user_name: userName,
          })
        );
        break;

      case "email_change":
        subject = "Confirm your email change - Mortgage Quote Pro";
        html = await renderAsync(
          React.createElement(WelcomeEmail, {
            supabase_url: Deno.env.get("SUPABASE_URL") ?? "",
            token,
            token_hash,
            redirect_to,
            email_action_type,
            user_name: userName,
          })
        );
        break;

      default:
        console.error("Unknown email action type:", email_action_type);
        return new Response(
          JSON.stringify({
            error: {
              message: "Unknown email action type",
            },
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
    }

    console.log("Sending email via Resend...");

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: "Mortgage Quote Pro <noreply@mortgagequotepro.com>",
      to: [user.email],
      subject,
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      throw error;
    }

    console.log("Email sent successfully:", data);

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error("Error in send-email function:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({
        error: {
          message: errorMessage,
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
