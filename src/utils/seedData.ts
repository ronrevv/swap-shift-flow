
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export const seedDemoData = async () => {
  try {
    console.log("Seeding demo data...");
    toast.loading("Seeding demo data...");
    
    // Add proper Accept and Content-Type headers to avoid 406 Not Acceptable errors
    const { data, error } = await supabase.functions.invoke('seed-demo-data', {
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      }
    });
    
    if (error) {
      console.error('Error seeding demo data:', error);
      toast.error('Failed to seed demo data: ' + (error.message || 'Unknown error'));
      return false;
    }
    
    console.log('Seed result:', data);
    
    if (data && data.error) {
      toast.error(`Seeding error: ${data.error}`);
      return false;
    }
    
    toast.success(data.message || 'Demo data seeded successfully');
    
    if (data.users === 0) {
      toast.info("No new users created. You can login with manager@shiftswap.com or staff@shiftswap.com with password 'password'");
    } else {
      toast.info("Login with manager@shiftswap.com or staff@shiftswap.com with password 'password'");
    }
    
    return true;
  } catch (error) {
    console.error('Unexpected error during seed process:', error);
    toast.error('Something went wrong while seeding demo data: ' + (error.message || 'Unknown error'));
    return false;
  }
};
