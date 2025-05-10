
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Calendar, Users, ArrowLeftRight, CheckSquare, FileText, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';

interface MenuItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
}

const MenuItem: React.FC<MenuItemProps> = ({ to, icon: Icon, label }) => {
  const sidebar = useSidebar();
  const isCollapsed = sidebar.state === 'collapsed';
  
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <NavLink 
          to={to} 
          className={({ isActive }) => 
            `flex items-center gap-2 w-full p-2 rounded-md text-sidebar-foreground ${
              isActive ? 'bg-sidebar-accent font-medium' : 'hover:bg-sidebar-accent/50'
            }`
          }
        >
          <Icon className="h-5 w-5" />
          {!isCollapsed && <span>{label}</span>}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};

const AppSidebar: React.FC = () => {
  const sidebar = useSidebar();
  const isCollapsed = sidebar.state === 'collapsed';
  const { user } = useAuth();
  const isManager = user?.role === 'Manager';

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-56"}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70">
            {!isCollapsed && 'Navigation'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <MenuItem to="/dashboard" icon={User} label="Dashboard" />
              <MenuItem to="/shifts" icon={Calendar} label="My Shifts" />
              <MenuItem to="/swaps" icon={ArrowLeftRight} label="Swap Requests" />
              {isManager && (
                <MenuItem to="/approvals" icon={CheckSquare} label="Approvals" />
              )}
              {isManager && (
                <MenuItem to="/history" icon={FileText} label="History & Logs" />
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;
