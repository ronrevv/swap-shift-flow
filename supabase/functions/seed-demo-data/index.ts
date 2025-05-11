
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { format, addDays } from 'https://esm.sh/date-fns@3.6.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ShiftData {
  employee_id: string;
  date: string;
  start_time: string;
  end_time: string;
  role: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Create a Supabase client with the service role key for admin privileges
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { 
        auth: { persistSession: false },
        global: { headers: { 'X-Client-Info': 'seed-demo-data' } }
      }
    );
    
    // Check for existing users first
    const { data: existingUsers, error: existingUsersError } = await supabaseAdmin
      .from('profiles')
      .select('id, email');
      
    if (existingUsersError) {
      console.error("Error checking existing users:", existingUsersError);
    }
      
    if (existingUsers && existingUsers.length > 0) {
      console.log("Found existing users:", existingUsers.length);
      return new Response(JSON.stringify({
        message: 'Demo data already exists',
        users: existingUsers.length
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      });
    }

    console.log("No existing users found. Creating demo data...");

    // Create demo users
    const demoUsers = [
      {
        email: 'manager@shiftswap.com',
        password: 'password',
        name: 'John Manager',
        role: 'Manager'
      },
      {
        email: 'staff@shiftswap.com',
        password: 'password',
        name: 'Jane Staff',
        role: 'Staff'
      },
      {
        email: 'bob@shiftswap.com',
        password: 'password',
        name: 'Bob Staff',
        role: 'Staff'
      }
    ];

    const userIds = {};
    
    // Create users
    for (const user of demoUsers) {
      try {
        // Create the auth user first
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: {
            name: user.name
          }
        });
        
        if (authError) {
          console.error(`Error creating user ${user.email}:`, authError);
          continue;
        }
        
        userIds[user.email] = authUser.user.id;
        
        // Create profile manually with service role client to bypass RLS
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: authUser.user.id,
            name: user.name,
            email: user.email,
            role: user.role
          });
          
        if (profileError) {
          console.error(`Error creating profile for ${user.email}:`, profileError);
        } else {
          console.log(`Created profile for ${user.name} with role ${user.role}`);
        }
      } catch (err) {
        console.error(`Error in user creation process for ${user.email}:`, err);
      }
    }
    
    // Create shifts for each user
    if (Object.keys(userIds).length > 0) {
      const today = new Date();
      const roles = ['Cashier', 'Stocker', 'Customer Service', 'Manager', 'Warehouse'];
      
      for (const email in userIds) {
        const userId = userIds[email];
        const shifts: ShiftData[] = [];
        
        // Generate shifts for the next 2 weeks
        for (let i = 0; i < 14; i++) {
          // Skip some days randomly to make it more realistic
          if (Math.random() > 0.7) continue;
          
          const shiftDate = addDays(today, i);
          const shiftDateStr = format(shiftDate, 'yyyy-MM-dd');
          
          const startHour = 8 + Math.floor(Math.random() * 4); // Start between 8 AM and 11 AM
          const startTime = `${startHour.toString().padStart(2, '0')}:00:00`;
          const endHour = startHour + 8; // 8-hour shifts
          const endTime = `${endHour.toString().padStart(2, '0')}:00:00`;
          
          const role = roles[Math.floor(Math.random() * roles.length)];
          
          shifts.push({
            employee_id: userId,
            date: shiftDateStr,
            start_time: startTime,
            end_time: endTime,
            role
          });
        }
        
        // Insert shifts using admin client to bypass RLS
        if (shifts.length > 0) {
          const { error: shiftsError } = await supabaseAdmin
            .from('shifts')
            .insert(shifts);
            
          if (shiftsError) {
            console.error(`Error creating shifts for ${email}:`, shiftsError);
          } else {
            console.log(`Created ${shifts.length} shifts for ${email}`);
          }
        }
      }

      // Create some swap requests
      const managerUser = userIds['manager@shiftswap.com'];
      const staffUser1 = userIds['staff@shiftswap.com'];
      const staffUser2 = userIds['bob@shiftswap.com'];
      
      // Get first shift for each staff member
      const { data: staffShifts, error: shiftError } = await supabaseAdmin
        .from('shifts')
        .select('*')
        .eq('employee_id', staffUser1)
        .order('date', { ascending: true })
        .limit(2);
        
      if (shiftError) {
        console.error("Error fetching staff shifts:", shiftError);
      }
        
      if (staffShifts && staffShifts.length > 0) {
        // Create open swap request
        const { error: openSwapError } = await supabaseAdmin
          .from('swap_requests')
          .insert({
            shift_id: staffShifts[0].id,
            requester_id: staffUser1,
            status: 'Open',
            note: 'I have a doctor appointment this day, can anyone take my shift?',
          });
          
        if (openSwapError) {
          console.error('Error creating open swap request:', openSwapError);
        } else {
          console.log('Created open swap request');
        }
        
        // Create pending swap request
        if (staffShifts.length > 1) {
          const { error: pendingSwapError } = await supabaseAdmin
            .from('swap_requests')
            .insert({
              shift_id: staffShifts[1].id,
              requester_id: staffUser1,
              status: 'Pending',
              volunteer_id: staffUser2,
              note: 'Family emergency, need this day off',
            });
            
          if (pendingSwapError) {
            console.error('Error creating pending swap request:', pendingSwapError);
          } else {
            console.log('Created pending swap request');
          }
        }
      }

      return new Response(JSON.stringify({
        message: 'Demo data seeded successfully',
        users: Object.keys(userIds).length
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      });
    } else {
      return new Response(JSON.stringify({
        message: 'No users created',
        users: 0
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }
    
  } catch (error) {
    console.error('Error seeding demo data:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
