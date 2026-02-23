import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ErrorBoundary } from './ErrorBoundary';
import { WelcomeTour } from '@/components/onboarding/WelcomeTour';
import { OwnerDashboard } from './admin/OwnerDashboard';
import { EmployeeDashboard } from './admin/EmployeeDashboard';
import { AppointmentsTab } from './admin/AppointmentsTab';
import { ServicesTab } from './admin/ServicesTab';
import { ScheduleTab } from './admin/ScheduleTab';
import { ReceptionTab } from './admin/ReceptionTab';
import { AnalyticsTab } from './admin/AnalyticsTab';
import { GalleryTab } from './admin/GalleryTab';
import { SettingsTab } from './admin/SettingsTab';
import { StaffTab } from './admin/StaffTab';
import {
  Calendar,
  Scissors,
  Clock,
  UserCheck,
  BarChart3,
  Image,
  LayoutDashboard,
  Settings,
  Users
} from 'lucide-react';

export function AdminView() {
  const { user } = useAuth();
  const isOwner = user?.role === 'BUSINESS_OWNER';
  const isEmployee = user?.role === 'EMPLOYEE';
  const [activeTab, setActiveTab] = useState('dashboard');

  // Vista para EMPLEADOS - Solo sus citas
  if (isEmployee) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmployeeDashboard />
      </div>
    );
  }

  // Vista para DUEÑOS - Dashboard completo
  return (
    <div className="container mx-auto px-4 py-8">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-4 lg:grid-cols-8 mb-8">
          <TabsTrigger value="dashboard" className="flex items-center gap-2" data-tour="dashboard">
            <LayoutDashboard className="size-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="reception" className="flex items-center gap-2" data-tour="reception">
            <UserCheck className="size-4" />
            <span className="hidden sm:inline">Recepción</span>
          </TabsTrigger>
          <TabsTrigger value="appointments" className="flex items-center gap-2" data-tour="appointments">
            <Calendar className="size-4" />
            <span className="hidden sm:inline">Citas</span>
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center gap-2" data-tour="services">
            <Scissors className="size-4" />
            <span className="hidden sm:inline">Servicios</span>
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center gap-2" data-tour="schedule">
            <Clock className="size-4" />
            <span className="hidden sm:inline">Horarios</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2" data-tour="analytics">
            <BarChart3 className="size-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="gallery" className="flex items-center gap-2" data-tour="gallery">
            <Image className="size-4" />
            <span className="hidden sm:inline">Galería</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2" data-tour="settings">
            <Settings className="size-4" />
            <span className="hidden sm:inline">Ajustes</span>
          </TabsTrigger>
          <TabsTrigger value="staff" className="flex items-center gap-2" data-tour="staff">
            <Users className="size-4" />
            <span className="hidden sm:inline">Equipo</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <ErrorBoundary>
            <OwnerDashboard onNavigate={setActiveTab} />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="reception">
          <ErrorBoundary>
            <ReceptionTab />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="appointments">
          <ErrorBoundary>
            <AppointmentsTab />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="services">
          <ErrorBoundary>
            <ServicesTab />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="schedule">
          <ErrorBoundary>
            <ScheduleTab />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="analytics">
          <ErrorBoundary>
            <AnalyticsTab />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="gallery">
          <ErrorBoundary>
            <GalleryTab />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="settings">
          <ErrorBoundary>
            <SettingsTab />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="staff">
          <ErrorBoundary>
            <StaffTab />
          </ErrorBoundary>
        </TabsContent>
      </Tabs>

      {/* Welcome Tour */}
      <WelcomeTour userId={user?.id} userRole={user?.role as any} />
    </div>
  );
}