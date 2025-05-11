
import React, { useState } from 'react';
import { Shift, SwapRequest } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/components/ui/sonner';
import { format, parseISO } from 'date-fns';
import { createSwapRequest } from '@/api/swapApi';
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';

interface SwapRequestFormProps {
  shift: Shift;
  onClose: () => void;
  onSuccess?: () => void;
}

interface SwapFormValues {
  note: string;
  preferredVolunteerName: string;
  preferredTime: string;
}

const SwapRequestForm: React.FC<SwapRequestFormProps> = ({ shift, onClose, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  
  const form = useForm<SwapFormValues>({
    defaultValues: {
      note: '',
      preferredVolunteerName: '',
      preferredTime: ''
    }
  });
  
  const handleSubmit = async (values: SwapFormValues) => {
    if (!user) {
      toast.error('You must be logged in to request a shift swap');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create swap request using the API function with additional fields
      await createSwapRequest({
        shiftId: shift.id,
        note: values.note || undefined,
        preferredVolunteerName: values.preferredVolunteerName || undefined,
        preferredTime: values.preferredTime || undefined
      });
      
      toast.success('Swap request created successfully! Manager will review your request.');
      
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
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
          <FormField
            control={form.control}
            name="preferredVolunteerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preferred Volunteer (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Enter name if you have a preference" {...field} />
                </FormControl>
                <FormDescription>
                  Leave blank if any volunteer is acceptable
                </FormDescription>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="preferredTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preferred Time (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Afternoon or specific time range" {...field} />
                </FormControl>
                <FormDescription>
                  Enter a preferred time if you're looking for a specific time range
                </FormDescription>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="note"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Details (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Add any details about your swap request..."
                    className="min-h-[100px] w-full"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Your request will be reviewed by a manager before being available to other staff
                </FormDescription>
              </FormItem>
            )}
          />
          
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
      </Form>
    </>
  );
};

export default SwapRequestForm;
