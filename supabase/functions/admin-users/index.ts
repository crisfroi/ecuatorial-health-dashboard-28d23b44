import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  console.log('🚀 admin-users function started');

  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight request');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('📥 Processing admin-users request...');
    
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const requestBody = await req.json();
    const { action, userId, updates } = requestBody;

    console.log('📋 Request details:', { action, userId: !!userId, hasUpdates: !!updates });

    switch (action) {
      case 'listUsers':
        console.log('👥 Listing users...');
        
        // Get users from auth
        const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
        
        if (authError) {
          console.error('❌ Auth error:', authError);
          throw new Error(`Error fetching auth users: ${authError.message}`);
        }

        console.log(`📊 Found ${authUsers.users.length} auth users`);

        // Transform to UserProfile format
        const users = authUsers.users.map(user => ({
          id: user.id,
          email: user.email || '',
          role: user.user_metadata?.role || 'OBSERVADOR',
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario',
          department: user.user_metadata?.department || 'Ministerio de Sanidad y Bienestar Social',
          assigned_center_id: user.user_metadata?.assigned_center_id || null,
          created_at: user.created_at,
          updated_at: user.updated_at || user.created_at,
          is_active: !user.banned_until
        }));

        console.log(`✅ Processed ${users.length} users for response`);

        return new Response(
          JSON.stringify({
            success: true,
            users: users
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );

      case 'updateUser':
        console.log('✏️ Updating user:', userId);
        
        if (!userId || !updates) {
          throw new Error('Missing userId or updates for user update');
        }

        // Update user metadata
        const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          {
            user_metadata: {
              role: updates.role,
              full_name: updates.full_name,
              department: updates.department
            }
          }
        );

        if (updateError) {
          console.error('❌ Update error:', updateError);
          throw new Error(`Error updating user: ${updateError.message}`);
        }

        console.log('✅ User updated successfully');

        return new Response(
          JSON.stringify({
            success: true,
            user: updatedUser
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );

      case 'deleteUser':
        console.log('🗑️ Deleting user:', userId);
        
        if (!userId) {
          throw new Error('Missing userId for user deletion');
        }

        // Delete user from auth
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (deleteError) {
          console.error('❌ Delete error:', deleteError);
          throw new Error(`Error deleting user: ${deleteError.message}`);
        }

        console.log('✅ User deleted successfully');

        return new Response(
          JSON.stringify({
            success: true,
            message: 'User deleted successfully'
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );

      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('❌ Error in admin-users function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
