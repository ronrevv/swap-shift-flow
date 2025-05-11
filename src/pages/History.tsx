
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { format, parseISO, subDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon, FileText, ArrowLeftRight, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from '@/components/ui/sonner';
import { getActivityLogs, exportLogsAsCsv, getEmployeesForFilter } from '@/api/logsApi';
import { useQuery } from '@tanstack/react-query';
import { Pagination } from '@/components/ui/pagination';
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const History = () => {
  const { user } = useAuth();
  const isManager = user?.role === 'Manager';
  
  // Filter states
  const [employeeFilter, setEmployeeFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(subDays(new Date(), 30));
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date());
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  
  // Get employees for filter
  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: getEmployeesForFilter,
    enabled: isManager
  });
  
  // Get activity logs
  const {
    data: logsData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['activityLogs', employeeFilter, dateFrom, dateTo, currentPage, pageSize],
    queryFn: () => getActivityLogs({
      employeeFilter,
      dateFrom,
      dateTo,
      page: currentPage,
      pageSize
    }),
    enabled: isManager
  });
  
  useEffect(() => {
    // Update document title
    document.title = "ShiftSwap - History & Logs";
    
    // Reset to page 1 when filters change
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [employeeFilter, dateFrom, dateTo]);
  
  // If not a manager, redirect to dashboard
  if (!isManager) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // Handle CSV export
  const handleExportCSV = async () => {
    try {
      const csvContent = await exportLogsAsCsv({
        employeeFilter,
        dateFrom,
        dateTo
      });
      
      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `shift_swap_log_${format(new Date(), 'yyyyMMdd')}.csv`;
      link.click();
      
      toast.success('CSV report exported successfully!');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Failed to export CSV. Please try again.');
    }
  };
  
  // Format details for display
  const formatDetails = (details: any): { formatted: React.ReactNode, hasDetails: boolean } => {
    if (!details) return { formatted: null, hasDetails: false };
    
    try {
      // For swap requests
      if (details.swap_id) {
        return { 
          formatted: (
            <Table className="mt-2">
              <TableBody>
                {details.old_status && details.new_status && (
                  <TableRow>
                    <TableCell className="font-medium">Status Change</TableCell>
                    <TableCell>
                      <span className="text-amber-600">{details.old_status}</span>
                      {" → "}
                      <span className="text-green-600">{details.new_status}</span>
                    </TableCell>
                  </TableRow>
                )}
                {details.volunteer_id && (
                  <TableRow>
                    <TableCell className="font-medium">Volunteer</TableCell>
                    <TableCell>{details.volunteer_id}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          ), 
          hasDetails: true 
        };
      }
      
      // For shift changes
      if (details.shift_id && details.changes) {
        const changes = details.changes;
        const hasChanges = 
          (changes.date && (changes.date.old || changes.date.new)) || 
          (changes.start_time && (changes.start_time.old || changes.start_time.new)) || 
          (changes.end_time && (changes.end_time.old || changes.end_time.new));
          
        if (hasChanges) {
          return {
            formatted: (
              <Table className="mt-2">
                <TableHeader>
                  <TableRow>
                    <TableHead>Field</TableHead>
                    <TableHead>Previous</TableHead>
                    <TableHead>New</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {changes.date && (
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>{changes.date.old}</TableCell>
                      <TableCell>{changes.date.new}</TableCell>
                    </TableRow>
                  )}
                  {changes.start_time && (
                    <TableRow>
                      <TableCell>Start Time</TableCell>
                      <TableCell>{changes.start_time.old}</TableCell>
                      <TableCell>{changes.start_time.new}</TableCell>
                    </TableRow>
                  )}
                  {changes.end_time && (
                    <TableRow>
                      <TableCell>End Time</TableCell>
                      <TableCell>{changes.end_time.old}</TableCell>
                      <TableCell>{changes.end_time.new}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            ),
            hasDetails: true
          };
        }
      }
      
      // Simple key-value display for other types of details
      if (typeof details === 'object' && Object.keys(details).length > 0) {
        return {
          formatted: (
            <Table className="mt-2">
              <TableBody>
                {Object.entries(details).map(([key, value]) => (
                  <TableRow key={key}>
                    <TableCell className="font-medium">{key.replace(/_/g, ' ')}</TableCell>
                    <TableCell>{String(value)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ),
          hasDetails: true
        };
      }
    } catch (e) {
      console.error("Error formatting details:", e);
    }
    
    // Fallback for any other case
    return { 
      formatted: <pre className="whitespace-pre-wrap font-mono text-xs overflow-auto max-h-24 p-2 bg-muted/20 rounded mt-2">
        {JSON.stringify(details, null, 2)}
      </pre>, 
      hasDetails: true 
    };
  };
  
  // Calculate statistics
  const logs = logsData?.logs || [];
  const totalLogs = logsData?.pagination?.totalCount || 0;
  const shiftChanges = logs.filter(log => log.entityType === 'shift').length;
  const swapRequests = logs.filter(log => log.entityType === 'swap_request').length;
  const otherActions = logs.filter(log => 
    log.entityType !== 'shift' && log.entityType !== 'swap_request'
  ).length;
  
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Activity Log History</h2>
          
          <Button 
            variant="outline" 
            className="flex items-center gap-2" 
            onClick={handleExportCSV}
          >
            <FileText className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Filter Options</CardTitle>
            <CardDescription>Refine the activity logs using these filters</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    {employees?.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.name}
                      </SelectItem>
                    ))}
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
              <CardDescription>Total Entries</CardDescription>
              <CardTitle className="text-2xl">{totalLogs}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Shift Changes</CardDescription>
              <CardTitle className="text-2xl text-blue-600">{shiftChanges}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Swap Requests</CardDescription>
              <CardTitle className="text-2xl text-green-600">{swapRequests}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Other Actions</CardDescription>
              <CardTitle className="text-2xl text-amber-600">{otherActions}</CardTitle>
            </CardHeader>
          </Card>
        </div>
        
        <div className="border rounded-lg">
          <div className="px-4 py-3 border-b bg-muted/40">
            <h3 className="font-medium">Activity History</h3>
          </div>
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-muted-foreground">Loading activity logs...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-destructive/10 p-3 mb-3">
                <ArrowLeftRight className="h-6 w-6 text-destructive" />
              </div>
              <h3 className="font-medium text-lg">Error loading logs</h3>
              <p className="text-muted-foreground mt-1">
                An error occurred while loading activity logs. Please try again.
              </p>
              <Button variant="outline" className="mt-4" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : logs.length === 0 ? (
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
            <div className="divide-y">
              {logs.map(log => {
                const { formatted: formattedDetails, hasDetails } = formatDetails(log.details);
                
                return (
                  <div key={log.id} className="px-4 py-3 hover:bg-muted/20">
                    <div className="flex items-start justify-between">
                      <div className="w-full">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{log.userName || 'System'}</span>
                          <span className="px-2 py-0.5 text-xs rounded-full bg-muted">
                            {log.action}
                          </span>
                        </div>
                        
                        <div className="text-sm text-muted-foreground mt-1">
                          <span>{log.entityType}: {log.entityId}</span>
                        </div>
                        
                        {hasDetails && (
                          <Collapsible className="w-full mt-2">
                            <CollapsibleTrigger className="flex items-center text-xs text-muted-foreground hover:text-primary transition-colors">
                              <ChevronRight className="h-4 w-4 mr-1 transition-transform ui-expanded:rotate-90" />
                              View details
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-2">
                              {formattedDetails}
                            </CollapsibleContent>
                          </Collapsible>
                        )}
                      </div>
                      
                      <div className="text-right text-sm shrink-0">
                        <div>{format(parseISO(log.createdAt), 'MMM d, yyyy')}</div>
                        <div className="text-muted-foreground">
                          {format(parseISO(log.createdAt), 'h:mm a')}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Pagination */}
          {logsData && logsData.pagination.totalPages > 1 && (
            <div className="flex justify-center py-4 border-t">
              <Pagination
                currentPage={currentPage}
                totalPages={logsData.pagination.totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default History;
