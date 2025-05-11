
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/contexts/AuthContext';
import { volunteerForSwap } from '@/api/swapApi';
import { supabase } from '@/integrations/supabase/client';

interface VolunteerButtonProps {
  swapId: string;
  onSuccess?: () => void;
}

const VolunteerButton: React.FC<VolunteerButtonProps> = ({ swapId, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  
  const handleVolunteer = async () => {
    if (!user) {
      toast.error('You must be logged in to volunteer for a shift');
      return;
    }
    
    // Prevent managers from volunteering for shifts
    if (user.role === 'Manager') {
      toast.error('Managers cannot volunteer for shift swaps');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Find the most suitable shift for volunteering (the next upcoming shift)
      const { data: myShifts, error: shiftsError } = await supabase
        .from('shifts')
        .select('id')
        .eq('employee_id', user.id)
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true })
        .limit(1);
        
      if (shiftsError) {
        console.error('Error fetching shifts:', shiftsError);
        toast.error('Failed to check your available shifts');
        return;
      }
      
      if (!myShifts || myShifts.length === 0) {
        toast.error('You have no available shifts to volunteer with');
        setIsLoading(false);
        return;
      }
      
      const volunteerShiftId = myShifts[0].id;
      
      // Use the API function to volunteer
      await volunteerForSwap(swapId, volunteerShiftId);
      
      toast.success("You've volunteered for this shift! Awaiting manager approval.");
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error(`Error volunteering for swap:`, error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Button 
      variant="outline" 
      className="w-full text-swap hover:bg-swap hover:text-white"
      onClick={handleVolunteer}
      disabled={isLoading || user?.role === 'Manager'}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 border-t-2 border-b-2 border-current rounded-full animate-spin"></span>
          <span>Processing...</span>
        </span>
      ) : user?.role === 'Manager' ? (
        'Managers Cannot Volunteer'
      ) : (
        'Volunteer for Shift'
      )}
    </Button>
  );
};

export default VolunteerButton;
