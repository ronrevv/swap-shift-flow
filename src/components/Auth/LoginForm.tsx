
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const LoginForm: React.FC = () => {
  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Registration state
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const { login, register, isLoading } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
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
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerEmail || !registerPassword || !registerName) {
      toast.error('Please fill in all fields');
      return;
    }
    
    if (registerPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      await register(registerEmail, registerPassword, registerName);
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
          Access your account or create a new one
        </CardDescription>
      </CardHeader>
      
      <Tabs defaultValue="login" className="w-full">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="register">Register</TabsTrigger>
        </TabsList>
        
        <TabsContent value="login">
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4 pt-4">
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
        </TabsContent>
        
        <TabsContent value="register">
          <form onSubmit={handleRegister}>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="register-name">Full Name</Label>
                <Input 
                  id="register-name"
                  type="text" 
                  placeholder="John Doe"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="register-email">Email Address</Label>
                <Input 
                  id="register-email"
                  type="email" 
                  placeholder="your.email@example.com"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="register-password">Password</Label>
                <Input 
                  id="register-password"
                  type="password" 
                  placeholder="••••••••"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input 
                  id="confirm-password"
                  type="password" 
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            
            <CardFooter>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-t-2 border-b-2 border-white rounded-full animate-spin"></span>
                    <span>Creating account...</span>
                  </span>
                ) : (
                  'Create account'
                )}
              </Button>
            </CardFooter>
          </form>
        </TabsContent>
      </Tabs>
      
      <div className="mt-4 px-6 pb-6 text-center text-sm text-muted-foreground">
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
    </Card>
  );
};

export default LoginForm;
