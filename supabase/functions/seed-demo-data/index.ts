
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

Deno.serve(async (req) => {
  console.log("Starting seed-demo-data function");
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('Missing environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { headers: corsHeaders, status: 500 }
      );
    }
    
    // Initialize Supabase client with admin privileges
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false },
      global: {
        headers: {
          'X-Client-Info': 'seed-demo-data-function',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    });
    
    // Check for existing users
    console.log("Checking for existing users");
    const { data: existingUsers, error: userError } = await supabase
      .from('profiles')
      .select('email')
      .in('email', ['manager@shiftswap.com', 'staff@shiftswap.com']);
    
    if (userError) {
      console.error('Error checking existing users:', userError);
      return new Response(
        JSON.stringify({ error: `Error checking users: ${userError.message}` }),
        { headers: corsHeaders, status: 500 }
      );
    }
    
    console.log(`Found existing users: ${existingUsers?.length || 0}`);
    
    // Create demo users if they don't exist
    let usersCreated = 0;
    
    // Demo users data
    const demoUsers = [
      { email: 'manager@shiftswap.com', name: 'Manager User', role: 'Manager', password: 'password' },
      { email: 'staff@shiftswap.com', name: 'Staff User', role: 'Staff', password: 'password' }
    ];
    
    // Filter out existing users
    const existingEmails = (existingUsers || []).map(user => user.email);
    const usersToCreate = demoUsers.filter(user => !existingEmails.includes(user.email));
    
    // Create users and profiles
    for (const user of usersToCreate) {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: { name: user.name }
      });
      
      if (authError) {
        console.error(`Error creating user ${user.email}:`, authError);
        continue;
      }
      
      // Create profile record
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            name: user.name,
            email: user.email,
            role: user.role
          });
        
        if (profileError) {
          console.error(`Error creating profile for ${user.email}:`, profileError);
        } else {
          usersCreated++;
          console.log(`Created user and profile for ${user.email}`);
        }
      }
    }
    
    // Create demo shifts if users exist
    const { data: managerProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', 'manager@shiftswap.com')
      .maybeSingle();
      
    const { data: staffProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', 'staff@shiftswap.com')
      .maybeSingle();
    
    // Create shifts for the staff user
    if (staffProfile) {
      // Check if shifts already exist
      const { data: existingShifts } = await supabase
        .from('shifts')
        .select('id')
        .eq('employee_id', staffProfile.id)
        .limit(1);
        
      if (!existingShifts || existingShifts.length === 0) {
        // Create demo shifts for the next 7 days
        const today = new Date();
        const shifts = [];
        
        for (let i = 0; i < 7; i++) {
          const shiftDate = new Date(today);
          shiftDate.setDate(today.getDate() + i);
          const dateString = shiftDate.toISOString().split('T')[0];
          
          shifts.push({
            employee_id: staffProfile.id,
            date: dateString,
            start_time: '09:00:00',
            end_time: '17:00:00',
            role: 'Cashier'
          });
        }
        
        const { error: shiftsError } = await supabase
          .from('shifts')
          .insert(shifts);
          
        if (shiftsError) {
          console.error('Error creating shifts:', shiftsError);
        } else {
          console.log(`Created ${shifts.length} shifts for staff user`);
        }
      }
    }
    
    // Create a demo swap request if none exist
    if (staffProfile) {
      const { data: existingRequests } = await supabase
        .from('swap_requests')
        .select('id')
        .eq('requester_id', staffProfile.id)
        .limit(1);
        
      if (!existingRequests || existingRequests.length === 0) {
        // Get a shift to swap
        const { data: staffShift } = await supabase
          .from('shifts')
          .select('id, date')
          .eq('employee_id', staffProfile.id)
          .order('date', { ascending: true })
          .limit(1)
          .maybeSingle();
          
        if (staffShift) {
          const { error: swapError } = await supabase
            .from('swap_requests')
            .insert({
              requester_id: staffProfile.id,
              shift_id: staffShift.id,
              note: 'Demo swap request for testing',
              status: 'Open'
            });
            
          if (swapError) {
            console.error('Error creating swap request:', swapError);
          } else {
            console.log('Created demo swap request');
          }
        }
      }
    }
    
    // Create a demo activity log
    const { error: logError } = await supabase
      .rpc('log_activity', {
        entity_type: 'system',
        entity_id: '00000000-0000-0000-0000-000000000000',
        action: 'seed_data',
        details: { message: 'Demo data seeded', timestamp: new Date().toISOString() }
      });
      
    if (logError) {
      console.error('Error creating activity log:', logError);
    }
    
    return new Response(
      JSON.stringify({
        message: usersCreated > 0 ? 'Demo data seeded successfully' : 'No users created',
        users: usersCreated
      }),
      { headers: corsHeaders, status: 200 }
    );
    
  } catch (error) {
    console.error('Error in seed function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error during seeding process' }),
      { headers: corsHeaders, status: 500 }
    );
  }
});
