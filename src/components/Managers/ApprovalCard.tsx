
import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SwapRequest } from '@/types';
import { Check, X, Calendar, ArrowLeftRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface ApprovalCardProps {
  swap: SwapRequest;
  onApprove: () => void;
  onReject: () => void;
}

const ApprovalCard: React.FC<ApprovalCardProps> = ({ swap, onApprove, onReject }) => {
  // Format the date
  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'EEE, MMM d, yyyy');
    } catch (error) {
      return dateString;
    }
  };
  
  return (
    <Card className="shadow-sm border-l-4 border-l-amber-500">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center">
            <div className="p-2 mr-3 bg-amber-100 rounded-md text-amber-700">
              <ArrowLeftRight className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Pending Approval</h3>
              <p className="text-sm text-muted-foreground">Swap requested {format(parseISO(swap.createdAt), 'MMM d')}</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
          {/* Original shift */}
          <div className="space-y-1 p-3 bg-muted/30 rounded-md">
            <p className="font-medium text-sm text-muted-foreground">Original Shift</p>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
              <p>{formatDate(swap.date)}</p>
            </div>
            <p className="text-sm">{swap.startTime} - {swap.endTime}</p>
            <p className="font-medium">{swap.requesterName}</p>
          </div>
          
          {/* Volunteer shift */}
          {swap.volunteerShiftDate && (
            <div className="space-y-1 p-3 bg-muted/30 rounded-md">
              <p className="font-medium text-sm text-muted-foreground">Volunteer Shift</p>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <p>{formatDate(swap.volunteerShiftDate)}</p>
              </div>
              <p className="text-sm">{swap.volunteerShiftStartTime} - {swap.volunteerShiftEndTime}</p>
              <p className="font-medium">{swap.volunteerName}</p>
            </div>
          )}
        </div>
        
        {swap.note && (
          <div className="mt-3 p-3 bg-blue-50 rounded-md">
            <p className="text-sm font-medium text-blue-700">Request Note:</p>
            <p className="text-sm text-blue-600">"{swap.note}"</p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="px-4 py-3 flex justify-end gap-2 border-t bg-muted/10">
        <Button 
          variant="outline" 
          className="text-green-600 border-green-200 hover:bg-green-50"
          onClick={onApprove}
        >
          <Check className="h-4 w-4 mr-1" />
          Approve
        </Button>
        <Button 
          variant="outline" 
          className="text-red-600 border-red-200 hover:bg-red-50"
          onClick={onReject}
        >
          <X className="h-4 w-4 mr-1" />
          Reject
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ApprovalCard;
