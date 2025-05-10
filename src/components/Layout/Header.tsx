
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { SidebarTrigger } from '@/components/ui/sidebar';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();
  };

  return (
    <header className="flex items-center justify-between h-16 px-6 border-b bg-white">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="text-gray-700" />
        <h1 className="text-xl font-bold text-primary">ShiftSwap</h1>
      </div>
      
      {user && (
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">{user.name}</span>
          <div className="flex items-center gap-2">
            <Avatar>
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="sm" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
