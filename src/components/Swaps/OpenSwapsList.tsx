
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SwapRequest, Shift } from '@/types';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SwapCard from './SwapCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/components/ui/sonner';
import { format, parseISO } from 'date-fns';
import { ArrowLeftRight, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getOpenSwapRequests, getUserSwapHistory, volunteerForSwap } from '@/api/swapApi';
import { getUserShifts } from '@/api/shiftsApi';
import { createLogEntry } from '@/api/logsApi';

const OpenSwapsList: React.FC = () => {
  const { user } = useAuth();
  const [selectedSwap, setSelectedSwap] = useState<SwapRequest | null>(null);
  const [selectedVolunteerShift, setSelectedVolunteerShift] = useState<Shift | null>(null);
  const [showVolunteerDialog, setShowVolunteerDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch open swap requests
  const { data: openSwapRequests, isLoading: isLoadingSwaps, error: swapsError, refetch: refetchSwaps } = useQuery({
    queryKey: ['openSwaps'],
    queryFn: getOpenSwapRequests,
    refetchInterval: 30000 // Refetch every 30 seconds
  });
  
  // Fetch user's swap history
  const { data: swapHistory, isLoading: isLoadingHistory, error: historyError, refetch: refetchHistory } = useQuery({
    queryKey: ['swapHistory', user?.id],
    queryFn: () => getUserSwapHistory(),
    enabled: !!user
  });
  
  // Fetch user's shifts for volunteering
  const { data: userShifts, isLoading: isLoadingShifts } = useQuery({
    queryKey: ['shifts', user?.id],
    queryFn: () => getUserShifts(),
    enabled: !!user
  });
  
  // Filter swap requests based on user's involvement
  const myRequests = swapHistory?.filter(swap => swap.requesterId === user?.id) || [];
  const myVolunteers = swapHistory?.filter(swap => swap.volunteerId === user?.id) || [];
  const availableSwaps = openSwapRequests?.filter(swap => 
    swap.status === 'Open' && swap.requesterId !== user?.id
  ) || [];

  const handleVolunteer = (swap: SwapRequest) => {
    setSelectedSwap(swap);
    setSelectedVolunteerShift(null);
    setShowVolunteerDialog(true);
  };
  
  const selectVolunteerShift = (shift: Shift) => {
    setSelectedVolunteerShift(shift);
  };
  
  const confirmVolunteer = async () => {
    if (!selectedSwap || !selectedVolunteerShift || !user) {
      toast.error("Please select a shift to volunteer with");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await volunteerForSwap(selectedSwap.id, selectedVolunteerShift.id);
      
      // Log volunteering action
      await createLogEntry({
        entityType: 'swap_request',
        entityId: selectedSwap.id,
        action: 'volunteered',
        details: {
          swapId: selectedSwap.id,
          volunteerId: user.id,
          volunteerName: user.name,
          volunteerShiftId: selectedVolunteerShift.id
        }
      });
      
      toast.success("You've successfully volunteered for this shift! Awaiting manager approval.");
      
      // Refetch data
      refetchSwaps();
      refetchHistory();
    } catch (error) {
      console.error('Error volunteering for swap:', error);
      toast.error("There was a problem volunteering for this shift. Please try again.");
    } finally {
      setIsSubmitting(false);
      setShowVolunteerDialog(false);
      setSelectedSwap(null);
      setSelectedVolunteerShift(null);
    }
  };
  
  const isLoading = isLoadingSwaps || isLoadingHistory;
  const error = swapsError || historyError;
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading swap requests...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-500 rounded-md">
        <p>There was an error loading the swap requests. Please try again.</p>
        <p className="text-sm text-red-400">{String(error)}</p>
      </div>
    );
  }
  
  // Debug information
  console.log("Open Swaps:", openSwapRequests);
  console.log("Swap History:", swapHistory);
  console.log("My Requests:", myRequests);
  console.log("My Volunteers:", myVolunteers);
  console.log("Available Swaps:", availableSwaps);
  
  return (
    <div>
      <Tabs defaultValue="available" className="w-full">
        <TabsList className="grid grid-cols-3 w-full md:w-[400px]">
          <TabsTrigger value="available">Available ({availableSwaps.length})</TabsTrigger>
          <TabsTrigger value="my-requests">My Requests ({myRequests.length})</TabsTrigger>
          <TabsTrigger value="my-volunteers">My Volunteers ({myVolunteers.length})</TabsTrigger>
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
                  refetch={refetchSwaps}
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
                  refetch={refetchHistory}
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
                  refetch={refetchHistory}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      <Dialog open={showVolunteerDialog} onOpenChange={setShowVolunteerDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Volunteer for Shift</DialogTitle>
            <DialogDescription>
              Select one of your shifts to swap with the requested shift. Once approved by a manager, you will be responsible for working this shift.
            </DialogDescription>
          </DialogHeader>
          
          {selectedSwap && (
            <div className="py-4">
              <div className="rounded-md border p-4 mb-4">
                <div className="font-medium">Requested Shift:</div>
                <div className="text-sm mt-1">
                  <p><span className="font-medium">Date:</span> {selectedSwap.date}</p>
                  <p><span className="font-medium">Time:</span> {selectedSwap.startTime} - {selectedSwap.endTime}</p>
                  <p><span className="font-medium">Requested by:</span> {selectedSwap.requesterName}</p>
                  {selectedSwap.note && (
                    <p className="mt-2 italic text-muted-foreground">"{selectedSwap.note}"</p>
                  )}
                </div>
              </div>
              
              <div className="mt-4">
                <div className="font-medium mb-2">Select Your Shift to Offer:</div>
                {isLoadingShifts ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span>Loading your shifts...</span>
                  </div>
                ) : userShifts && userShifts.length > 0 ? (
                  <div className="grid gap-2 max-h-[300px] overflow-y-auto p-1">
                    {userShifts.map(shift => (
                      <div 
                        key={shift.id} 
                        className={`rounded border p-3 cursor-pointer transition-colors ${
                          selectedVolunteerShift?.id === shift.id 
                            ? 'bg-primary/10 border-primary' 
                            : 'hover:bg-accent'
                        }`}
                        onClick={() => selectVolunteerShift(shift)}
                      >
                        <p className="font-medium">{format(parseISO(shift.date), 'EEE, MMM d, yyyy')}</p>
                        <p className="text-sm text-muted-foreground">{shift.startTime} - {shift.endTime}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    You don't have any shifts available to volunteer.
                  </div>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowVolunteerDialog(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              onClick={confirmVolunteer} 
              disabled={isSubmitting || !selectedVolunteerShift}
              variant="default"
            >
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
