
import React, { useEffect } from 'react';
import Layout from '@/components/Layout/Layout';
import OpenSwapsList from '@/components/Swaps/OpenSwapsList';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/contexts/AuthContext';

const Swaps = () => {
  const { user } = useAuth();
  const isManager = user?.role === 'Manager';

  useEffect(() => {
    // Update document title
    document.title = "ShiftSwap - Swap Requests";
  }, []);
  
  const handleCreateRequestClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      toast.error("You must be logged in to create a swap request");
      return;
    }
    
    if (isManager) {
      e.preventDefault();
      toast.error("Managers cannot create swap requests");
    }
  };
  
  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Shift Swap Requests</h2>
        {!isManager && (
          <Link to="/shifts" onClick={handleCreateRequestClick}>
            <Button className="gap-2">
              <PlusCircle className="h-4 w-4" />
              <span>Create New Request</span>
            </Button>
          </Link>
        )}
      </div>
      <OpenSwapsList />
    </Layout>
  );
};

export default Swaps;
