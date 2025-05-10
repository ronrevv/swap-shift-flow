
import React, { useEffect } from 'react';
import Layout from '@/components/Layout/Layout';
import StaffDashboard from '@/components/Dashboard/StaffDashboard';
import ManagerDashboard from '@/components/Dashboard/ManagerDashboard';
import { useAuth } from '@/contexts/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const isManager = user?.role === 'Manager';
  
  useEffect(() => {
    // Update document title
    document.title = "ShiftSwap - Dashboard";
  }, []);
  
  return (
    <Layout>
      {isManager ? <ManagerDashboard /> : <StaffDashboard />}
    </Layout>
  );
};

export default Dashboard;
