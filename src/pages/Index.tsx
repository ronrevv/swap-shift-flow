
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LoginForm from '@/components/Auth/LoginForm';
import { seedDemoData } from '@/utils/seedData';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const Index = () => {
  const { isAuthenticated } = useAuth();
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedError, setSeedError] = useState('');
  
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
    setSeedError('');
    try {
      const result = await seedDemoData();
      if (!result) {
        setSeedError('There was a problem seeding demo data. Please try again.');
      }
    } catch (error: any) {
      console.error("Error seeding data:", error);
      setSeedError(error.message || 'Failed to seed demo data');
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
        
        {seedError && (
          <div className="mt-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{seedError}</AlertDescription>
            </Alert>
          </div>
        )}
        
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

        <div className="mt-4 text-center text-xs text-muted-foreground">
          <p>Having trouble logging in? Try clicking "Seed Demo Data" first, then use the demo accounts.</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
