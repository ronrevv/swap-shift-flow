
import React, { useState } from 'react';
import { SwapRequest } from '@/types';
import { Button } from '@/components/ui/button';
import SwapCard from '../Swaps/SwapCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/sonner';
import { parseISO } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeftRight } from 'lucide-react';

// Reuse the swap request mock data function from OpenSwapsList
// but filter for only the pending ones
const getManagerPendingSwaps = (): SwapRequest[] => {
  const users = [
    { id: '1', name: 'John Manager' },
    { id: '2', name: 'Jane Staff' },
    { id: '3', name: 'Bob Staff' },
  ];
  
  const swapRequests: SwapRequest[] = [];
  
  const today = new Date();
  
  // Generate pending requests
  for (let i = 0; i < 4; i++) {
    const user = (i + 1) % 3;
    const volunteerUser = (i + 2) % 3;
    const date = new Date();
    date.setDate(today.getDate() + (i + 1));
    
    swapRequests.push({
      id: `swap-pending-manager-${i}`,
      shiftId: `shift-${i + 3}`,
      requesterId: users[user].id,
      requesterName: users[user].name,
      note: i % 2 === 0 ? "Personal appointment." : "Family emergency.",
      date: date.toISOString().split('T')[0],
      startTime: '10:00 AM',
      endTime: '6:00 PM',
      status: 'Pending',
      createdAt: new Date(today.getTime() - ((i + 1) * 24 * 60 * 60 * 1000)).toISOString(),
      volunteerId: users[volunteerUser].id,
      volunteerName: users[volunteerUser].name,
      volunteerShiftId: `shift-v-${i}`,
      volunteerShiftDate: new Date(date.getTime() + ((i + 1) * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
      volunteerShiftStartTime: '9:00 AM',
      volunteerShiftEndTime: '5:00 PM',
    });
  }
  
  // Sort by date
  return swapRequests.sort((a, b) => {
    return parseISO(a.date).getTime() - parseISO(b.date).getTime();
  });
};

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
    // Mock API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSubmitting(false);
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
  const [pendingSwaps, setPendingSwaps] = useState<SwapRequest[]>(getManagerPendingSwaps());
  const [completedSwaps, setCompletedSwaps] = useState<SwapRequest[]>([]);
  const [selectedSwap, setSelectedSwap] = useState<SwapRequest | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  
  const handleApprove = (swap: SwapRequest) => {
    setSelectedSwap(swap);
    setShowApprovalDialog(true);
  };
  
  const handleReject = (swap: SwapRequest) => {
    setSelectedSwap(swap);
    setShowRejectionDialog(true);
  };
  
  const confirmApprove = () => {
    if (!selectedSwap) return;
    
    // Update the swap status
    const updatedSwap: SwapRequest = {
      ...selectedSwap,
      status: 'Approved',
      approvedAt: new Date().toISOString(),
      managerId: '1', // Hardcoded for demo
      managerName: 'John Manager',
    };
    
    // Remove from pending and add to completed
    setPendingSwaps(pendingSwaps.filter(swap => swap.id !== selectedSwap.id));
    setCompletedSwaps([updatedSwap, ...completedSwaps]);
    
    toast.success('Shift swap approved successfully!');
    setShowApprovalDialog(false);
    setSelectedSwap(null);
  };
  
  const confirmReject = (reason: string) => {
    if (!selectedSwap) return;
    
    // Update the swap status
    const updatedSwap: SwapRequest = {
      ...selectedSwap,
      status: 'Rejected',
      rejectedAt: new Date().toISOString(),
      managerId: '1', // Hardcoded for demo
      managerName: 'John Manager',
      reason,
    };
    
    // Remove from pending and add to completed
    setPendingSwaps(pendingSwaps.filter(swap => swap.id !== selectedSwap.id));
    setCompletedSwaps([updatedSwap, ...completedSwaps]);
    
    toast.success('Shift swap rejected with reason.');
    setShowRejectionDialog(false);
    setSelectedSwap(null);
  };
  
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Shift Swap Approvals</h2>
      
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid grid-cols-2 w-full md:w-[300px]">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending" className="mt-4">
          {pendingSwaps.length === 0 ? (
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
