import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SwapRequest } from '@/types';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SwapCard from './SwapCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/components/ui/sonner';
import { parseISO } from 'date-fns';
import { ArrowLeftRight } from 'lucide-react';

// Mock swap requests data
const generateMockSwapRequests = (): SwapRequest[] => {
  const users = [
    { id: '1', name: 'John Manager' },
    { id: '2', name: 'Jane Staff' },
    { id: '3', name: 'Bob Staff' },
  ];
  
  const swapRequests: SwapRequest[] = [];
  
  // Generate different swap requests with different statuses
  const today = new Date();
  
  // Open requests
  for (let i = 0; i < 3; i++) {
    const user = i % 3;
    const date = new Date();
    date.setDate(today.getDate() + (i + 1));
    
    swapRequests.push({
      id: `swap-open-${i}`,
      shiftId: `shift-${i}`,
      requesterId: users[user].id,
      requesterName: users[user].name,
      note: i % 2 === 0 ? "I have a doctor's appointment this day." : undefined,
      date: date.toISOString().split('T')[0],
      startTime: '9:00 AM',
      endTime: '5:00 PM',
      status: 'Open',
      createdAt: new Date(today.getTime() - (i * 24 * 60 * 60 * 1000)).toISOString(),
    });
  }
  
  // Pending requests
  for (let i = 0; i < 2; i++) {
    const user = i % 3;
    const volunteerUser = (i + 1) % 3;
    const date = new Date();
    date.setDate(today.getDate() + (i + 4));
    
    swapRequests.push({
      id: `swap-pending-${i}`,
      shiftId: `shift-${i + 3}`,
      requesterId: users[user].id,
      requesterName: users[user].name,
      note: "Need to attend a family event.",
      date: date.toISOString().split('T')[0],
      startTime: '10:00 AM',
      endTime: '6:00 PM',
      status: 'Pending',
      createdAt: new Date(today.getTime() - ((i + 3) * 24 * 60 * 60 * 1000)).toISOString(),
      volunteerId: users[volunteerUser].id,
      volunteerName: users[volunteerUser].name,
      volunteerShiftId: `shift-v-${i}`,
      volunteerShiftDate: new Date(date.getTime() + (24 * 60 * 60 * 1000)).toISOString().split('T')[0],
      volunteerShiftStartTime: '9:00 AM',
      volunteerShiftEndTime: '5:00 PM',
    });
  }
  
  // Approved requests
  for (let i = 0; i < 2; i++) {
    const user = i % 3;
    const volunteerUser = (i + 1) % 3;
    const date = new Date();
    date.setDate(today.getDate() + (i + 6));
    
    swapRequests.push({
      id: `swap-approved-${i}`,
      shiftId: `shift-${i + 5}`,
      requesterId: users[user].id,
      requesterName: users[user].name,
      date: date.toISOString().split('T')[0],
      startTime: '8:00 AM',
      endTime: '4:00 PM',
      status: 'Approved',
      createdAt: new Date(today.getTime() - ((i + 5) * 24 * 60 * 60 * 1000)).toISOString(),
      volunteerId: users[volunteerUser].id,
      volunteerName: users[volunteerUser].name,
      volunteerShiftId: `shift-v-${i + 2}`,
      volunteerShiftDate: new Date(date.getTime() + (2 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
      volunteerShiftStartTime: '10:00 AM',
      volunteerShiftEndTime: '6:00 PM',
      managerId: users[0].id,
      managerName: users[0].name,
      approvedAt: new Date(today.getTime() - (24 * 60 * 60 * 1000)).toISOString(),
    });
  }
  
  // Rejected requests
  for (let i = 0; i < 1; i++) {
    const user = i % 3;
    const volunteerUser = (i + 1) % 3;
    const date = new Date();
    date.setDate(today.getDate() - (i + 1));
    
    swapRequests.push({
      id: `swap-rejected-${i}`,
      shiftId: `shift-${i + 7}`,
      requesterId: users[user].id,
      requesterName: users[user].name,
      date: date.toISOString().split('T')[0],
      startTime: '11:00 AM',
      endTime: '7:00 PM',
      status: 'Rejected',
      createdAt: new Date(today.getTime() - ((i + 7) * 24 * 60 * 60 * 1000)).toISOString(),
      volunteerId: users[volunteerUser].id,
      volunteerName: users[volunteerUser].name,
      volunteerShiftId: `shift-v-${i + 4}`,
      volunteerShiftDate: new Date(date.getTime() - (24 * 60 * 60 * 1000)).toISOString().split('T')[0],
      volunteerShiftStartTime: '9:00 AM',
      volunteerShiftEndTime: '5:00 PM',
      managerId: users[0].id,
      managerName: users[0].name,
      rejectedAt: new Date(today.getTime() - (2 * 24 * 60 * 60 * 1000)).toISOString(),
      reason: "Insufficient staffing for the requested day.",
    });
  }
  
  // Sort by date
  return swapRequests.sort((a, b) => {
    return parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime();
  });
};

const OpenSwapsList: React.FC = () => {
  const { user } = useAuth();
  const [selectedSwap, setSelectedSwap] = useState<SwapRequest | null>(null);
  const [showVolunteerDialog, setShowVolunteerDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Generate mock swap requests
  const swapRequests = React.useMemo(() => generateMockSwapRequests(), []);
  
  // Filter swap requests based on user's involvement
  const myRequests = swapRequests.filter(swap => swap.requesterId === user?.id);
  const myVolunteers = swapRequests.filter(swap => swap.volunteerId === user?.id);
  const availableSwaps = swapRequests.filter(swap => 
    swap.status === 'Open' && swap.requesterId !== user?.id
  );
  
  const handleVolunteer = (swap: SwapRequest) => {
    setSelectedSwap(swap);
    setShowVolunteerDialog(true);
  };
  
  const confirmVolunteer = async () => {
    if (!selectedSwap || !user) return;
    
    setIsSubmitting(true);
    // Mock API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real app, we'd send this to an API
    console.log(`User ${user.name} volunteered for shift ${selectedSwap.id}`);
    
    toast.success("You've successfully volunteered for this shift! Awaiting manager approval.");
    
    setIsSubmitting(false);
    setShowVolunteerDialog(false);
    setSelectedSwap(null);
  };
  
  return (
    <div>
      <Tabs defaultValue="available" className="w-full">
        <TabsList className="grid grid-cols-3 w-full md:w-[400px]">
          <TabsTrigger value="available">Available Swaps</TabsTrigger>
          <TabsTrigger value="my-requests">My Requests</TabsTrigger>
          <TabsTrigger value="my-volunteers">My Volunteers</TabsTrigger>
        </TabsList>
        
        <TabsContent value="available" className="mt-4">
          {availableSwaps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-3 mb-3">
                <ArrowLeftRight className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-lg">No available swap requests</h3>
              <p className="text-muted-foreground mt-1">
                There are currently no open shift swap requests from colleagues.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
              {availableSwaps.map((swap) => (
                <SwapCard
                  key={swap.id}
                  swap={swap}
                  onVolunteer={() => handleVolunteer(swap)}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="my-requests" className="mt-4">
          {myRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-3 mb-3">
                <ArrowLeftRight className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-lg">No swap requests</h3>
              <p className="text-muted-foreground mt-1">
                You haven't made any shift swap requests yet.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
              {myRequests.map((swap) => (
                <SwapCard
                  key={swap.id}
                  swap={swap}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="my-volunteers" className="mt-4">
          {myVolunteers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-3 mb-3">
                <ArrowLeftRight className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-lg">No volunteer activity</h3>
              <p className="text-muted-foreground mt-1">
                You haven't volunteered for any shift swaps yet.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
              {myVolunteers.map((swap) => (
                <SwapCard
                  key={swap.id}
                  swap={swap}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      <Dialog open={showVolunteerDialog} onOpenChange={setShowVolunteerDialog}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Volunteer for Shift</DialogTitle>
            <DialogDescription>
              Are you sure you want to volunteer for this shift? Once approved by a manager, you will be responsible for working this shift.
            </DialogDescription>
          </DialogHeader>
          
          {selectedSwap && (
            <div className="py-4">
              <div className="rounded-md border p-4 mb-4">
                <div className="font-medium">Shift Details:</div>
                <div className="text-sm mt-1">
                  <p><span className="font-medium">Date:</span> {selectedSwap.date}</p>
                  <p><span className="font-medium">Time:</span> {selectedSwap.startTime} - {selectedSwap.endTime}</p>
                  <p><span className="font-medium">Requested by:</span> {selectedSwap.requesterName}</p>
                  {selectedSwap.note && (
                    <p className="mt-2 italic text-muted-foreground">"{selectedSwap.note}"</p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowVolunteerDialog(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={confirmVolunteer} disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-t-2 border-b-2 border-white rounded-full animate-spin"></span>
                  <span>Confirming...</span>
                </span>
              ) : (
                'Confirm Volunteer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OpenSwapsList;
