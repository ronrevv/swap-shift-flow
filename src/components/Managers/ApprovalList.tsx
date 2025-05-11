
import React, { useState } from 'react';
import { SwapRequest } from '@/types';
import { Button } from '@/components/ui/button';
import SwapCard from '../Swaps/SwapCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/sonner';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeftRight, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getPendingSwapRequests, approveSwapRequest, rejectSwapRequest } from '@/api/swapApi';
import { createLogEntry } from '@/api/logsApi';

interface ApprovalDialogProps {
  swap: SwapRequest;
  isOpen: boolean;
  onClose: () => void;
  onApprove: () => void;
}

interface RejectionDialogProps {
  swap: SwapRequest;
  isOpen: boolean;
  onClose: () => void;
  onReject: (reason: string) => void;
}

// Dialog component for approving a swap
const ApprovalDialog: React.FC<ApprovalDialogProps> = ({ swap, isOpen, onClose, onApprove }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleApprove = async () => {
    setIsSubmitting(true);
    // Mock API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    onApprove();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Approve Shift Swap</DialogTitle>
          <DialogDescription>
            Please confirm that you want to approve this shift swap.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="rounded-md border p-4 mb-4">
            <div className="font-medium mb-2">Swap Details:</div>
            <div className="text-sm">
              <div className="mb-3">
                <p><span className="font-medium">Original Shift:</span></p>
                <p className="ml-4">
                  <span className="font-medium">Employee:</span> {swap.requesterName}<br />
                  <span className="font-medium">Date:</span> {swap.date}<br />
                  <span className="font-medium">Time:</span> {swap.startTime} - {swap.endTime}
                </p>
              </div>
              <div className="mb-3">
                <p><span className="font-medium">Volunteer Shift:</span></p>
                <p className="ml-4">
                  <span className="font-medium">Employee:</span> {swap.volunteerName}<br />
                  <span className="font-medium">Date:</span> {swap.volunteerShiftDate}<br />
                  <span className="font-medium">Time:</span> {swap.volunteerShiftStartTime} - {swap.volunteerShiftEndTime}
                </p>
              </div>
              {swap.note && (
                <div className="mt-3">
                  <p><span className="font-medium">Request Note:</span></p>
                  <p className="ml-4 italic text-muted-foreground">"{swap.note}"</p>
                </div>
              )}
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            By approving this swap, both employees will be notified and their schedules will be updated accordingly.
          </p>
        </div>
        
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleApprove} disabled={isSubmitting}>
            {isSubmitting ? (
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
  );
};

// Dialog component for rejecting a swap
const RejectionDialog: React.FC<RejectionDialogProps> = ({ swap, isOpen, onClose, onReject }) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleReject = async () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    
    setIsSubmitting(true);
    onReject(reason);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Reject Shift Swap</DialogTitle>
          <DialogDescription>
            Please provide a reason for rejecting this shift swap.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="rounded-md border p-4 mb-4">
            <div className="font-medium mb-2">Swap Details:</div>
            <div className="text-sm">
              <div className="mb-2">
                <p><span className="font-medium">Employee:</span> {swap.requesterName}</p>
                <p><span className="font-medium">Date:</span> {swap.date}</p>
                <p><span className="font-medium">Time:</span> {swap.startTime} - {swap.endTime}</p>
              </div>
              <div className="mb-2">
                <p><span className="font-medium">Volunteer:</span> {swap.volunteerName}</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-2 mb-4">
            <label htmlFor="reason" className="block text-sm font-medium">
              Reason for Rejection
            </label>
            <Textarea
              id="reason"
              placeholder="Provide a reason why this swap is being rejected..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[100px] w-full"
            />
            <p className="text-xs text-muted-foreground">
              This reason will be shared with both employees.
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleReject} 
            disabled={isSubmitting || !reason.trim()}
          >
            {isSubmitting ? (
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
  );
};

const ApprovalList: React.FC = () => {
  const [selectedSwap, setSelectedSwap] = useState<SwapRequest | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  
  // Fetch pending swap requests
  const { data: pendingSwaps, isLoading, error, refetch } = useQuery({
    queryKey: ['pendingSwaps'],
    queryFn: getPendingSwapRequests
  });
  
  // Use a separate state for completed swaps
  const [completedSwaps, setCompletedSwaps] = useState<SwapRequest[]>([]);
  
  const handleApprove = (swap: SwapRequest) => {
    setSelectedSwap(swap);
    setShowApprovalDialog(true);
  };
  
  const handleReject = (swap: SwapRequest) => {
    setSelectedSwap(swap);
    setShowRejectionDialog(true);
  };
  
  const confirmApprove = async () => {
    if (!selectedSwap) return;
    
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
          volunteer: selectedSwap.volunteerName
        }
      });
      
      // Update the completed swaps list
      setCompletedSwaps(prev => [{
        ...selectedSwap,
        status: 'Approved',
        approvedAt: new Date().toISOString()
      }, ...prev]);
      
      toast.success('Shift swap approved successfully!');
      refetch();
    } catch (error) {
      console.error('Error approving swap request:', error);
      toast.error('Failed to approve swap request. Please try again.');
    } finally {
      setShowApprovalDialog(false);
      setSelectedSwap(null);
    }
  };
  
  const confirmReject = async (reason: string) => {
    if (!selectedSwap) return;
    
    try {
      await rejectSwapRequest(selectedSwap.id, reason);
      
      // Log the rejection
      await createLogEntry({
        entityType: 'swap_request',
        entityId: selectedSwap.id,
        action: 'rejected',
        details: {
          swapId: selectedSwap.id,
          reason,
          requester: selectedSwap.requesterName,
          volunteer: selectedSwap.volunteerName
        }
      });
      
      // Update the completed swaps list
      setCompletedSwaps(prev => [{
        ...selectedSwap,
        status: 'Rejected',
        rejectedAt: new Date().toISOString(),
        reason
      }, ...prev]);
      
      toast.success('Shift swap rejected with reason.');
      refetch();
    } catch (error) {
      console.error('Error rejecting swap request:', error);
      toast.error('Failed to reject swap request. Please try again.');
    } finally {
      setShowRejectionDialog(false);
      setSelectedSwap(null);
    }
  };
  
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
      <h2 className="text-2xl font-bold mb-6">Shift Swap Approvals</h2>
      
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid grid-cols-2 w-full md:w-[300px]">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
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
                  refetch={refetch}
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
                You haven't approved or rejected any shift swaps yet.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
              {completedSwaps.map((swap) => (
                <SwapCard
                  key={swap.id}
                  swap={swap}
                  isManagerView={true}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Approval Dialog */}
      {selectedSwap && (
        <ApprovalDialog
          swap={selectedSwap}
          isOpen={showApprovalDialog}
          onClose={() => setShowApprovalDialog(false)}
          onApprove={confirmApprove}
        />
      )}
      
      {/* Rejection Dialog */}
      {selectedSwap && (
        <RejectionDialog
          swap={selectedSwap}
          isOpen={showRejectionDialog}
          onClose={() => setShowRejectionDialog(false)}
          onReject={confirmReject}
        />
      )}
    </div>
  );
};

export default ApprovalList;
