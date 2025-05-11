
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export const seedDemoData = async () => {
  try {
    console.log("Seeding demo data...");
    toast.loading("Seeding demo data...");
    
    // Add detailed error handling for the edge function call
    try {
      const { data, error } = await supabase.functions.invoke('seed-demo-data');
      
      if (error) {
        console.error('Error seeding demo data:', error);
        toast.error('Failed to seed demo data: ' + (error.message || 'Unknown error'));
        return false;
      }
      
      console.log('Seed result:', data);
      toast.success(data.message || 'Demo data seeded successfully');
      
      if (data.users === 0) {
        toast.info("No new users created. You can login with manager@shiftswap.com or staff@shiftswap.com with password 'password'");
      } else {
        toast.info("Login with manager@shiftswap.com or staff@shiftswap.com with password 'password'");
      }
      
      return true;
    } catch (invokeError) {
      console.error('Error calling seed function:', invokeError);
      
      // More helpful error message with detailed information
      let errorMessage = 'Unable to contact the seed function. ';
      
      if (invokeError.message && invokeError.message.includes('non-2xx status code')) {
        errorMessage += 'The server returned an error. Please try again or check the console for details.';
      } else {
        errorMessage += invokeError.message || 'Unknown error';
      }
      
      toast.error(errorMessage);
      return false;
    }
  } catch (error) {
    console.error('Unexpected error during seed process:', error);
    toast.error('Something went wrong while seeding demo data: ' + (error.message || 'Unknown error'));
    return false;
  }
};
