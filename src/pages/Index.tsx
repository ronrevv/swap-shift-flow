
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LoginForm from '@/components/Auth/LoginForm';
import { seedDemoData } from '@/utils/seedData';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { isAuthenticated } = useAuth();
  const [isSeeding, setIsSeeding] = useState(false);
  
  useEffect(() => {
    // Update document title
    document.title = "ShiftSwap - Login";
  }, []);
  
  // If logged in, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      await seedDemoData();
    } finally {
      setIsSeeding(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">ShiftSwap</h1>
          <p className="text-muted-foreground">
            Workplace Shift Exchange & Approval System
          </p>
        </div>
        
        <LoginForm />
        
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>For demo purposes, you can use:</p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs font-mono bg-white p-3 rounded-md shadow-sm">
            <div>
              <p className="font-semibold">Manager:</p>
              <p>manager@shiftswap.com</p>
            </div>
            <div>
              <p className="font-semibold">Staff:</p>
              <p>staff@shiftswap.com</p>
            </div>
            <div className="col-span-2 mt-2">
              <p className="font-semibold">Password: </p>
              <p>password</p>
            </div>
          </div>
        </div>
        
        <div className="mt-8 flex justify-center">
          <Button 
            variant="outline" 
            onClick={handleSeedData} 
            disabled={isSeeding}
            className="text-sm"
          >
            {isSeeding ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Seeding Data...
              </>
            ) : (
              'Seed Demo Data'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
