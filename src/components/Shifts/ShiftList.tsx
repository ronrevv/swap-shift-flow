
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Shift } from '@/types';
import { Button } from '@/components/ui/button';
import ShiftCard from './ShiftCard';
import SwapRequestForm from '../Swaps/SwapRequestForm';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { parseISO, format, startOfWeek, addDays, isWithinInterval } from 'date-fns';

// Mock shift data
const generateMockShifts = (userId: string): Shift[] => {
  const shifts: Shift[] = [];
  const today = new Date();
  const startDay = startOfWeek(today);
  
  // Names for different roles
  const roles = ['Cashier', 'Stocker', 'Customer Service', 'Manager', 'Warehouse'];
  
  // Generate shifts for the next 2 weeks
  for (let i = 0; i < 14; i++) {
    // Skip some days randomly to make it more realistic
    if (Math.random() > 0.6) continue;
    
    const shiftDate = addDays(startDay, i);
    const shiftDateStr = format(shiftDate, 'yyyy-MM-dd');
    
    const startHour = 8 + Math.floor(Math.random() * 4); // Start between 8 AM and 11 AM
    const startTime = `${startHour}:00 AM`;
    const endHour = startHour + 8; // 8-hour shifts
    const endTime = endHour > 12 ? `${endHour - 12}:00 PM` : `${endHour}:00 AM`;
    
    const role = roles[Math.floor(Math.random() * roles.length)];
    
    shifts.push({
      id: `shift-${i}`,
      employeeId: userId,
      employeeName: '', // Will be filled in later
      date: shiftDateStr,
      startTime,
      endTime,
      role
    });
  }
  
  return shifts.sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
};

const ShiftList: React.FC = () => {
  const { user } = useAuth();
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  
  // Generate mock shifts for the logged-in user
  const shifts = React.useMemo(() => {
    if (!user) return [];
    const generatedShifts = generateMockShifts(user.id);
    return generatedShifts.map(shift => ({
      ...shift,
      employeeName: user.name
    }));
  }, [user]);
  
  const today = new Date();
  
  const filteredShifts = shifts.filter(shift => {
    const shiftDate = parseISO(shift.date);
    
    switch (filter) {
      case 'upcoming':
        return shiftDate >= today;
      case 'past':
        return shiftDate < today;
      default:
        return true;
    }
  });
  
  const handleRequestSwap = (shift: Shift) => {
    setSelectedShift(shift);
  };
  
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
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShiftList;
