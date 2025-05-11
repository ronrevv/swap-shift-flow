
import React, { useEffect } from 'react';
import Layout from '@/components/Layout/Layout';
import StaffDashboard from '@/components/Dashboard/StaffDashboard';
import ManagerDashboard from '@/components/Dashboard/ManagerDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const Dashboard = () => {
  const { user, isLoading } = useAuth();
  const isManager = user?.role === 'Manager';
  
  useEffect(() => {
    // Update document title
    document.title = "ShiftSwap - Dashboard";
  }, []);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <Layout>
      {isManager ? <ManagerDashboard /> : <StaffDashboard />}
    </Layout>
  );
};

export default Dashboard;
