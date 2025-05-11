
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { format, addDays } from 'https://esm.sh/date-fns@3.6.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
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
    console.log("Starting seed-demo-data function");
    
    // Create a Supabase client with the service role key for admin privileges
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables");
      return new Response(JSON.stringify({
        error: 'Server configuration error: Missing required environment variables'
      }), { 
        headers: corsHeaders,
        status: 500 
      });
    }
    
    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceRoleKey,
      { 
        auth: { persistSession: false },
        global: { 
          headers: { 
            'X-Client-Info': 'seed-demo-data',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          } 
        }
      }
    );
    
    console.log("Checking for existing users");
    
    // Check for existing users first
    const { data: existingUsers, error: existingUsersError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, role, name')
      .limit(10);
      
    if (existingUsersError) {
      console.error("Error checking existing users:", existingUsersError);
      return new Response(JSON.stringify({
        error: `Error checking existing users: ${existingUsersError.message}`
      }), { 
        headers: corsHeaders,
        status: 500 
      });
    }
    
    const demoUserEmails = ['manager@shiftswap.com', 'staff@shiftswap.com', 'bob@shiftswap.com'];
    const existingDemoUsers = existingUsers?.filter(u => 
      demoUserEmails.includes(u.email?.toLowerCase() || '')
    ) || [];
      
    if (existingDemoUsers && existingDemoUsers.length > 0) {
      console.log("Found existing users:", existingDemoUsers.length);
      return new Response(JSON.stringify({
        message: 'Demo users already exist',
        users: existingDemoUsers.length,
        existingUsers: existingDemoUsers
      }), { 
        headers: corsHeaders,
        status: 200 
      });
    }

    console.log("No existing demo users found. Creating demo data...");

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
    const createdProfiles = [];
    
    // Create users
    for (const user of demoUsers) {
      try {
        console.log(`Creating user ${user.email}`);
        
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
          // Don't stop the whole process for one user error
          continue;
        }
        
        if (!authUser || !authUser.user || !authUser.user.id) {
          console.error(`Failed to create user ${user.email}: No user ID returned`);
          continue;
        }
        
        userIds[user.email] = authUser.user.id;
        console.log(`Created auth user for ${user.email} with ID ${authUser.user.id}`);
        
        // Create profile manually with service role client to bypass RLS
        const { data: profile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: authUser.user.id,
            name: user.name,
            email: user.email,
            role: user.role
          })
          .select()
          .single();
          
        if (profileError) {
          console.error(`Error creating profile for ${user.email}:`, profileError);
        } else {
          console.log(`Created profile for ${user.name} with role ${user.role}`);
          createdProfiles.push(profile);
        }
      } catch (err) {
        console.error(`Error in user creation process for ${user.email}:`, err);
      }
    }
    
    // Create shifts for each user
    if (Object.keys(userIds).length > 0) {
      const today = new Date();
      const roles = ['Cashier', 'Stocker', 'Customer Service', 'Manager', 'Warehouse'];
      const createdShifts = [];
      
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
          console.log(`Creating ${shifts.length} shifts for ${email}`);
          const { data: shiftData, error: shiftsError } = await supabaseAdmin
            .from('shifts')
            .insert(shifts)
            .select();
            
          if (shiftsError) {
            console.error(`Error creating shifts for ${email}:`, shiftsError);
          } else {
            console.log(`Created ${shifts.length} shifts for ${email}`);
            createdShifts.push(...shiftData);
          }
        }
      }

      // Create some swap requests
      const managerUser = userIds['manager@shiftswap.com'];
      const staffUser1 = userIds['staff@shiftswap.com'];
      const staffUser2 = userIds['bob@shiftswap.com'];
      const createdSwapRequests = [];
      
      // Get first shift for each staff member
      if (staffUser1) {
        console.log("Creating swap requests");
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
          const { data: openSwapRequest, error: openSwapError } = await supabaseAdmin
            .from('swap_requests')
            .insert({
              shift_id: staffShifts[0].id,
              requester_id: staffUser1,
              status: 'Open',
              note: 'I have a doctor appointment this day, can anyone take my shift?',
            })
            .select();
            
          if (openSwapError) {
            console.error('Error creating open swap request:', openSwapError);
          } else {
            console.log('Created open swap request');
            createdSwapRequests.push(...openSwapRequest);
          }
          
          // Create pending swap request if we have enough shifts and staffUser2 exists
          if (staffShifts.length > 1 && staffUser2) {
            const { data: pendingSwapRequest, error: pendingSwapError } = await supabaseAdmin
              .from('swap_requests')
              .insert({
                shift_id: staffShifts[1].id,
                requester_id: staffUser1,
                status: 'Pending',
                volunteer_id: staffUser2,
                note: 'Family emergency, need this day off',
              })
              .select();
              
            if (pendingSwapError) {
              console.error('Error creating pending swap request:', pendingSwapError);
            } else {
              console.log('Created pending swap request');
              createdSwapRequests.push(...pendingSwapRequest);
            }
          }
        }
      }

      console.log("Seed data creation complete");
      return new Response(JSON.stringify({
        message: 'Demo data seeded successfully',
        users: createdProfiles.length,
        profiles: createdProfiles,
        shifts: createdShifts.length,
        swapRequests: createdSwapRequests.length
      }), { 
        headers: corsHeaders,
        status: 200 
      });
    } else {
      console.log("No users were created");
      return new Response(JSON.stringify({
        message: 'No users created',
        users: 0
      }), { 
        headers: corsHeaders,
        status: 200 // Changed from 400 to 200 to prevent client errors
      });
    }
    
  } catch (error) {
    console.error('Error seeding demo data:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Unknown error occurred',
      details: error.toString()
    }), {
      headers: corsHeaders,
      status: 500
    });
  }
});
