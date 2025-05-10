
import React, { useEffect } from 'react';
import Layout from '@/components/Layout/Layout';
import OpenSwapsList from '@/components/Swaps/OpenSwapsList';

const Swaps = () => {
  useEffect(() => {
    // Update document title
    document.title = "ShiftSwap - Swap Requests";
  }, []);
  
  return (
    <Layout>
      <h2 className="text-2xl font-bold mb-6">Shift Swap Requests</h2>
      <OpenSwapsList />
    </Layout>
  );
};

export default Swaps;
