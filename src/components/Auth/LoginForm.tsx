
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/sonner';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    try {
      await login(email, password);
    } catch (error) {
      // Error is handled in AuthContext
    }
  };

  const handleDemoLogin = async (role: 'Manager' | 'Staff') => {
    const demoEmail = role === 'Manager' ? 'manager@shiftswap.com' : 'staff@shiftswap.com';
    try {
      await login(demoEmail, 'password');
    } catch (error) {
      // Error is handled in AuthContext
    }
  };

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">ShiftSwap</CardTitle>
        <CardDescription className="text-center">
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input 
              id="email"
              type="email" 
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password"
              type="password" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-4">
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-t-2 border-b-2 border-white rounded-full animate-spin"></span>
                <span>Signing in...</span>
              </span>
            ) : (
              'Sign in'
            )}
          </Button>
          
          <div className="flex flex-col space-y-2 w-full">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Demo accounts
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => handleDemoLogin('Manager')}
                disabled={isLoading}
              >
                Manager Demo
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => handleDemoLogin('Staff')}
                disabled={isLoading}
              >
                Staff Demo
              </Button>
            </div>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
};

export default LoginForm;
