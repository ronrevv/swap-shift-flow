
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Get profile data from request
    const { userId, name, email, role } = await req.json();
    
    if (!userId || !name || !email || !role) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: userId, name, email, or role'
      }), { 
        headers: corsHeaders, 
        status: 400 
      });
    }
    
    // Create a Supabase client with the service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return new Response(JSON.stringify({
        error: 'Server configuration error'
      }), { 
        headers: corsHeaders, 
        status: 500 
      });
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false },
      global: { 
        headers: { 
          'X-Client-Info': 'create-profile-function',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        } 
      }
    });
    
    // Check if profile already exists
    const { data: existingProfile, error: checkError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
      
    if (checkError) {
      return new Response(JSON.stringify({
        error: `Error checking for existing profile: ${checkError.message}`
      }), { 
        headers: corsHeaders, 
        status: 500 
      });
    }
    
    if (existingProfile) {
      return new Response(JSON.stringify({
        message: 'Profile already exists',
        profile: existingProfile
      }), { 
        headers: corsHeaders, 
        status: 200 
      });
    }
    
    // Create new profile
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        name: name,
        email: email,
        role: role
      })
      .select()
      .single();
      
    if (error) {
      return new Response(JSON.stringify({
        error: `Error creating profile: ${error.message}`
      }), { 
        headers: corsHeaders, 
        status: 500 
      });
    }
    
    return new Response(JSON.stringify({
      message: 'Profile created successfully',
      profile: data
    }), { 
      headers: corsHeaders, 
      status: 200 
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message || 'Unknown error'
    }), { 
      headers: corsHeaders, 
      status: 500 
    });
  }
});
