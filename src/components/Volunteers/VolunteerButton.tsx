
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
      
      const volunteerShiftId = myShifts?.[0]?.id;
      
      // Update swap request with volunteer information
      const { error: updateError } = await supabase
        .from('swap_requests')
        .update({ 
          volunteer_id: user.id,
          volunteer_shift_id: volunteerShiftId,
          status: 'Pending' 
        })
        .eq('id', swapId);
        
      if (updateError) {
        console.error('Error updating swap request:', updateError);
        toast.error('Failed to volunteer for this shift');
        return;
      }
      
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
      disabled={isLoading}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 border-t-2 border-b-2 border-current rounded-full animate-spin"></span>
          <span>Processing...</span>
        </span>
      ) : (
        'Volunteer for Shift'
      )}
    </Button>
  );
};

export default VolunteerButton;
