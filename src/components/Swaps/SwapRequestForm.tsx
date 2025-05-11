
import React, { useState } from 'react';
import { Shift, SwapRequest } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/components/ui/sonner';
import { format, parseISO } from 'date-fns';
import { createSwapRequest } from '@/api/swapApi';

interface SwapRequestFormProps {
  shift: Shift;
  onClose: () => void;
  onSuccess?: () => void;
}

const SwapRequestForm: React.FC<SwapRequestFormProps> = ({ shift, onClose, onSuccess }) => {
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to request a shift swap');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create swap request using the API function
      await createSwapRequest({
        shiftId: shift.id,
        note: note || undefined
      });
      
      toast.success('Swap request created successfully!');
      
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (error) {
      console.error('Error submitting swap request:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <>
      <DialogHeader>
        <DialogTitle>Request Shift Swap</DialogTitle>
        <DialogDescription>
          Submit a request to swap your shift on {format(parseISO(shift.date), 'EEEE, MMMM d, yyyy')} from {shift.startTime} to {shift.endTime}.
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4 py-4">
        <div className="space-y-2">
          <label htmlFor="note" className="block text-sm font-medium">
            Note (Optional)
          </label>
          <Textarea
            id="note"
            placeholder="Add any details about your swap request..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="min-h-[100px] w-full"
          />
          <p className="text-sm text-muted-foreground">
            Your request will be visible to all staff members who can volunteer to take your shift.
          </p>
        </div>
        
        <DialogFooter className="pt-4">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-t-2 border-b-2 border-white rounded-full animate-spin"></span>
                <span>Submitting...</span>
              </span>
            ) : (
              'Submit Request'
            )}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
};

export default SwapRequestForm;
