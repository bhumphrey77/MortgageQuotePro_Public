import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// In-memory rate limiting store (resets on function cold start)
// For production, consider using a persistent store like Redis or database
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_MAX_REQUESTS = 3; // Max 3 requests per email per hour
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour in milliseconds

function isRateLimited(email: string): boolean {
  const now = Date.now();
  const key = email.toLowerCase().trim();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    // Create new record or reset expired one
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  // Increment count
  record.count++;
  rateLimitStore.set(key, record);
  return false;
}

// Clean up old entries periodically to prevent memory bloat
function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    
    // Validate email format
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      console.log("Invalid email format provided");
      // Always return generic success to prevent enumeration
      return new Response(
        JSON.stringify({ success: true, message: "If an account exists with this email, a password reset link has been sent." }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log("Processing password reset request");

    // Check rate limiting
    if (isRateLimited(normalizedEmail)) {
      console.log("Rate limit exceeded for password reset request");
      // Return generic success to prevent enumeration via rate limit errors
      return new Response(
        JSON.stringify({ success: true, message: "If an account exists with this email, a password reset link has been sent." }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Cleanup old rate limit entries
    cleanupRateLimitStore();

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Generate password reset link
    const { data: resetData, error: resetError } = await supabaseClient.auth.admin.generateLink({
      type: 'recovery',
      email: normalizedEmail,
      options: {
        redirectTo: `${req.headers.get('origin') || 'https://htwwvwwdyqwpjhghjbpi.supabase.co'}/reset-password`
      }
    });

    if (resetError) {
      console.error("Error generating reset link:", resetError.message);
      // Always return generic success to prevent enumeration
      return new Response(
        JSON.stringify({ success: true, message: "If an account exists with this email, a password reset link has been sent." }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const resetLink = resetData.properties?.action_link || '';
    console.log("Reset link generated successfully");

    // Use Lovable AI to compose email
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are an email copywriter for Mortgage Quote Pro. Write professional, friendly, and concise password reset emails."
          },
          {
            role: "user",
            content: `Create a password reset email for a user. Include a warm greeting, explain they requested a password reset, and mention that they should click the button below to reset their password. Keep it professional but friendly. DO NOT include any URLs or links in your response - we'll add the button separately.`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      throw new Error(`AI Gateway error: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const emailContent = aiData.choices?.[0]?.message?.content || '';

    // Convert markdown to HTML (simple conversion)
    const htmlContent = emailContent
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');

    // Send email via Resend
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Mortgage Quote Pro <noreply@mortgagequotepro.com>",
      to: [normalizedEmail],
      subject: "Reset your Mortgage Quote Pro password",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .button { 
                display: inline-block; 
                padding: 12px 24px; 
                background-color: #000000; 
                color: #ffffff !important; 
                text-decoration: none; 
                border-radius: 6px; 
                margin: 20px 0;
                font-weight: bold;
              }
              .footer { margin-top: 30px; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              ${htmlContent}
              <a href="${resetLink}" class="button">Reset Password</a>
              <div class="footer">
                <p>If you didn't request this password reset, please ignore this email.</p>
                <p>This link will expire in 1 hour.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (emailError) {
      console.error("Resend error:", emailError);
      throw emailError;
    }

    console.log("Password reset email sent successfully");

    // Always return generic success message
    return new Response(
      JSON.stringify({ success: true, message: "If an account exists with this email, a password reset link has been sent." }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("Error in send-reset-email function:", error);
    // Return generic success even on error to prevent enumeration
    return new Response(
      JSON.stringify({ success: true, message: "If an account exists with this email, a password reset link has been sent." }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
