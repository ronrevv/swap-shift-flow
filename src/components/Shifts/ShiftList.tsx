
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Shift } from '@/types';
import { Button } from '@/components/ui/button';
import ShiftCard from './ShiftCard';
import SwapRequestForm from '../Swaps/SwapRequestForm';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { format, parseISO, startOfWeek, addDays, isWithinInterval } from 'date-fns';
import { Calendar } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const ShiftList: React.FC = () => {
  const { user } = useAuth();
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  
  // Fetch shifts from Supabase
  const { data: shifts, isLoading, error, refetch } = useQuery({
    queryKey: ['shifts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('shifts')
        .select(`
          id,
          employee_id,
          date,
          start_time,
          end_time,
          role,
          profiles:employee_id (name)
        `)
        .eq('employee_id', user.id)
        .order('date', { ascending: true });
      
      if (error) {
        console.error('Error fetching shifts:', error);
        toast.error('Failed to load shifts');
        throw error;
      }
      
      return data.map(shift => ({
        id: shift.id,
        employeeId: shift.employee_id,
        employeeName: shift.profiles?.name || user.name,
        date: shift.date,
        startTime: format(parseISO(`1970-01-01T${shift.start_time}`), 'h:mm a'),
        endTime: format(parseISO(`1970-01-01T${shift.end_time}`), 'h:mm a'),
        role: shift.role
      }));
    },
    enabled: !!user
  });
  
  const today = new Date();
  
  const filteredShifts = shifts?.filter(shift => {
    const shiftDate = parseISO(shift.date);
    
    switch (filter) {
      case 'upcoming':
        return shiftDate >= today;
      case 'past':
        return shiftDate < today;
      default:
        return true;
    }
  }) || [];
  
  const handleRequestSwap = (shift: Shift) => {
    setSelectedShift(shift);
  };
  
  const handleSwapRequestSuccess = () => {
    setSelectedShift(null);
    refetch();
    toast.success('Swap request submitted successfully!');
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center p-4 bg-red-50 text-red-500 rounded-md">
        There was an error loading your shifts. Please try again.
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Shifts</h2>
        <div className="flex space-x-2">
          <Button 
            variant={filter === 'all' ? 'default' : 'outline'} 
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button 
            variant={filter === 'upcoming' ? 'default' : 'outline'} 
            onClick={() => setFilter('upcoming')}
          >
            Upcoming
          </Button>
          <Button 
            variant={filter === 'past' ? 'default' : 'outline'} 
            onClick={() => setFilter('past')}
          >
            Past
          </Button>
        </div>
      </div>
      
      {filteredShifts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-3 mb-3">
            <Calendar className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="font-medium text-lg">No shifts found</h3>
          <p className="text-muted-foreground mt-1">
            {filter === 'all' 
              ? "You don't have any shifts scheduled."
              : filter === 'upcoming' 
                ? "You don't have any upcoming shifts."
                : "You don't have any past shifts."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
          {filteredShifts.map((shift) => (
            <ShiftCard
              key={shift.id}
              shift={shift}
              onRequestSwap={handleRequestSwap}
            />
          ))}
        </div>
      )}
      
      <Dialog open={!!selectedShift} onOpenChange={(open) => !open && setSelectedShift(null)}>
        <DialogContent className="sm:max-w-[500px]">
          {selectedShift && (
            <SwapRequestForm 
              shift={selectedShift} 
              onClose={() => setSelectedShift(null)}
              onSuccess={handleSwapRequestSuccess}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShiftList;
