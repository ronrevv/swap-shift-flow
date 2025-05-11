
import React, { createContext, useState, useContext, useEffect } from 'react';
import { User, UserRole, AuthContextType } from '@/types';
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { Session } from '@supabase/supabase-js';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Initialize authentication on load
  useEffect(() => {
    console.log("AuthProvider: Initializing");
    let mounted = true;
    
    // Set up auth state listener FIRST (to prevent missing auth events)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("Auth state change event:", event, "Session:", currentSession ? "exists" : "none");
        
        if (!mounted) return;
        
        setSession(currentSession);
        
        if (currentSession?.user) {
          console.log("Auth state change: User is authenticated, fetching profile");
          try {
            await fetchUserProfile(currentSession.user.id);
          } catch (error) {
            console.error("Error in auth state change handler:", error);
            setIsLoading(false);
          }
        } else {
          console.log("Auth state change: No user found");
          setUser(null);
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session
    const checkExistingSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        console.log("Checking for existing session:", currentSession ? "Found" : "None");
        
        if (!mounted) return;
        
        setSession(currentSession);
        
        if (currentSession?.user) {
          console.log("Existing session found, fetching user profile");
          await fetchUserProfile(currentSession.user.id);
        } else {
          setUser(null);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error checking existing session:", error);
        setIsLoading(false);
      } finally {
        if (mounted) {
          setInitialLoadComplete(true);
        }
      }
    };

    checkExistingSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Fetch additional user profile data from the database
  const fetchUserProfile = async (userId: string) => {
    try {
      console.log("Fetching profile for user:", userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);
        // Create a profile from session data if profile doesn't exist
        if (session?.user) {
          const metadata = session.user.user_metadata;
          const email = session.user.email || '';
          
          // Create user from auth data
          const userRole: UserRole = email.includes('manager') ? 'Manager' : 'Staff';
          const userName = metadata?.name || email.split('@')[0] || 'User';
          
          const userProfile: User = {
            id: userId,
            name: userName,
            email: email,
            role: userRole
          };
          
          console.log("Created user profile from session:", userProfile);
          setUser(userProfile);
          
          // Try to create the profile in the database
          try {
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: userId,
                name: userName,
                email: email,
                role: userRole
              });
              
            if (insertError) {
              console.error("Failed to create profile:", insertError);
            } else {
              console.log("Created new profile in database");
            }
          } catch (insertErr) {
            console.error("Error creating profile:", insertErr);
          }
        }
      } else if (data) {
        console.log("Profile data retrieved:", data);
        setUser({
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role as UserRole
        });
      } else {
        console.log("No profile found for user");
      }
    } catch (error) {
      console.error("Error in profile fetch:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      console.log("Attempting login for:", email);
      
      // Try seed endpoint first for demo accounts
      if ((email === 'manager@shiftswap.com' || email === 'staff@shiftswap.com') && password === 'password') {
        try {
          // Seed demo data first to ensure demo accounts exist
          const seedResult = await supabase.functions.invoke('seed-demo-data');
          console.log("Seeded demo data before login attempt", seedResult);
        } catch (seedError) {
          console.log("Note: Demo data seeding failed but continuing with login", seedError);
        }
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error("Login error:", error);
        toast.error(error.message || "Failed to sign in. Please check your credentials.");
        setIsLoading(false);
        throw error;
      }

      console.log("Login successful, data:", data);
      
      // Fetch user profile immediately after successful login
      if (data.user) {
        await fetchUserProfile(data.user.id);
      }
      
      toast.success(`Welcome back!`);
      return data;
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "An unexpected error occurred during login");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error(error.message);
        throw error;
      }
      
      setUser(null);
      toast.success("Successfully logged out");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name
          }
        }
      });
      
      if (error) {
        toast.error(error.message);
        throw error;
      }
      
      toast.success("Registration successful! Please check your email for confirmation.");
      return data;
    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error(error.message || "Failed to register");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        register,
        isAuthenticated: !!user,
        isLoading,
        initialLoadComplete
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
