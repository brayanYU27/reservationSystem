import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { LandingPage } from './components/LandingPage';
import { PricingPage } from './components/PricingPage';
import { ExploreView } from './components/ExploreView';
import { BusinessPage } from './components/client/BusinessPage';
import { ClientView } from './components/ClientView';
import { AdminView } from './components/AdminView';
import { BusinessOnboarding } from './components/BusinessOnboarding';
import { BusinessProfile } from './components/BusinessProfile';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { Scissors, LogOut, Home, Settings, UserCog } from 'lucide-react';
import { Button } from './components/ui/button';
import { useLocation, useNavigate } from 'react-router-dom';
import { businessService } from '@/services/business.service';
import { useEffect, useState } from 'react';

// Wrapper to handle business check for owners
const OwnerGuard = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkBusiness = async () => {
      if (user?.role === 'BUSINESS_OWNER') {
        try {
          const response = await businessService.getMy();
          if (!response.success || !response.data) {
            navigate('/onboarding', { replace: true });
          }
        } catch {
          navigate('/onboarding', { replace: true });
        }
      }
      setChecking(false);
    };
    checkBusiness();
  }, [user, navigate]);

  if (checking) return null; // Or a spinner
  return <>{children}</>;
};

function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const showHeader = !['/', '/login', '/register', '/onboarding'].includes(location.pathname);

  if (!showHeader) return null;

  return (
    <header className="bg-neutral-900 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <Scissors className="size-8" />
            <div>
              <h1 className="font-bold text-xl">ServiConnect</h1>
              <p className="text-sm text-neutral-400">
                {user?.firstName} {user?.lastName} • {user?.role}
              </p>
            </div>
          </div>

          <div className="flex gap-2 items-center">
            {location.pathname === '/explore' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(user?.role === 'CLIENT' ? '/dashboard' : '/')}
                className="bg-transparent text-white border-white hover:bg-white/10"
              >
                <Home className="size-4 mr-2" />
                {user?.role === 'CLIENT' ? 'Mi Dashboard' : 'Inicio'}
              </Button>
            )}

            {/* Solo dueños pueden ver el botón de Perfil */}
            {location.pathname.startsWith('/admin') && user?.role === 'BUSINESS_OWNER' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/profile')}
                className="bg-transparent text-white border-white hover:bg-white/10"
              >
                <Settings className="size-4 mr-2" />
                Perfil
              </Button>
            )}

            {(user?.role === 'BUSINESS_OWNER' || user?.role === 'EMPLOYEE') && !location.pathname.startsWith('/admin') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin')}
                className="bg-transparent text-white border-white hover:bg-white/10"
              >
                <UserCog className="size-4 mr-2" />
                Panel Admin
              </Button>
            )}

            {/* Notification Bell */}
            <div className="text-white">
              <NotificationBell />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="bg-transparent text-white border-white hover:bg-white/10"
            >
              <LogOut className="size-4 mr-2" />
              Salir
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function App() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <Scissors className="size-12 mx-auto mb-4 animate-pulse text-neutral-900" />
          <p className="text-neutral-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 notranslate">
      <Layout />
      <main>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/explore" element={<ExploreView />} />
          <Route path="/business/:id" element={<BusinessPage />} />

          {/* Client Routes */}
          <Route element={<ProtectedRoute allowedRoles={['CLIENT']} />}>
            <Route path="/dashboard" element={<ClientView />} />
            <Route path="/notifications" element={<NotificationsPage />} />
          </Route>

          {/* Business Routes */}
          <Route element={<ProtectedRoute allowedRoles={['BUSINESS_OWNER', 'EMPLOYEE']} />}>
            <Route path="/admin" element={
              <OwnerGuard>
                <AdminView />
              </OwnerGuard>
            } />
            <Route path="/notifications" element={<NotificationsPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['BUSINESS_OWNER']} />}>
            <Route path="/onboarding" element={<BusinessOnboarding onComplete={() => window.location.href = '/admin'} onCancel={() => window.location.href = '/'} />} />
            <Route path="/profile" element={<BusinessProfile onBack={() => window.history.back()} />} />
          </Route>

          {/* Redirects */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}