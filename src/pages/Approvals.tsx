
import React, { useEffect } from 'react';
import Layout from '@/components/Layout/Layout';
import ApprovalList from '@/components/Managers/ApprovalList';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';

const Approvals = () => {
  const { user } = useAuth();
  const isManager = user?.role === 'Manager';
  
  useEffect(() => {
    // Update document title
    document.title = "ShiftSwap - Approvals";
    
    // Show toast if not a manager
    if (user && !isManager) {
      toast.error("Only managers can access the approvals page");
    }
  }, [user, isManager]);
  
  // If not a manager, redirect to dashboard
  if (!isManager) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Shift Swap Approvals</h2>
      </div>
      <ApprovalList />
    </Layout>
  );
};

export default Approvals;
