
import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { PluginSlot } from '../core/plugins/PluginSlot';
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Settings,
  BarChart3,
  Zap,
  MessageCircle,
  Building2,
  AppWindow,
  Globe,
  ChevronLeft,
  ChevronRight,
  Search,
  Bell,
  Sun,
  Moon,
  ChevronsUpDown,
  Sparkles,
  ShieldAlert,
  Bot,
  Star,
  Contact,
  List,
  Menu,
  X,
  BookText,
  Wrench
} from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';
import { useLicense } from '../core/license/useLicense';
import {
  cn,
  Avatar,
  Button,
  Separator,
  Input
} from './UI';
import { useAuth } from '../../App';
import { useTheme } from './ThemeProvider';

// --- Sidebar Component (Sidebar 07 Expanded) ---
interface AppSidebarProps {
  mobile?: boolean;
  onClose?: () => void;
}

function AppSidebar({ mobile, onClose }: AppSidebarProps) {
  const { user, logout } = useAuth();
  const { can, canAny, isAdmin } = usePermissions();
  const { isEnterprise } = useLicense();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const showAiSection = canAny('ai.agents.manage', 'ai.credits.manage', 'system.settings.update');

  // Define Navigation structure per .ai/contracts/update.json
  const navGroups = [
    {
      label: "Platform",
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: Building2, label: 'Inboxes', path: '/inboxes' },
        { icon: MessageSquare, label: 'Conversations', path: '/conversations' },
        { icon: MessageCircle, label: 'My Inbox', path: '/inbox' },
      ]
    },
    {
      label: "Team",
      items: [
        { icon: Users, label: 'Online Visitors', path: '/visitors' },
        { icon: Contact, label: 'Contacts', path: '/contacts' },
        { icon: Building2, label: 'Departments', path: '/departments' },
        ...(isAdmin ? [
          { icon: Users, label: 'Users', path: '/users' },
        ] : [])
      ]
    },
    {
      label: "Productivity",
      items: [
        { icon: Zap, label: 'Canned Replies', path: '/canned-replies' },
        { icon: Bot, label: 'Automation', path: '/automation' },
      ]
    },
    ...(showAiSection ? [{
      label: "AI",
      items: [
        ...(can('ai.agents.manage') ? [{ icon: Sparkles, label: 'Agents', path: '/ai/agents' }] : []),
        ...(can('ai.credits.manage') ? [{ icon: Zap, label: 'Credits', path: '/ai/credits' }] : []),
        ...(can('system.settings.update') ? [{ icon: BookText, label: 'System Instruction', path: '/ai/system-instruction' }] : []),
      ]
    }] : []),
    ...(isEnterprise ? [{
      label: "Enterprise",
      items: [
        { icon: Wrench, label: 'AI Tools', path: '/enterprise/ai-tools' },
      ]
    }] : []),
    {
      label: "Analytics",
      items: [
        { icon: BarChart3, label: 'Reports', path: '/reports' },
        { icon: Star, label: 'Ratings', path: '/ratings' },
      ]
    },
    {
      label: "System",
      items: [
        { icon: Settings, label: 'Settings', path: '/settings' },
        { icon: List, label: 'Audit Logs', path: '/logs' },
        ...(isAdmin ? [
          { icon: ShieldAlert, label: 'Roles', path: '/roles' },
        ] : [])
      ]
    }
  ];

  return (
    <aside
      className={cn(
        "group/sidebar bg-card border-r border-border flex flex-col transition-all duration-300 relative z-20 h-full",
        mobile ? "w-full" : (collapsed ? "w-[60px]" : "w-[260px]")
      )}
    >
      {/* Sidebar Header: Logo */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-border">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <MessageCircle className="size-4" />
          </div>
          <div className={cn("grid flex-1 text-left text-sm leading-tight transition-all duration-200", collapsed && !mobile && "w-0 opacity-0 overflow-hidden")}>
            <span className="truncate font-semibold">Relvo AI</span>
            <span className="truncate text-xs text-muted-foreground">Enterprise</span>
          </div>
        </div>
        {mobile && <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>}
      </div>

      {/* Sidebar Content: Nav */}
      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-6 no-scrollbar">
        {navGroups.map((group, idx) => (
          <div key={idx} className="group-data-[collapsible=icon]:hidden">
            <div className={cn("px-2 py-1.5 text-xs font-semibold text-muted-foreground/50 uppercase tracking-wider mb-1", collapsed && !mobile && "hidden")}>
              {group.label}
            </div>
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'} // Only exact match for dashboard
                  onClick={mobile ? onClose : undefined}
                  className={({ isActive }) => cn(
                    "flex items-center gap-2 px-2 py-2 rounded-md text-sm font-medium transition-colors relative group",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    collapsed && !mobile && "justify-center px-0"
                  )}
                  title={collapsed && !mobile ? item.label : undefined}
                >
                  <item.icon className="size-4 shrink-0" />
                  <span className={cn("transition-all duration-200", collapsed && !mobile && "w-0 opacity-0 overflow-hidden hidden")}>
                    {item.label}
                  </span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}

        {/* Plugin contributions */}
        <PluginSlot
          name="sidebar.section"
          className={cn("space-y-1 px-2", collapsed && !mobile && "hidden")}
        />
      </div>

      {/* Sidebar Footer: User */}
      <div className="p-2 border-t border-border mt-auto">
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg p-2 hover:bg-muted transition-colors text-left",
              collapsed && !mobile && "justify-center px-0"
            )}
          >
            <Avatar src={user?.avatar_url} fallback={user?.first_name[0]} className="h-8 w-8 rounded-lg" />
            <div className={cn("grid flex-1 text-left text-sm leading-tight transition-all", collapsed && !mobile && "hidden")}>
              <span className="truncate font-semibold">{user?.first_name}</span>
              <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
            </div>
            <ChevronsUpDown className={cn("ml-auto size-4 text-muted-foreground", collapsed && !mobile && "hidden")} />
          </button>

          {userMenuOpen && (
            <div className="absolute bottom-full left-0 w-full mb-2 bg-popover border border-border rounded-lg shadow-lg p-1 min-w-[200px] z-50">
              <div className="px-2 py-1.5 text-sm">
                <div className="font-semibold">{user?.first_name}</div>
                <div className="text-xs text-muted-foreground capitalize">{user?.roles?.[0] ?? 'user'}</div>
              </div>
              <Separator className="my-1" />
              <div className="px-2 py-1.5 text-sm hover:bg-muted rounded-sm cursor-pointer flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Upgrade to Pro
              </div>
              <div className="px-2 py-1.5 text-sm hover:bg-muted rounded-sm cursor-pointer" onClick={handleLogout}>
                Log out
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Collapse Toggle (Desktop Only) */}
      {!mobile && (
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 bg-background border border-border rounded-full p-1 shadow-sm hover:bg-muted z-30"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      )}
    </aside>
  );
}

// --- Main Layout ---
export default function Layout() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:block h-full">
        <AppSidebar />
      </div>

      {/* Mobile Sidebar (Drawer) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative z-50 w-64 h-full animate-in slide-in-from-left-full duration-200">
            <AppSidebar mobile onClose={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-14 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-4 md:px-6 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Dashboard</span>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search..." className="w-64 pl-9 h-9 bg-muted/50 border-none focus-visible:bg-background focus-visible:ring-1" />
            </div>
            <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-background"></span>
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-muted/20 p-4 md:p-6">
          <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
