
import React, { useEffect } from 'react';
import Layout from '@/components/Layout/Layout';
import ApprovalList from '@/components/Managers/ApprovalList';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const Approvals = () => {
  const { user } = useAuth();
  const isManager = user?.role === 'Manager';
  
  useEffect(() => {
    // Update document title
    document.title = "ShiftSwap - Approvals";
  }, []);
  
  // If not a manager, redirect to dashboard
  if (!isManager) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return (
    <Layout>
      <ApprovalList />
    </Layout>
  );
};

export default Approvals;
