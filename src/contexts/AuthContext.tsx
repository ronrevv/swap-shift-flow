
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
          setUser(null);
        }
      } catch (error) {
        console.error("Error in profile fetch:", error);
      } finally {
        if (mounted) {
          console.log("Setting isLoading to false after profile fetch");
          setIsLoading(false);
          setInitialLoadComplete(true);
        }
      }
    };
    
    // FIRST set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log("Auth state change event:", event, "Session:", currentSession ? "exists" : "none");
        
        if (!mounted) return;
        
        setSession(currentSession);
        
        if (event === 'SIGNED_OUT') {
          console.log("User signed out, clearing user data");
          setUser(null);
          setIsLoading(false);
          setInitialLoadComplete(true);
          return;
        }
        
        if (currentSession?.user) {
          console.log("Auth state change: User is authenticated, fetching profile");
          // Use setTimeout to prevent potential deadlock with Supabase auth
          setTimeout(() => {
            fetchUserProfile(currentSession.user.id);
          }, 0);
        } else {
          console.log("Auth state change: No user found");
          setUser(null);
          setIsLoading(false);
          setInitialLoadComplete(true);
        }
      }
    );

    // THEN check for existing session
    const checkExistingSession = async () => {
      try {
        console.log("Checking for existing session");
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        console.log("Checking for existing session:", currentSession ? "Found" : "None");
        
        if (!mounted) return;
        
        setSession(currentSession);
        
        if (currentSession?.user) {
          console.log("Existing session found, fetching user profile");
          fetchUserProfile(currentSession.user.id);
        } else {
          console.log("No existing session found");
          setUser(null);
          setIsLoading(false);
          setInitialLoadComplete(true);
        }
      } catch (error) {
        console.error("Error checking existing session:", error);
        if (mounted) {
          setIsLoading(false);
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
      toast.success(`Welcome back!`);
      return data;
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "An unexpected error occurred during login");
      throw error;
    }
    // Note: We don't set isLoading to false here because the onAuthStateChange listener will do that
    // after fetching the user profile
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

  // Debug auth state changes
  useEffect(() => {
    console.log("Auth state updated:", { 
      isAuthenticated: !!user,
      isLoading,
      initialLoadComplete,
      user: user ? `${user.name} (${user.role})` : 'None' 
    });
  }, [user, isLoading, initialLoadComplete]);

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
