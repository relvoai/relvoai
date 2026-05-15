import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './src/core/query/queryClient';
import { useAuthStore } from './src/core/auth/authStore';
import { ThemeProvider } from './src/components/ThemeProvider';
import { loadEnabledPlugins } from './src/core/plugins/loader';
import { prefetchLicense } from './src/core/license/useLicense';
// Side-effect import: attaches window.Relvo so plugin bundles can register.
import './src/core/plugins/registry';

// Layouts
import Layout from './src/components/Layout';

// Pages
import Login from './src/pages/Login';
import Dashboard from './src/pages/Dashboard';
import InboxList from './src/pages/InboxList';
import InboxCreate from './src/pages/InboxCreate';
import InboxDetails from './src/pages/InboxDetails';
import ChannelDetails from './src/pages/ChannelDetails';
import Inbox from './src/pages/Inbox';
import ConversationDetails from './src/pages/ConversationDetails';
import Visitors from './src/pages/Visitors';
import Contacts from './src/pages/Contacts';
import ContactDetails from './src/pages/ContactDetails';
import Departments from './src/pages/Departments';
import Users from './src/pages/Users';
import Productivity from './src/pages/Productivity';
import Automation from './src/pages/Automation';
import Reports from './src/pages/Reports';
import Ratings from './src/pages/Ratings';
import Settings from './src/pages/Settings';
import Logs from './src/pages/Logs';
import Roles from './src/pages/Roles';
import WidgetPreview from './src/pages/WidgetPreview';
import AiAgents from './src/pages/AiAgents';
import AiAgentDetails from './src/pages/AiAgentDetails';
import AiCredits from './src/pages/AiCredits';
import AiSystemInstruction from './src/pages/AiSystemInstruction';
import AiToolsListPage from './src/pages/Enterprise/AiTools/ListPage';
import AiToolsCreatePage from './src/pages/Enterprise/AiTools/CreatePage';

/**
 * Auth hook using Zustand store
 * Provides compatibility layer for existing components
 */
export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);

  return {
    user,
    isAuthenticated,
    logout,
  };
}

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly) {
    const roles = user?.roles ?? [];
    const isAdmin = roles.includes('admin') || roles.includes('owner');
    if (!isAdmin) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}

export default function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;
    // Fire-and-forget: do not block initial render on plugin bundles.
    loadEnabledPlugins().catch((err) => {
      console.error('[plugins] manifest load failed', err);
    });
    prefetchLicense().catch((err) => {
      console.error('[license] prefetch failed', err);
    });
  }, [isAuthenticated]);

  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/widget-preview" element={<WidgetPreview />} />

            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />

              {/* Inboxes - per .ai/contracts/update.json */}
              <Route path="inboxes" element={<InboxList />} />
              <Route path="inboxes/create" element={<InboxCreate />} />
              <Route path="inboxes/:id" element={<InboxDetails />} />

              {/* Channels */}
              <Route path="channels/:id" element={<ChannelDetails />} />

              {/* Conversations */}
              <Route path="conversations" element={<ConversationDetails />} />
              <Route path="conversations/:id" element={<ConversationDetails />} />
              <Route path="inbox" element={<Inbox />} />
              <Route path="inbox/:id" element={<Inbox />} />

              {/* Team */}
              <Route path="visitors" element={<Visitors />} />
              <Route path="contacts" element={<Contacts />} />
              <Route path="contacts/:id" element={<ContactDetails />} />
              <Route path="departments" element={<Departments />} />

              {/* Productivity */}
              <Route path="canned-replies" element={<Productivity />} />
              <Route path="automation" element={<Automation />} />

              {/* Analytics */}
              <Route path="reports" element={<Reports />} />
              <Route path="ratings" element={<Ratings />} />

              {/* AI */}
              <Route path="ai/agents" element={<AiAgents />} />
              <Route path="ai/agents/:id" element={<AiAgentDetails />} />
              <Route path="ai/credits" element={<AiCredits />} />
              <Route path="ai/system-instruction" element={<AiSystemInstruction />} />

              {/* Enterprise */}
              <Route path="enterprise/ai-tools" element={<AiToolsListPage />} />
              <Route path="enterprise/ai-tools/new" element={<AiToolsCreatePage />} />

              {/* System */}
              <Route path="settings" element={<Settings />} />
              <Route path="logs" element={<Logs />} />

              {/* Admin Only */}
              <Route path="users" element={<ProtectedRoute adminOnly><Users /></ProtectedRoute>} />
              <Route path="roles" element={<ProtectedRoute adminOnly><Roles /></ProtectedRoute>} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ThemeProvider>
      </HashRouter>
    </QueryClientProvider>
  );
}