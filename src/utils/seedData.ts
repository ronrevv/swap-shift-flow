
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export const seedDemoData = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('seed-demo-data');
    
    if (error) {
      console.error('Error seeding demo data:', error);
      toast.error('Failed to seed demo data');
      return false;
    }
    
    console.log('Seed result:', data);
    toast.success(data.message);
    return true;
  } catch (error) {
    console.error('Error calling seed function:', error);
    toast.error('Something went wrong while seeding demo data');
    return false;
  }
};
