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
    const { action, userId, updates, username, password, email, role, full_name, department, assigned_center_id } = requestBody;

    console.log('📋 Request details:', { action, userId: !!userId, hasUpdates: !!updates });

    switch (action) {
      case 'createUser':
        console.log('👤 Creating user via admin API');

        if ((!username && !email) || !password || !role) {
          throw new Error('Missing required fields: username/email, password, role');
        }

        const sanitizedUsername = username ? String(username).trim().toLowerCase() : null;
        const finalEmail = (email && String(email).trim()) || (sanitizedUsername ? `${sanitizedUsername}@sanidad.gq` : null);
        if (!finalEmail) {
          throw new Error('Unable to resolve email');
        }

        const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
          email: finalEmail,
          password: String(password),
          email_confirm: true,
          user_metadata: {
            role,
            full_name: full_name || (finalEmail?.split('@')[0] || ''),
            department: department || 'Ministerio de Sanidad y Bienestar Social',
            assigned_center_id: assigned_center_id || null,
            username: sanitizedUsername || null
          }
        });
        if (createErr) {
          console.error('❌ Error creating user:', createErr);
          throw new Error(`Error creating user: ${createErr.message}`);
        }

        const uid = created.user?.id;
        if (uid) {
          // Mirror in public.user_profiles for role-based access
          const profileInsert = await supabaseAdmin.from('user_profiles').insert({
            id: uid,
            email: finalEmail,
            role,
            full_name: full_name || (finalEmail?.split('@')[0] || ''),
            department: department || 'Ministerio de Sanidad y Bienestar Social',
            assigned_center_id: assigned_center_id || null,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          if ((profileInsert as any)?.error) {
            console.warn('⚠️ Could not insert user_profiles row:', (profileInsert as any).error);
          }
        }

        return new Response(
          JSON.stringify({ success: true, user: { id: created.user?.id, email: created.user?.email } }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

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
              department: updates.department,
              assigned_center_id: updates.assigned_center_id ?? null
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
          return new Response(JSON.stringify({ success: false, error: 'Missing userId for user deletion' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Delete user from auth
        try {
          const deleteResult = await supabaseAdmin.auth.admin.deleteUser(userId);
          console.log('🗑️ deleteResult:', deleteResult);
          const deleteError = deleteResult?.error;

          if (deleteError) {
            console.error('❌ Delete error:', deleteError);
            return new Response(JSON.stringify({ success: false, error: deleteError }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          console.log('✅ User deleted successfully');

          return new Response(JSON.stringify({ success: true, message: 'User deleted successfully' }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } catch (err) {
          console.error('❌ Unexpected error deleting user:', err);
          const payload = (err instanceof Error) ? { message: err.message, stack: err.stack } : err;
          return new Response(JSON.stringify({ success: false, error: payload }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('❌ Error in admin-users function:', error);

    const errorPayload = (error instanceof Error)
      ? { message: error.message, stack: error.stack }
      : error;

    return new Response(
      JSON.stringify({
        success: false,
        error: errorPayload
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
