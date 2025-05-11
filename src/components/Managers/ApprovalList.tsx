
import React, { useState, useEffect } from 'react';
import { SwapRequest } from '@/types';
import { Button } from '@/components/ui/button';
import SwapCard from '../Swaps/SwapCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeftRight, Loader2, RefreshCcw, User, Clock } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getPendingSwapRequests, approveSwapRequest, rejectSwapRequest, getAllSwapRequests } from '@/api/swapApi';
import { createLogEntry } from '@/api/logsApi';
import { useAuth } from '@/contexts/AuthContext';

const ApprovalList: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedSwap, setSelectedSwap] = useState<SwapRequest | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Fetch pending swap requests
  const { data: pendingSwaps, isLoading: pendingLoading, error: pendingError, refetch: refetchPending } = useQuery({
    queryKey: ['pendingSwaps'],
    queryFn: getPendingSwapRequests,
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchOnWindowFocus: true // Refetch when window regains focus
  });
  
  // Fetch completed swaps (approved or rejected)
  const { data: allSwaps, isLoading: allLoading, error: allError, refetch: refetchAll } = useQuery({
    queryKey: ['allSwaps'],
    queryFn: getAllSwapRequests,
    refetchInterval: 60000, // Refetch every minute
    refetchOnWindowFocus: true
  });
  
  // Filter completed swaps (approved or rejected)
  const completedSwaps = allSwaps?.filter(swap => 
    swap.status === 'Approved' || swap.status === 'Rejected'
  ) || [];
  
  // Debug information
  useEffect(() => {
    console.log("Pending swaps:", pendingSwaps);
    console.log("All swaps:", allSwaps);
    console.log("Completed swaps:", completedSwaps);
  }, [pendingSwaps, allSwaps, completedSwaps]);
  
  const handleRefreshData = () => {
    refetchPending();
    refetchAll();
    toast.success("Data refreshed");
  };
  
  const handleApprove = (swap: SwapRequest) => {
    setSelectedSwap(swap);
    setShowApprovalDialog(true);
  };
  
  const handleReject = (swap: SwapRequest) => {
    setSelectedSwap(swap);
    setShowRejectionDialog(true);
  };
  
  const confirmApprove = async () => {
    if (!selectedSwap || !user) return;
    
    setIsProcessing(true);
    
    try {
      await approveSwapRequest(selectedSwap.id);
      
      // Log the approval
      await createLogEntry({
        entityType: 'swap_request',
        entityId: selectedSwap.id,
        action: 'approved',
        details: {
          swapId: selectedSwap.id,
          requester: selectedSwap.requesterName,
          volunteer: selectedSwap.volunteerName,
          managerId: user.id,
          managerName: user.name
        }
      });
      
      toast.success('Shift swap approved successfully!');
      
      // Invalidate and refetch data
      queryClient.invalidateQueries({ queryKey: ['pendingSwaps'] });
      queryClient.invalidateQueries({ queryKey: ['allSwaps'] });
      refetchPending();
      refetchAll();
    } catch (error) {
      console.error('Error approving swap request:', error);
      toast.error('Failed to approve swap request. Please try again.');
    } finally {
      setShowApprovalDialog(false);
      setSelectedSwap(null);
      setIsProcessing(false);
    }
  };
  
  const confirmReject = async () => {
    if (!selectedSwap || !user) return;
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      await rejectSwapRequest(selectedSwap.id, rejectionReason);
      
      // Log the rejection
      await createLogEntry({
        entityType: 'swap_request',
        entityId: selectedSwap.id,
        action: 'rejected',
        details: {
          swapId: selectedSwap.id,
          reason: rejectionReason,
          requester: selectedSwap.requesterName,
          volunteer: selectedSwap.volunteerName,
          managerId: user.id,
          managerName: user.name
        }
      });
      
      toast.success('Shift swap rejected with reason.');
      
      // Invalidate and refetch data
      queryClient.invalidateQueries({ queryKey: ['pendingSwaps'] });
      queryClient.invalidateQueries({ queryKey: ['allSwaps'] });
      refetchPending();
      refetchAll();
    } catch (error) {
      console.error('Error rejecting swap request:', error);
      toast.error('Failed to reject swap request. Please try again.');
    } finally {
      setShowRejectionDialog(false);
      setSelectedSwap(null);
      setRejectionReason('');
      setIsProcessing(false);
    }
  };
  
  const isLoading = pendingLoading || allLoading;
  const error = pendingError || allError;
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading approval requests...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-500 rounded-md">
        <p>There was an error loading the approval requests. Please try again.</p>
        <p className="text-sm text-red-400">{String(error)}</p>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Shift Swap Approvals</h2>
        <Button variant="outline" onClick={handleRefreshData} className="gap-2">
          <RefreshCcw className="h-4 w-4" />
          <span>Refresh Data</span>
        </Button>
      </div>
      
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid grid-cols-2 w-full md:w-[300px]">
          <TabsTrigger value="pending">Pending ({pendingSwaps?.length || 0})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedSwaps?.length || 0})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending" className="mt-4">
          {!pendingSwaps || pendingSwaps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-3 mb-3">
                <ArrowLeftRight className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-lg">No pending approvals</h3>
              <p className="text-muted-foreground mt-1">
                There are no shift swap requests awaiting your approval.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
              {pendingSwaps.map((swap) => (
                <SwapCard
                  key={swap.id}
                  swap={swap}
                  onApprove={() => handleApprove(swap)}
                  onReject={() => handleReject(swap)}
                  isManagerView={true}
                  refetch={() => {
                    refetchPending();
                    refetchAll();
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="completed" className="mt-4">
          {completedSwaps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-3 mb-3">
                <ArrowLeftRight className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-lg">No completed approvals</h3>
              <p className="text-muted-foreground mt-1">
                There are no approved or rejected shift swaps yet.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
              {completedSwaps.map((swap) => (
                <SwapCard
                  key={`${swap.id}-${swap.status}`}
                  swap={swap}
                  isManagerView={true}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Approve Shift Swap</DialogTitle>
            <DialogDescription>
              Please confirm that you want to approve this shift swap.
            </DialogDescription>
          </DialogHeader>
          
          {selectedSwap && (
            <div className="py-4">
              <div className="rounded-md border p-4 mb-4">
                <div className="font-medium mb-2">Swap Details:</div>
                <div className="text-sm">
                  <div className="mb-3">
                    <p><span className="font-medium">Original Shift:</span></p>
                    <p className="ml-4">
                      <span className="font-medium">Employee:</span> {selectedSwap.requesterName}<br />
                      <span className="font-medium">Date:</span> {selectedSwap.date}<br />
                      <span className="font-medium">Time:</span> {selectedSwap.startTime} - {selectedSwap.endTime}
                    </p>
                  </div>
                  
                  {/* Display preferred volunteer and time if provided */}
                  {(selectedSwap.preferredVolunteerName || selectedSwap.preferredTime) && (
                    <div className="mb-3 p-2 bg-blue-50 rounded">
                      <p><span className="font-medium">Preferences:</span></p>
                      <p className="ml-4">
                        {selectedSwap.preferredVolunteerName && (
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1 text-blue-600" />
                            <span className="font-medium">Volunteer:</span> {selectedSwap.preferredVolunteerName}
                          </div>
                        )}
                        {selectedSwap.preferredTime && (
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1 text-blue-600" />
                            <span className="font-medium">Time:</span> {selectedSwap.preferredTime}
                          </div>
                        )}
                      </p>
                    </div>
                  )}
                  
                  {selectedSwap.volunteerName && (
                    <div className="mb-3">
                      <p><span className="font-medium">Volunteer Shift:</span></p>
                      <p className="ml-4">
                        <span className="font-medium">Employee:</span> {selectedSwap.volunteerName}<br />
                        <span className="font-medium">Date:</span> {selectedSwap.volunteerShiftDate}<br />
                        <span className="font-medium">Time:</span> {selectedSwap.volunteerShiftStartTime} - {selectedSwap.volunteerShiftEndTime}
                      </p>
                    </div>
                  )}
                  
                  {selectedSwap.note && (
                    <div className="mt-3">
                      <p><span className="font-medium">Request Note:</span></p>
                      <p className="ml-4 italic text-muted-foreground">"{selectedSwap.note}"</p>
                    </div>
                  )}
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4">
                By approving this swap, both employees will be notified and their schedules will be updated accordingly.
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowApprovalDialog(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={confirmApprove} disabled={isProcessing}>
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-t-2 border-b-2 border-white rounded-full animate-spin"></span>
                  <span>Approving...</span>
                </span>
              ) : (
                'Approve Swap'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Rejection Dialog */}
      <Dialog open={showRejectionDialog} onOpenChange={setShowRejectionDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Reject Shift Swap</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this shift swap.
            </DialogDescription>
          </DialogHeader>
          
          {selectedSwap && (
            <div className="py-4">
              <div className="rounded-md border p-4 mb-4">
                <div className="font-medium mb-2">Swap Details:</div>
                <div className="text-sm">
                  <div className="mb-2">
                    <p><span className="font-medium">Employee:</span> {selectedSwap.requesterName}</p>
                    <p><span className="font-medium">Date:</span> {selectedSwap.date}</p>
                    <p><span className="font-medium">Time:</span> {selectedSwap.startTime} - {selectedSwap.endTime}</p>
                  </div>
                  
                  {/* Display preferences if provided */}
                  {(selectedSwap.preferredVolunteerName || selectedSwap.preferredTime) && (
                    <div className="mb-2">
                      <p><span className="font-medium">Preferences:</span></p>
                      {selectedSwap.preferredVolunteerName && (
                        <p><span className="font-medium">Preferred volunteer:</span> {selectedSwap.preferredVolunteerName}</p>
                      )}
                      {selectedSwap.preferredTime && (
                        <p><span className="font-medium">Preferred time:</span> {selectedSwap.preferredTime}</p>
                      )}
                    </div>
                  )}
                  
                  {selectedSwap.volunteerName && (
                    <div className="mb-2">
                      <p><span className="font-medium">Volunteer:</span> {selectedSwap.volunteerName}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <label htmlFor="reason" className="block text-sm font-medium">
                  Reason for Rejection
                </label>
                <Textarea
                  id="reason"
                  placeholder="Provide a reason why this swap is being rejected..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="min-h-[100px] w-full"
                />
                <p className="text-xs text-muted-foreground">
                  This reason will be shared with both employees.
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => {
              setShowRejectionDialog(false);
              setRejectionReason('');
            }} disabled={isProcessing}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmReject} 
              disabled={isProcessing || !rejectionReason.trim()}
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-t-2 border-b-2 border-white rounded-full animate-spin"></span>
                  <span>Rejecting...</span>
                </span>
              ) : (
                'Reject Swap'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApprovalList;
