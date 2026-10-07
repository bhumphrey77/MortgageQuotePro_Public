import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get("slug");

    if (!slug || typeof slug !== "string" || slug.length < 1 || slug.length > 100) {
      return new Response(
        JSON.stringify({ error: "Invalid or missing slug parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sanitize slug - only allow alphanumeric, hyphens, underscores
    const sanitizedSlug = slug.replace(/[^a-zA-Z0-9\-_]/g, "");
    if (sanitizedSlug !== slug) {
      return new Response(
        JSON.stringify({ error: "Invalid slug format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role to call the secure function
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Call the secure RPC function to get loan officer ID
    const { data: loanOfficerId, error: rpcError } = await supabase.rpc(
      "get_loan_officer_id_by_slug",
      { p_slug: sanitizedSlug }
    );

    if (rpcError || !loanOfficerId) {
      return new Response(
        JSON.stringify({ error: "Loan officer not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch only public profile data (no sensitive fields)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(`
        full_name,
        title,
        company_name,
        company_address,
        company_phone,
        work_email,
        phone,
        website,
        avatar_url,
        logo_url,
        logo_aspect_ratio,
        nmls_license,
        nmls_company,
        state_license_text,
        preferred_font,
        custom_font_url
      `)
      .eq("id", loanOfficerId)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "Profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate signed URLs for storage assets (1 hour expiry)
    let signedAvatarUrl: string | null = null;
    let signedLogoUrl: string | null = null;

    if (profile.avatar_url) {
      // avatar_url stores the path within the bucket
      const { data: avatarData } = await supabase.storage
        .from("avatars")
        .createSignedUrl(profile.avatar_url, 3600);
      signedAvatarUrl = avatarData?.signedUrl || null;
    }

    if (profile.logo_url) {
      const { data: logoData } = await supabase.storage
        .from("logos")
        .createSignedUrl(profile.logo_url, 3600);
      signedLogoUrl = logoData?.signedUrl || null;
    }

    // Return public profile data with signed URLs
    return new Response(
      JSON.stringify({ 
        success: true, 
        profile: {
          full_name: profile.full_name,
          title: profile.title,
          company_name: profile.company_name,
          company_address: profile.company_address,
          company_phone: profile.company_phone,
          work_email: profile.work_email,
          phone: profile.phone,
          website: profile.website,
          avatar_url: signedAvatarUrl,
          logo_url: signedLogoUrl,
          logo_aspect_ratio: profile.logo_aspect_ratio,
          nmls_license: profile.nmls_license,
          nmls_company: profile.nmls_company,
          state_license_text: profile.state_license_text,
          preferred_font: profile.preferred_font,
          custom_font_url: profile.custom_font_url,
        }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in lookup-loan-officer:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
