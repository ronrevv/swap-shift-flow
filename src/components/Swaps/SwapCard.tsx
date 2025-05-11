
import React, { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SwapRequest } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeftRight, Check, X, Calendar, Clock, User } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { approveSwapRequest, rejectSwapRequest } from '@/api/swapApi';
import { createLogEntry } from '@/api/logsApi';
import VolunteerButton from '../Volunteers/VolunteerButton';

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
  const isApproved = swap.status === 'Approved';
  const isRejected = swap.status === 'Rejected';
  
  // Format the date
  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return 'N/A';
      const date = parseISO(dateString);
      return format(date, 'EEE, MMM d');
    } catch (error) {
      return dateString || 'N/A';
    }
  };
  
  // Get time since request was created
  const getTimeSince = (dateString: string) => {
    try {
      if (!dateString) return 'some time ago';
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
    
    if (isManager) {
      toast.error("Managers cannot volunteer for shift swaps");
      return;
    }
    
    if (onVolunteer) onVolunteer();
  };
  
  const handleApprove = async () => {
    if (!isManager) {
      toast.error("Only managers can approve swap requests");
      return;
    }
    
    if (onApprove) {
      onApprove();
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
    
    if (onReject) {
      onReject();
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
    } catch (error) {
      console.error('Error rejecting swap request:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const getStatusBadge = () => {
    if (isPending) return <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full font-medium">Pending Approval</span>;
    if (isApproved) return <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">Approved</span>;
    if (isRejected) return <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-medium">Rejected</span>;
    return null;
  };
  
  return (
    <Card className={`swap-card ${isRequester ? 'border-l-blue-500 border-l-4' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center">
            <div className="p-2 mr-3 bg-blue-100 rounded-md text-blue-700">
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
          
          {/* Preferred time and volunteer section */}
          {(isPending || isApproved) && (swap.preferredTime || swap.preferredVolunteerName) && (
            <div className="mb-3 space-y-1">
              {swap.preferredVolunteerName && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <User className="h-4 w-4 mr-1" />
                  <span>Preferred volunteer: {swap.preferredVolunteerName}</span>
                </div>
              )}
              {swap.preferredTime && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>Preferred time: {swap.preferredTime}</span>
                </div>
              )}
            </div>
          )}
          
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
      
      {isApproved && !isRequester && !isManagerView && !isManager && !isVolunteer && (
        <CardFooter className="px-4 pt-0 pb-4">
          <VolunteerButton 
            swapId={swap.id}
            onSuccess={refetch}
          />
        </CardFooter>
      )}
      
      {isPending && isManager && isManagerView && (
        <CardFooter className="px-4 pt-0 pb-4 flex gap-2">
          <Button 
            variant="outline" 
            className="w-full text-green-600 hover:bg-green-50 border-green-200 hover:text-green-700 flex items-center gap-1"
            onClick={handleApprove}
            disabled={isProcessing}
          >
            <Check className="h-4 w-4" />
            <span>Approve</span>
          </Button>
          <Button 
            variant="outline" 
            className="w-full text-red-600 hover:bg-red-50 border-red-200 hover:text-red-700 flex items-center gap-1"
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
