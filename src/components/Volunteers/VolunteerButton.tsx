
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';

interface VolunteerButtonProps {
  swapId: string;
  onSuccess?: () => void;
}

const VolunteerButton: React.FC<VolunteerButtonProps> = ({ swapId, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleVolunteer = async () => {
    setIsLoading(true);
    
    // Mock API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log(`Volunteered for swap request ${swapId}`);
    toast.success("You've volunteered for this shift! Awaiting manager approval.");
    
    setIsLoading(false);
    if (onSuccess) onSuccess();
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
