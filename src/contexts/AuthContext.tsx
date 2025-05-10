
import React, { createContext, useState, useContext, useEffect } from 'react';
import { User, UserRole, AuthContextType } from '@/types';
import { toast } from "@/components/ui/sonner";

// Mock users
const mockUsers = [
  {
    id: '1',
    name: 'John Manager',
    email: 'manager@shiftswap.com',
    role: 'Manager' as UserRole,
    password: 'password', // In a real app, never store passwords in plain text
  },
  {
    id: '2',
    name: 'Jane Staff',
    email: 'staff@shiftswap.com',
    role: 'Staff' as UserRole,
    password: 'password',
  },
  {
    id: '3',
    name: 'Bob Staff',
    email: 'bob@shiftswap.com',
    role: 'Staff' as UserRole,
    password: 'password',
  }
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is stored in localStorage on app load
  useEffect(() => {
    const storedUser = localStorage.getItem('shiftswap_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse user from localStorage:", error);
        localStorage.removeItem('shiftswap_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // Simulate API delay
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    const foundUser = mockUsers.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (!foundUser) {
      setIsLoading(false);
      toast.error("Invalid email or password");
      throw new Error("Invalid credentials");
    }

    const { password: _, ...userWithoutPassword } = foundUser;
    setUser(userWithoutPassword);
    localStorage.setItem('shiftswap_user', JSON.stringify(userWithoutPassword));
    toast.success(`Welcome back, ${foundUser.name}!`);
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('shiftswap_user');
    toast.success("Successfully logged out");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        isLoading
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
