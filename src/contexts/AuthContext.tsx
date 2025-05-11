
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

  // Function to create user profile if it doesn't exist
  const createUserProfile = async (userId: string, email: string, name: string, role: UserRole) => {
    try {
      console.log("Creating profile for user:", userId);
      
      // First check if profile exists to avoid duplicate attempts
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (checkError) {
        console.error("Error checking for existing profile:", checkError);
      }
        
      if (existingProfile) {
        console.log("Profile already exists:", existingProfile);
        return existingProfile;
      }
      
      // Setup proper headers to avoid 406 errors
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          name: name,
          email: email,
          role: role
        })
        .select()
        .single();
        
      if (error) {
        console.error("Failed to create profile:", error);
        
        // Since profile insertion might fail due to RLS, try using service role function
        // This is a fallback approach
        try {
          const { error: fnError } = await supabase.functions.invoke('create-profile', {
            body: { userId, name, email, role }
          });
          
          if (fnError) {
            console.error("Failed to create profile via function:", fnError);
            return null;
          }
          
          // Try fetching again after creation attempt
          const { data: newProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
            
          return newProfile;
        } catch (fnErr) {
          console.error("Error invoking profile creation function:", fnErr);
          return null;
        }
      } else {
        console.log("Created new profile in database:", data);
        return data;
      }
    } catch (insertErr) {
      console.error("Error creating profile:", insertErr);
      return null;
    }
  };
  
  const fetchUserProfile = async (userId: string) => {
    try {
      console.log("Fetching profile for user:", userId);
      
      // First try to get the profile with proper headers
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
  
      if (error) {
        console.error("Error fetching user profile:", error);
      }
      
      if (data) {
        console.log("Profile data retrieved:", data);
        const userProfile: User = {
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role as UserRole
        };
        setUser(userProfile);
        return userProfile;
      } else {
        console.log("No profile found in database");
        
        // If profile doesn't exist but we have session data, create it
        if (session?.user) {
          const metadata = session.user.user_metadata;
          const email = session.user.email || '';
          
          // Determine role based on email or default to Staff
          const userRole: UserRole = email.includes('manager') ? 'Manager' : 'Staff';
          const userName = metadata?.name || email.split('@')[0] || 'User';
          
          // Create user profile
          const newProfile = await createUserProfile(userId, email, userName, userRole);
          
          if (newProfile) {
            const userProfile: User = {
              id: newProfile.id,
              name: newProfile.name,
              email: newProfile.email,
              role: newProfile.role as UserRole
            };
            setUser(userProfile);
            return userProfile;
          }
          
          // If creation failed, create temporary user
          const tempUser: User = {
            id: userId,
            name: userName,
            email: email,
            role: userRole
          };
          
          console.log("Using temporary user data:", tempUser);
          setUser(tempUser);
          return tempUser;
        } else {
          setUser(null);
          return null;
        }
      }
    } catch (error) {
      console.error("Error in profile fetch:", error);
      return null;
    } finally {
      console.log("Setting isLoading to false after profile fetch");
      setIsLoading(false);
      setInitialLoadComplete(true);
    }
  };
  
  // Initialize authentication on load
  useEffect(() => {
    console.log("AuthProvider: Initializing");
    let mounted = true;
    
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
            if (mounted) {
              fetchUserProfile(currentSession.user.id);
            }
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
          await fetchUserProfile(currentSession.user.id);
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
      if ((email === 'manager@shiftswap.com' || email === 'staff@shiftswap.com' || email === 'bob@shiftswap.com') && password === 'password') {
        try {
          // Seed demo data first to ensure demo accounts exist, but don't fail if this errors
          console.log("Seeding demo data for demo account login");
          const seedResult = await supabase.functions.invoke('seed-demo-data', {
            headers: {
              "Accept": "application/json",
              "Content-Type": "application/json"
            }
          }).catch(err => {
            console.log("Note: Demo data seeding failed but continuing with login", err);
            return { data: null, error: err };
          });
          console.log("Seeded demo data before login attempt", seedResult);
        } catch (seedError) {
          // Don't fail the login if seeding fails
          console.log("Note: Demo data seeding failed but continuing with login", seedError);
        }
      }
      
      // Proceed with normal login regardless of seed result
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
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
    } finally {
      // We don't set isLoading to false here because the onAuthStateChange listener
      // will handle that after fetching the user profile
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
      
      // Create user profile
      if (data.user) {
        const userRole: UserRole = email.includes('manager') ? 'Manager' : 'Staff';
        await createUserProfile(data.user.id, email, name, userRole);
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
