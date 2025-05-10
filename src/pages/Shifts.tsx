
import React, { useEffect } from 'react';
import Layout from '@/components/Layout/Layout';
import ShiftList from '@/components/Shifts/ShiftList';

const Shifts = () => {
  useEffect(() => {
    // Update document title
    document.title = "ShiftSwap - My Shifts";
  }, []);
  
  return (
    <Layout>
      <ShiftList />
    </Layout>
  );
};

export default Shifts;
