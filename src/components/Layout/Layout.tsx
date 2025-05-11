
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarProvider } from '@/components/ui/sidebar';
import Header from './Header';
import AppSidebar from './Sidebar';
import { Loader2 } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isAuthenticated, isLoading, initialLoadComplete, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Log the auth state for debugging
  useEffect(() => {
    console.log("Layout: Auth state:", { 
      isAuthenticated, 
      isLoading, 
      initialLoadComplete, 
      userExists: !!user 
    });
    
    // Only redirect once we're sure the user isn't authenticated
    if (initialLoadComplete && !isLoading && !isAuthenticated) {
      console.log("Layout: Not authenticated after load complete, redirecting to login");
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, isLoading, initialLoadComplete, navigate, user]);

  // Show loading indicator during authentication check
  if (isLoading || (!initialLoadComplete)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground">
          Loading your application...
        </p>
      </div>
    );
  }

  // Show loading state if authenticated but profile still loading
  if (isAuthenticated && !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground">
          Loading your profile...
        </p>
      </div>
    );
  }

  // Redirect to login if not authenticated after initial load
  if (initialLoadComplete && !isAuthenticated) {
    console.log("Layout: Not authenticated, redirecting to login");
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  
  console.log("Layout: Authenticated, rendering dashboard");
  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col w-full">
        <Header />
        <div className="flex flex-1 w-full">
          <AppSidebar />
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Layout;
