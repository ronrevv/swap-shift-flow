
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { format, parseISO, subDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon, FileText, ArrowLeftRight } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from '@/components/ui/sonner';
import { SwapRequest } from '@/types';

// Mock history data
const generateMockHistoryData = () => {
  const users = [
    { id: '1', name: 'John Manager' },
    { id: '2', name: 'Jane Staff' },
    { id: '3', name: 'Bob Staff' },
    { id: '4', name: 'Alice Staff' },
    { id: '5', name: 'Mark Staff' },
  ];
  
  const swapHistory: SwapRequest[] = [];
  const today = new Date();
  
  // Generate a mix of approved and rejected swaps over the past 30 days
  for (let i = 0; i < 20; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const requestDate = subDays(today, daysAgo);
    const approvalDate = subDays(today, daysAgo - 1);
    
    const requesterIndex = Math.floor(Math.random() * (users.length - 1)) + 1; // Skip manager
    const volunteersLeft = users.filter((_, index) => index > 0 && index !== requesterIndex);
    const volunteerIndex = Math.floor(Math.random() * volunteersLeft.length);
    
    const isApproved = Math.random() > 0.3; // 70% approval rate
    
    const shiftDate = subDays(today, daysAgo - 7); // Shift is ~7 days after request
    const shiftDateString = shiftDate.toISOString().split('T')[0];
    
    swapHistory.push({
      id: `swap-history-${i}`,
      shiftId: `shift-history-${i}`,
      requesterId: users[requesterIndex].id,
      requesterName: users[requesterIndex].name,
      date: shiftDateString,
      startTime: '9:00 AM',
      endTime: '5:00 PM',
      status: isApproved ? 'Approved' : 'Rejected',
      createdAt: requestDate.toISOString(),
      volunteerId: volunteersLeft[volunteerIndex].id,
      volunteerName: volunteersLeft[volunteerIndex].name,
      volunteerShiftId: `volunteer-shift-${i}`,
      volunteerShiftDate: subDays(shiftDate, Math.floor(Math.random() * 14) - 7).toISOString().split('T')[0],
      volunteerShiftStartTime: '10:00 AM',
      volunteerShiftEndTime: '6:00 PM',
      managerId: users[0].id,
      managerName: users[0].name,
      approvedAt: isApproved ? approvalDate.toISOString() : undefined,
      rejectedAt: !isApproved ? approvalDate.toISOString() : undefined,
      reason: !isApproved ? [
        "Insufficient staffing for that day",
        "Volunteer lacks required skills",
        "Too many swap requests for this period",
        "Schedule conflicts with other commitments"
      ][Math.floor(Math.random() * 4)] : undefined,
    });
  }
  
  // Sort by creation date, newest first
  return swapHistory.sort((a, b) => 
    parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime()
  );
};

