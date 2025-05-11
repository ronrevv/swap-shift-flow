
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, ArrowLeftRight, CheckSquare, X, Users, FileText, PieChart, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { getPendingSwapRequests, getAllSwapRequests } from '@/api/swapApi';
import { 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RPieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Button } from '@/components/ui/button';
import { exportLogsAsCsv } from '@/api/logsApi';
import { toast } from '@/components/ui/sonner';

const DashboardCard: React.FC<{
  title: string;
  value: number | string;
  description: string;
  icon: React.ReactNode;
  to: string;
  color: string;
}> = ({ title, value, description, icon, to, color }) => (
  <Link to={to} className="block">
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-full ${color}`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  </Link>
);

const ManagerDashboard: React.FC = () => {
  const { user } = useAuth();
  
  // Fetch pending swap requests for the dashboard
  const { data: pendingSwaps, isLoading: isPendingLoading } = useQuery({
    queryKey: ['dashboardPendingSwaps'],
    queryFn: getPendingSwapRequests,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true
  });
  
  // Fetch all swap requests for the analytics
  const { data: allSwaps, isLoading: isAllSwapsLoading } = useQuery({
    queryKey: ['dashboardAllSwaps'],
    queryFn: getAllSwapRequests,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  const pendingCount = pendingSwaps?.length || 0;
  
  // Calculate approval data for the chart
  const approvedCount = allSwaps?.filter(swap => swap.status === 'Approved').length || 0;
  const rejectedCount = allSwaps?.filter(swap => swap.status === 'Rejected').length || 0;
  const openCount = allSwaps?.filter(swap => swap.status === 'Open').length || 0;
  
  const approvalData = [
    { name: 'Pending', value: pendingCount, color: '#f59e0b' },
    { name: 'Approved', value: approvedCount, color: '#10b981' },
    { name: 'Rejected', value: rejectedCount, color: '#ef4444' },
    { name: 'Open', value: openCount, color: '#3b82f6' }
  ];
  
  // Group swaps by day of week for the chart
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const swapsByDay = dayNames.map(day => ({
    name: day,
    value: 0
  }));
  
  if (allSwaps) {
    allSwaps.forEach(swap => {
      try {
        const date = new Date(swap.date);
        const dayIndex = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
        swapsByDay[dayIndex].value += 1;
      } catch (error) {
        console.error('Error parsing date:', error);
      }
    });
  }
  
  // Calculate summary counts
  const totalEmployees = 12; // This would ideally come from an API
  const totalSwaps = allSwaps?.length || 0;
  const totalShifts = 35; // This would ideally come from an API
  const swapRate = totalShifts > 0 ? Math.round((totalSwaps / totalShifts) * 100) + '%' : '0%';
  
  // Download logs handler
  const handleDownloadLogs = async () => {
    try {
      const csvContent = await exportLogsAsCsv();
      
      // Create a Blob and download link
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('hidden', '');
      a.setAttribute('href', url);
      a.setAttribute('download', `swap_logs_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast.success('Logs exported successfully!');
    } catch (error) {
      console.error('Error exporting logs:', error);
      toast.error('Failed to export logs. Please try again.');
    }
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Manager Dashboard</h2>
        <Button variant="outline" onClick={handleDownloadLogs} className="gap-2">
          <Download className="h-4 w-4" /> Export Logs
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Total Staff"
          value={totalEmployees}
          description="Active employees"
          icon={<Users className="h-4 w-4 text-white" />}
          to="/approvals"
          color="bg-blue-500"
        />
        <DashboardCard
          title="Pending Approvals"
          value={pendingCount}
          description="Waiting for review"
          icon={<CheckSquare className="h-4 w-4 text-white" />}
          to="/approvals"
          color="bg-amber-500"
        />
        <DashboardCard
          title="Total Shifts"
          value={totalShifts}
          description="This week"
          icon={<Calendar className="h-4 w-4 text-white" />}
          to="/shifts"
          color="bg-green-500"
        />
        <DashboardCard
          title="Swap Rate"
          value={swapRate}
          description="Shifts being swapped"
          icon={<ArrowLeftRight className="h-4 w-4 text-white" />}
          to="/history"
          color="bg-purple-500"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5" />
              Pending Approvals
            </CardTitle>
            <CardDescription>Recent swap requests needing approval</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isPendingLoading ? (
                <div className="py-2 text-center text-muted-foreground">Loading approvals...</div>
              ) : pendingSwaps && pendingSwaps.length > 0 ? (
                <>
                  {pendingSwaps.slice(0, 4).map((swap) => (
                    <div key={swap.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                      <div className="flex items-center">
                        <div className="p-2 mr-3 bg-amber-100 rounded-md text-amber-700">
                          <ArrowLeftRight className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-medium">{swap.requesterName} → {swap.volunteerName}</h4>
                          <p className="text-sm text-muted-foreground">{swap.date}, {swap.startTime} - {swap.endTime}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link to="/approvals" className="block p-1.5 bg-green-100 rounded text-green-700 hover:bg-green-200 transition-colors">
                          <CheckSquare className="h-4 w-4" />
                        </Link>
                        <Link to="/approvals" className="block p-1.5 bg-red-100 rounded text-red-700 hover:bg-red-200 transition-colors">
                          <X className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  ))}
                  <Link to="/approvals" className="block text-sm text-primary font-medium mt-2 hover:underline">
                    View all pending approvals →
                  </Link>
                </>
              ) : (
                <div className="py-4 text-center text-muted-foreground">No pending approvals</div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Swap Status Distribution
            </CardTitle>
            <CardDescription>Overview of swap request statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <RPieChart>
                  <Pie
                    data={approvalData.filter(item => item.value > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {approvalData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Swap Requests</CardTitle>
          <CardDescription>Number of requests by day of the week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={swapsByDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManagerDashboard;
