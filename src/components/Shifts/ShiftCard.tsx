
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Shift } from '@/types';
import { Button } from '@/components/ui/button';
import { Calendar, ArrowLeftRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface ShiftCardProps {
  shift: Shift;
  onRequestSwap: (shift: Shift) => void;
}

const ShiftCard: React.FC<ShiftCardProps> = ({ shift, onRequestSwap }) => {
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
    <Card className="shift-card">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center">
            <div className="p-2 mr-3 bg-blue-100 rounded-md text-blue-700">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{formatDate(shift.date)}</h3>
              <p className="text-muted-foreground">{shift.startTime} - {shift.endTime}</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            className="flex items-center gap-1 text-swap"
            onClick={() => onRequestSwap(shift)}
          >
            <ArrowLeftRight className="h-4 w-4" />
            <span>Request Swap</span>
          </Button>
        </div>
        
        <div className="pl-10">
          <p className="text-sm">
            <span className="font-medium">Role:</span> {shift.role}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShiftCard;
