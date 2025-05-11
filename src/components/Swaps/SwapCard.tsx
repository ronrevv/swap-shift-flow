
import React, { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SwapRequest } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeftRight, Check, X, Calendar } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { approveSwapRequest, rejectSwapRequest } from '@/api/swapApi';
import { createLogEntry } from '@/api/logsApi';

interface SwapCardProps {
  swap: SwapRequest;
  onVolunteer?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  isManagerView?: boolean;
  refetch?: () => void;
}

const SwapCard: React.FC<SwapCardProps> = ({ 
  swap, 
  onVolunteer, 
  onApprove, 
  onReject, 
  isManagerView = false,
  refetch
}) => {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const isRequester = user?.id === swap.requesterId;
  const isVolunteer = user?.id === swap.volunteerId;
  const isManager = user?.role === 'Manager';
  const isPending = swap.status === 'Pending';
  const isOpen = swap.status === 'Open';
  const isApproved = swap.status === 'Approved';
  const isRejected = swap.status === 'Rejected';
  
  // Format the date
  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'EEE, MMM d');
    } catch (error) {
      return dateString;
    }
  };
  
  // Get time since request was created
  const getTimeSince = (dateString: string) => {
    try {
      return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
    } catch (error) {
      return 'some time ago';
    }
  };
  
  const handleVolunteer = () => {
    if (isRequester) {
      toast.error("You can't volunteer for your own shift!");
      return;
    }
    if (onVolunteer) onVolunteer();
  };
  
  const handleApprove = async () => {
    if (!isManager) {
      toast.error("Only managers can approve swap requests");
      return;
    }
    
    setIsProcessing(true);
    try {
      await approveSwapRequest(swap.id);
      
      // Log the approval
      await createLogEntry({
        entityType: 'swap_request',
        entityId: swap.id,
        action: 'approved',
        details: {
          managerId: user?.id,
          swapId: swap.id,
          requester: swap.requesterName,
          volunteer: swap.volunteerName
        }
      });
      
      toast.success('Swap request approved successfully');
      if (refetch) refetch();
      if (onApprove) onApprove();
    } catch (error) {
      console.error('Error approving swap request:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleReject = async () => {
    if (!isManager) {
      toast.error("Only managers can reject swap requests");
      return;
    }
    
    setIsProcessing(true);
    try {
      const reason = prompt('Please provide a reason for rejection (optional):');
      
      await rejectSwapRequest(swap.id, reason || undefined);
      
      // Log the rejection
      await createLogEntry({
        entityType: 'swap_request',
        entityId: swap.id,
        action: 'rejected',
        details: {
          managerId: user?.id,
          swapId: swap.id,
          reason: reason || null,
          requester: swap.requesterName,
          volunteer: swap.volunteerName
        }
      });
      
      toast.success('Swap request rejected');
      if (refetch) refetch();
      if (onReject) onReject();
    } catch (error) {
      console.error('Error rejecting swap request:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const getStatusBadge = () => {
    if (isOpen) return <span className="approval-badge approval-badge-pending">Available</span>;
    if (isPending) return <span className="approval-badge approval-badge-pending">Pending Approval</span>;
    if (isApproved) return <span className="approval-badge approval-badge-approved">Approved</span>;
    if (isRejected) return <span className="approval-badge approval-badge-rejected">Rejected</span>;
    return null;
  };
  
  return (
    <Card className={`swap-card ${isRequester ? 'border-l-blue-500' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center">
            <div className="p-2 mr-3 bg-swap bg-opacity-10 rounded-md text-swap">
              <ArrowLeftRight className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">
                  {formatDate(swap.date)}
                </h3>
                {getStatusBadge()}
              </div>
              <p className="text-muted-foreground">{swap.startTime} - {swap.endTime}</p>
            </div>
          </div>
        </div>
        
        <div className="pl-10">
          <p className="mb-2">
            <span className="font-medium">{swap.requesterName}</span>
            {isRequester && <span className="text-blue-500 text-sm ml-2">(You)</span>}
          </p>
          
          {swap.note && (
            <p className="text-sm text-muted-foreground mb-3 italic">
              "{swap.note}"
            </p>
          )}
          
          {(isPending || isApproved || isRejected) && swap.volunteerName && (
            <div className="mt-3 pb-3 border-t pt-3">
              <p>
                <span className="font-medium">Volunteer:</span> {swap.volunteerName}
                {isVolunteer && <span className="text-blue-500 text-sm ml-2">(You)</span>}
              </p>
              {swap.volunteerShiftDate && (
                <p className="text-sm text-muted-foreground">
                  {formatDate(swap.volunteerShiftDate)}, {swap.volunteerShiftStartTime} - {swap.volunteerShiftEndTime}
                </p>
              )}
            </div>
          )}
          
          {isRejected && swap.reason && (
            <div className="mt-3 bg-red-50 p-3 rounded-md text-sm">
              <p className="font-medium text-red-700">Reason for rejection:</p>
              <p className="text-red-600">{swap.reason}</p>
            </div>
          )}
          
          <p className="text-xs text-muted-foreground mt-3">
            Requested {getTimeSince(swap.createdAt)}
          </p>
        </div>
      </CardContent>
      
      {isOpen && !isRequester && !isManagerView && (
        <CardFooter className="px-4 pt-0 pb-4">
          <Button 
            variant="outline" 
            className="w-full text-swap hover:bg-swap hover:text-swap-foreground"
            onClick={handleVolunteer}
            disabled={isProcessing}
          >
            Volunteer to Take Shift
          </Button>
        </CardFooter>
      )}
      
      {isPending && isManager && isManagerView && (
        <CardFooter className="px-4 pt-0 pb-4 flex gap-2">
          <Button 
            variant="outline" 
            className="w-full text-approval hover:bg-approval hover:text-approval-foreground flex items-center gap-1"
            onClick={handleApprove}
            disabled={isProcessing}
          >
            <Check className="h-4 w-4" />
            <span>Approve</span>
          </Button>
          <Button 
            variant="outline" 
            className="w-full text-rejection hover:bg-rejection hover:text-rejection-foreground flex items-center gap-1"
            onClick={handleReject}
            disabled={isProcessing}
          >
            <X className="h-4 w-4" />
            <span>Reject</span>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default SwapCard;
