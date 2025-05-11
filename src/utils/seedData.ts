
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export const seedDemoData = async () => {
  try {
    console.log("Seeding demo data...");
    toast.loading("Seeding demo data...");
    
    const { data, error } = await supabase.functions.invoke('seed-demo-data');
    
    if (error) {
      console.error('Error seeding demo data:', error);
      toast.error('Failed to seed demo data: ' + (error.message || 'Unknown error'));
      return false;
    }
    
    console.log('Seed result:', data);
    toast.success(data.message || 'Demo data seeded successfully');
    
    if (data.users === 0) {
      toast.info("Users already exist. You can login with manager@shiftswap.com or staff@shiftswap.com with password 'password'");
    } else {
      toast.info("Login with manager@shiftswap.com or staff@shiftswap.com with password 'password'");
    }
    
    return true;
  } catch (error) {
    console.error('Error calling seed function:', error);
    toast.error('Something went wrong while seeding demo data: ' + (error.message || 'Unknown error'));
    return false;
  }
};
