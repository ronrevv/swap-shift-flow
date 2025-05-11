
import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import Layout from '@/components/Layout/Layout';
import StaffDashboard from '@/components/Dashboard/StaffDashboard';
import ManagerDashboard from '@/components/Dashboard/ManagerDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const Dashboard = () => {
  const { user, isLoading, isAuthenticated, initialLoadComplete } = useAuth();
  const isManager = user?.role === 'Manager';
  
  useEffect(() => {
    // Update document title
    document.title = "ShiftSwap - Dashboard";
    
    console.log("Dashboard: Rendering with auth state:", { 
      isAuthenticated, 
      isLoading, 
      initialLoadComplete,
      user: user ? `${user.name} (${user.role})` : 'None'
    });
  }, [isAuthenticated, isLoading, initialLoadComplete, user]);
  
  if (isLoading || !initialLoadComplete) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log("Dashboard: Not authenticated, redirecting to login");
    return <Navigate to="/" replace />;
  }
  
  console.log("Dashboard: Rendering dashboard for user role:", user?.role);
  return (
    <Layout>
      {isManager ? <ManagerDashboard /> : <StaffDashboard />}
    </Layout>
  );
};

export default Dashboard;
