
import React, { useEffect } from 'react';
import Layout from '@/components/Layout/Layout';
import OpenSwapsList from '@/components/Swaps/OpenSwapsList';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const Swaps = () => {
  useEffect(() => {
    // Update document title
    document.title = "ShiftSwap - Swap Requests";
  }, []);
  
  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Shift Swap Requests</h2>
        <Link to="/shifts">
          <Button className="gap-2">
            <PlusCircle className="h-4 w-4" />
            <span>Create New Request</span>
          </Button>
        </Link>
      </div>
      <OpenSwapsList />
    </Layout>
  );
};

export default Swaps;
