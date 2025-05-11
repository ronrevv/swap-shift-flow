import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, ArrowLeftRight, CheckSquare, X, Users, FileText, PieChart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { getPendingSwapRequests } from '@/api/swapApi';
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
  Cell
} from 'recharts';

// Mock data for the dashboard
const mockApprovalData = [
  { name: 'Pending', value: 4, color: '#f59e0b' },
  { name: 'Approved', value: 8, color: '#10b981' },
  { name: 'Rejected', value: 2, color: '#ef4444' },
];

const mockSwapsByDay = [
  { name: 'Mon', value: 3 },
  { name: 'Tue', value: 2 },
  { name: 'Wed', value: 5 },
  { name: 'Thu', value: 4 },
  { name: 'Fri', value: 7 },
  { name: 'Sat', value: 2 },
  { name: 'Sun', value: 1 },
];

const mockCounts = {
  totalEmployees: 12,
  pendingApprovals: 4,
  totalShifts: 35,
  swapRate: '15%'
};

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
  const { data: pendingSwaps, isLoading } = useQuery({
    queryKey: ['dashboardPendingSwaps'],
    queryFn: getPendingSwapRequests,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true
  });
  
  const pendingCount = pendingSwaps?.length || 0;
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Manager Dashboard</h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Total Staff"
          value={mockCounts.totalEmployees}
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
          value={mockCounts.totalShifts}
          description="This week"
          icon={<Calendar className="h-4 w-4 text-white" />}
          to="/history"
          color="bg-green-500"
        />
        <DashboardCard
          title="Swap Rate"
          value={mockCounts.swapRate}
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
              {isLoading ? (
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
                    data={mockApprovalData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {mockApprovalData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
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
              <BarChart data={mockSwapsByDay}>
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
