
import React, { useEffect } from 'react';
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
  const { isAuthenticated, isLoading, initialLoadComplete } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Effect to handle authentication redirects
  useEffect(() => {
    if (initialLoadComplete && !isLoading && !isAuthenticated) {
      console.log("Layout: Not authenticated after load complete, redirecting to login");
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, isLoading, initialLoadComplete, navigate]);

  if (isLoading || !initialLoadComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
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
