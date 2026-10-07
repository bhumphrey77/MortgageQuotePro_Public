import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get the authorization header to verify the requester
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('[DELETE-USER] No authorization header');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify the requester is authenticated
    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    
    const { data: { user: requester }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !requester) {
      console.log('[DELETE-USER] Auth error:', authError?.message);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[DELETE-USER] Requester:', requester.email);

    // Check if requester is owner or admin
    const { data: isOwnerOrAdmin, error: roleError } = await supabaseAdmin.rpc('is_owner_or_admin', {
      _user_id: requester.id,
    });

    if (roleError || !isOwnerOrAdmin) {
      console.log('[DELETE-USER] Requester is not owner/admin');
      return new Response(JSON.stringify({ error: 'Forbidden - Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the user ID to delete from request body
    const { userId } = await req.json();
    if (!userId) {
      console.log('[DELETE-USER] No userId provided');
      return new Response(JSON.stringify({ error: 'User ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[DELETE-USER] Attempting to delete user:', userId);

    // Prevent self-deletion
    if (userId === requester.id) {
      console.log('[DELETE-USER] Attempted self-deletion');
      return new Response(JSON.stringify({ error: 'Cannot delete your own account' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if target user is an owner (cannot delete owners)
    const { data: targetRoles, error: targetRolesError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    if (targetRolesError) {
      console.log('[DELETE-USER] Error fetching target roles:', targetRolesError.message);
    }

    const isOwner = targetRoles?.some(r => r.role === 'owner');
    if (isOwner) {
      console.log('[DELETE-USER] Cannot delete owner account');
      return new Response(JSON.stringify({ error: 'Cannot delete owner account' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Delete the user using admin API (cascades to profiles, subscriptions, user_roles, saved_quotes)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.log('[DELETE-USER] Error deleting user:', deleteError.message);
      return new Response(JSON.stringify({ error: deleteError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[DELETE-USER] Successfully deleted user:', userId);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[DELETE-USER] Unexpected error:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
