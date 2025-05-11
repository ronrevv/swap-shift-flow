
import React from 'react';
import SwapCard from './SwapCard';
import { useQuery } from '@tanstack/react-query';
import { getOpenSwapRequests, getUserSwapHistory } from '@/api/swapApi';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, AlertCircle, ArrowLeftRight } from 'lucide-react';

const OpenSwapsList = () => {
  const { user } = useAuth();
  const isManager = user?.role === 'Manager';
  
  // Fetch open swap requests (now only approved ones)
  const {
    data: openSwaps,
    isLoading: isOpenLoading,
    error: openError,
    refetch: refetchOpenSwaps
  } = useQuery({
    queryKey: ['openSwaps'],
    queryFn: getOpenSwapRequests,
    refetchInterval: 30000, // Refresh every 30 seconds
    refetchOnWindowFocus: true
  });
  
  // Fetch user's swap history (only for staff members)
  const {
    data: userSwaps,
    isLoading: isUserLoading,
    error: userError,
    refetch: refetchUserSwaps
  } = useQuery({
    queryKey: ['userSwaps'],
    queryFn: getUserSwapHistory,
    // Only run if user is logged in and is not a manager
    enabled: !!user && user.role !== 'Manager',
    refetchInterval: 30000,
    refetchOnWindowFocus: true
  });
  
  // Handle refetching all data
  const refetchAll = () => {
    refetchOpenSwaps();
    if (user && !isManager) refetchUserSwaps();
  };
  
  // Show loading state
  if (isOpenLoading || (!isManager && isUserLoading)) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <p className="text-muted-foreground">Loading swap requests...</p>
      </div>
    );
  }
  
  // Show error state
  if (openError || (!isManager && userError)) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <AlertCircle className="h-8 w-8 text-destructive mb-2" />
        <h3 className="font-medium text-lg">Something went wrong</h3>
        <p className="text-muted-foreground text-center mt-1">
          We couldn't load the swap requests. Please try again later.
        </p>
      </div>
    );
  }
  
  // Filter swaps for My Swaps tab (only for staff)
  const myRequests = !isManager ? (userSwaps?.filter(swap => swap.requesterId === user?.id) || []) : [];
  const myVolunteered = !isManager ? (userSwaps?.filter(swap => swap.volunteerId === user?.id) || []) : [];
  
  const hasOpenSwaps = openSwaps && openSwaps.length > 0;
  const hasMySwaps = myRequests.length > 0 || myVolunteered.length > 0;
  
  if (!hasOpenSwaps && (!hasMySwaps || isManager)) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="rounded-full bg-muted p-3 mb-3">
          <ArrowLeftRight className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="font-medium text-lg">No approved swap requests</h3>
        <p className="text-muted-foreground text-center mt-1 max-w-md">
          {!user ? "Please log in to view and manage shift swaps." :
           isManager ? "There are no approved shift swap requests right now." :
           "There are no approved shift swap requests right now."}
        </p>
      </div>
    );
  }
  
  // For managers, only show the "Available Swaps" tab (which are approved swaps)
  if (isManager) {
    return (
      <div className="mt-6">
        <h3 className="font-medium text-lg mb-4">Approved Swaps</h3>
        {!hasOpenSwaps ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-3 mb-3">
              <ArrowLeftRight className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-lg">No approved swaps</h3>
            <p className="text-muted-foreground text-center mt-1 max-w-md">
              There are no approved shift swap requests right now.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {openSwaps.map(swap => (
              <SwapCard 
                key={swap.id} 
                swap={swap} 
                refetch={refetchAll}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
  
  // For staff, show both tabs
  return (
    <Tabs defaultValue="openSwaps" className="w-full">
      <TabsList className="grid grid-cols-2 w-full md:w-[400px]">
        <TabsTrigger value="openSwaps">Approved Swaps</TabsTrigger>
        <TabsTrigger value="mySwaps">My Swaps</TabsTrigger>
      </TabsList>
      
      <TabsContent value="openSwaps" className="mt-6">
        {!hasOpenSwaps ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-3 mb-3">
              <ArrowLeftRight className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-lg">No approved swaps</h3>
            <p className="text-muted-foreground text-center mt-1 max-w-md">
              There are no approved shift swap requests right now. Check back later or create your own request.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {openSwaps.map(swap => (
              <SwapCard 
                key={swap.id} 
                swap={swap} 
                refetch={refetchAll}
              />
            ))}
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="mySwaps" className="mt-6">
        {myRequests.length > 0 && (
          <>
            <h3 className="text-lg font-medium mb-4">My Requests</h3>
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-6">
              {myRequests.map(swap => (
                <SwapCard 
                  key={swap.id} 
                  swap={swap} 
                  refetch={refetchAll}
                />
              ))}
            </div>
          </>
        )}
        
        {myVolunteered.length > 0 && (
          <>
            <h3 className="text-lg font-medium mb-4">My Volunteered Shifts</h3>
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {myVolunteered.map(swap => (
                <SwapCard 
                  key={swap.id} 
                  swap={swap} 
                  refetch={refetchAll}
                />
              ))}
            </div>
          </>
        )}
        
        {myRequests.length === 0 && myVolunteered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-3 mb-3">
              <ArrowLeftRight className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-lg">No swaps found</h3>
            <p className="text-muted-foreground text-center mt-1 max-w-md">
              You haven't requested or volunteered for any shift swaps yet.
            </p>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
};

export default OpenSwapsList;
