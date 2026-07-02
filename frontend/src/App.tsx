import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import IncidentsList from './pages/IncidentsList';
import IncidentDetail from './pages/IncidentDetail';
import AlertsList from './pages/AlertsList';
import Settings from './pages/Settings';
import Integrations from './pages/Integrations';
import Admin from './pages/Admin';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 10_000, retry: 1 },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="incidents" element={<IncidentsList />} />
            <Route path="incidents/:id" element={<IncidentDetail />} />
            <Route path="alerts" element={<AlertsList />} />
            <Route path="settings" element={<Settings />} />
            <Route path="integrations" element={<Integrations />} />
            <Route path="admin" element={<Admin />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