const History = () => {
  const { user } = useAuth();
  const isManager = user?.role === 'Manager';
  const [swapHistory, setSwapHistory] = useState<SwapRequest[]>(generateMockHistoryData());
  
  // Filter states
  const [employeeFilter, setEmployeeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(subDays(new Date(), 30));
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date());
  
  useEffect(() => {
    // Update document title
    document.title = "ShiftSwap - History & Logs";
  }, []);
  
  // If not a manager, redirect to dashboard
  if (!isManager) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // Apply filters to swap history
  const filteredHistory = swapHistory.filter(swap => {
    // Filter by employee
    if (employeeFilter !== "all" && 
        swap.requesterId !== employeeFilter && 
        swap.volunteerId !== employeeFilter) {
      return false;
    }
    
    // Filter by status
    if (statusFilter !== "all" && swap.status.toLowerCase() !== statusFilter) {
      return false;
    }
    
    // Filter by date range
    const swapDate = parseISO(swap.createdAt);
    if (dateFrom && swapDate < dateFrom) return false;
    if (dateTo) {
      const endOfDay = new Date(dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      if (swapDate > endOfDay) return false;
    }
    
    return true;
  });
  
  // Get unique employees for the filter
  const employees = Array.from(new Set([
    ...swapHistory.map(swap => ({ id: swap.requesterId, name: swap.requesterName })),
    ...swapHistory.map(swap => ({ id: swap.volunteerId, name: swap.volunteerName }))
  ].filter(Boolean).map(emp => JSON.stringify(emp))))
  .map(emp => JSON.parse(emp))
  .sort((a, b) => a.name.localeCompare(b.name));
  
  // Handle CSV export
  const exportToCSV = () => {
    // Generate CSV content
    const headers = [
      'Swap ID', 
      'Requester Name', 
      'Volunteer Name', 
      'Shift Date', 
      'Shift Time', 
      'Status', 
      'Created At', 
      'Approved/Rejected At',
      'Manager'
    ];
    
    const csvRows = [
      headers.join(','), // Header row
      ...filteredHistory.map(swap => [
        swap.id,
        swap.requesterName,
        swap.volunteerName || 'N/A',
        swap.date,
        `${swap.startTime} - ${swap.endTime}`,
        swap.status,
        format(parseISO(swap.createdAt), 'yyyy-MM-dd HH:mm'),
        swap.approvedAt ? format(parseISO(swap.approvedAt), 'yyyy-MM-dd HH:mm') 
          : swap.rejectedAt ? format(parseISO(swap.rejectedAt), 'yyyy-MM-dd HH:mm') 
          : 'N/A',
        swap.managerName || 'N/A'
      ].join(','))
    ].join('\n');
    
    // Create and download the file
    const blob = new Blob([csvRows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shift_swap_log_${format(new Date(), 'yyyyMMdd')}.csv`;
    link.click();
    
    toast.success('CSV report exported successfully!');
  };
  
  // Calculate statistics
  const totalRequests = filteredHistory.length;
  const approvedCount = filteredHistory.filter(swap => swap.status === 'Approved').length;
  const rejectedCount = filteredHistory.filter(swap => swap.status === 'Rejected').length;
  const approvalRate = totalRequests > 0 ? Math.round((approvedCount / totalRequests) * 100) : 0;
  
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Shift Swap History & Logs</h2>
          
          <Button 
            variant="outline" 
            className="flex items-center gap-2" 
            onClick={exportToCSV}
          >
            <FileText className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Filter Options</CardTitle>
            <CardDescription>Refine the history logs using these filters</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Employee
                </label>
                <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by employee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Employees</SelectItem>
                    {employees.map((emp: any) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Status
                </label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">
                  From Date
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">
                  To Date
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Swap Requests</CardDescription>
              <CardTitle className="text-2xl">{totalRequests}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Approved Swaps</CardDescription>
              <CardTitle className="text-2xl text-green-600">{approvedCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Rejected Swaps</CardDescription>
              <CardTitle className="text-2xl text-red-600">{rejectedCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Approval Rate</CardDescription>
              <CardTitle className="text-2xl">{approvalRate}%</CardTitle>
            </CardHeader>
          </Card>
        </div>
        
        <div className="border rounded-lg">
          <div className="px-4 py-3 border-b bg-muted/40">
            <h3 className="font-medium">Swap Request History</h3>
          </div>
          <div className="divide-y">
            {filteredHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-muted p-3 mb-3">
                  <ArrowLeftRight className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-lg">No records found</h3>
                <p className="text-muted-foreground mt-1">
                  Try adjusting your filters to see more results.
                </p>
              </div>
            ) : (
              filteredHistory.map(swap => (
                <div key={swap.id} className="px-4 py-3 hover:bg-muted/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{swap.requesterName}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-medium">{swap.volunteerName || 'No Volunteer'}</span>
                        
                        {swap.status === 'Approved' ? (
                          <span className="approval-badge approval-badge-approved">Approved</span>
                        ) : (
                          <span className="approval-badge approval-badge-rejected">Rejected</span>
                        )}
                      </div>
                      
                      <div className="text-sm text-muted-foreground mt-1">
                        <span>Shift: {format(parseISO(swap.date), 'MMM d, yyyy')}, {swap.startTime} - {swap.endTime}</span>
                      </div>
                    </div>
                    
                    <div className="text-right text-sm">
                      <div>{format(parseISO(swap.createdAt), 'MMM d, yyyy')}</div>
                      <div className="text-muted-foreground">
                        by {swap.managerName || 'N/A'}
                      </div>
                    </div>
                  </div>
                  
                  {swap.status === 'Rejected' && swap.reason && (
                    <div className="mt-2 text-sm text-red-600">
                      <span className="font-medium">Reason:</span> {swap.reason}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default History;
