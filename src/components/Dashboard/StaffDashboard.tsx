
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, ArrowLeftRight, CalendarCheck, CalendarX } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

// Mock counts for the dashboard
const mockCounts = {
  upcomingShifts: 5,
  pendingSwaps: 2,
  approvedSwaps: 3,
  rejectedSwaps: 1
};

const DashboardCard: React.FC<{
  title: string;
  value: number;
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

const StaffDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Welcome, {user?.name}</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Upcoming Shifts"
          value={mockCounts.upcomingShifts}
          description="Your scheduled shifts"
          icon={<Calendar className="h-4 w-4 text-white" />}
          to="/shifts"
          color="bg-blue-500"
        />
        <DashboardCard
          title="Pending Swaps"
          value={mockCounts.pendingSwaps}
          description="Awaiting approval"
          icon={<ArrowLeftRight className="h-4 w-4 text-white" />}
          to="/swaps"
          color="bg-amber-500"
        />
        <DashboardCard
          title="Approved Swaps"
          value={mockCounts.approvedSwaps}
          description="Successfully swapped shifts"
          icon={<CalendarCheck className="h-4 w-4 text-white" />}
          to="/swaps"
          color="bg-green-500"
        />
        <DashboardCard
          title="Rejected Swaps"
          value={mockCounts.rejectedSwaps}
          description="Declined swap requests"
          icon={<CalendarX className="h-4 w-4 text-white" />}
          to="/swaps"
          color="bg-red-500"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>My Upcoming Shifts</CardTitle>
            <CardDescription>Your next 3 scheduled shifts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => {
                // Generate upcoming dates
                const date = new Date();
                date.setDate(date.getDate() + i + 1);
                const formattedDate = date.toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric'
                });
                
                return (
                  <div key={i} className="flex items-center p-2 rounded-md hover:bg-muted">
                    <div className="p-2 mr-3 bg-blue-100 rounded-md text-blue-700">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-medium">{formattedDate}</h4>
                      <p className="text-sm text-muted-foreground">
                        {8 + i}:00 AM - {4 + i}:00 PM
                      </p>
                    </div>
                  </div>
                );
              })}
              <Link to="/shifts" className="block text-sm text-primary font-medium mt-2 hover:underline">
                View all shifts →
              </Link>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Open Swap Requests</CardTitle>
            <CardDescription>Shifts available for swap</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => {
                // Generate dates
                const date = new Date();
                date.setDate(date.getDate() + i + 2);
                const formattedDate = date.toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric'
                });
                
                const names = ['Alice', 'Bob', 'Charlie'];
                
                return (
                  <div key={i} className="flex items-center p-2 rounded-md hover:bg-muted">
                    <div className="p-2 mr-3 bg-purple-100 rounded-md text-purple-700">
                      <ArrowLeftRight className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-medium">{names[i]} • {formattedDate}</h4>
                      <p className="text-sm text-muted-foreground">
                        {9 + i}:00 AM - {5 + i}:00 PM
                      </p>
                    </div>
                  </div>
                );
              })}
              <Link to="/swaps" className="block text-sm text-primary font-medium mt-2 hover:underline">
                View all swap requests →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StaffDashboard;
