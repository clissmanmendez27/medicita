import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { NewAppointmentFlow } from './components/NewAppointmentFlow';
import { MyAppointmentsView } from './components/MyAppointmentsView';
import { SpecialtiesAndDoctorsView } from './components/SpecialtiesAndDoctorsView';
import { AIAssistantView } from './components/AIAssistantView';
import { DoctorPortalView } from './components/DoctorPortalView';
import { AdminPortalView } from './components/AdminPortalView';
import { CancelModal } from './components/CancelModal';
import { RescheduleModal } from './components/RescheduleModal';
import { AuthModal } from './components/AuthModal';
import { MedicitaService, subscribeToStore } from './services/medicitaService';
import { User, Specialty, Doctor, Appointment, NotificationAlert } from './types';

export default function App() {
  // Store states
  const [currentUser, setCurrentUser] = useState<User>(MedicitaService.getCurrentUser());
  const [allUsers, setAllUsers] = useState<User[]>(MedicitaService.getAllUsers());
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [notifications, setNotifications] = useState<NotificationAlert[]>([]);

  // Navigation state
  const [currentView, setCurrentView] = useState<string>('dashboard');

  // New appointment flow preselection
  const [preselectedSpecialtyId, setPreselectedSpecialtyId] = useState<string | undefined>(undefined);
  const [preselectedDoctor, setPreselectedDoctor] = useState<Doctor | undefined>(undefined);

  // Modals
  const [cancelModalApt, setCancelModalApt] = useState<Appointment | null>(null);
  const [rescheduleModalApt, setRescheduleModalApt] = useState<Appointment | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  // Refresh data from service
  const refreshData = async () => {
    setCurrentUser(MedicitaService.getCurrentUser());
    setAllUsers(MedicitaService.getAllUsers());
    const sp = await MedicitaService.getSpecialties();
    setSpecialties(sp);
    const doc = await MedicitaService.getDoctors();
    setDoctors(doc);
    const apt = await MedicitaService.getAppointments();
    setAppointments(apt);
    setNotifications(MedicitaService.getNotifications());
  };

  useEffect(() => {
    refreshData();
    const unsubscribe = subscribeToStore(() => {
      refreshData();
    });
    return () => unsubscribe();
  }, []);

  // Filter patient appointments
  const patientAppointments = appointments.filter((a) => a.pacienteId === currentUser.id);

  // Upcoming appointment for dashboard (first confirmed or pending)
  const upcomingAppointment = patientAppointments.find(
    (a) => a.estado === 'confirmada' || a.estado === 'pendiente'
  );

  const activeAppointmentsCount = patientAppointments.filter(
    (a) => a.estado === 'confirmada' || a.estado === 'pendiente'
  ).length;

  // Handlers
  const handleSwitchUser = (user: User) => {
    MedicitaService.setCurrentUser(user);
    setCurrentUser(user);
    if (user.rol === 'medico') {
      setCurrentView('portal-medico');
    } else if (user.rol === 'admin') {
      setCurrentView('portal-admin');
    } else {
      setCurrentView('dashboard');
    }
  };

  const handleStartBookingWithSpecialty = (specialtyId: string) => {
    setPreselectedSpecialtyId(specialtyId);
    setPreselectedDoctor(undefined);
    setCurrentView('nueva-cita');
  };

  const handleStartBookingWithDoctor = (doc: Doctor) => {
    setPreselectedSpecialtyId(doc.especialidadId);
    setPreselectedDoctor(doc);
    setCurrentView('nueva-cita');
  };

  const handleCancelAppointment = async (appointmentId: string, reason: string) => {
    await MedicitaService.cancelAppointment(appointmentId, reason);
  };

  const handleRescheduleAppointment = async (
    appointmentId: string,
    newFecha: string,
    newHora: string,
    newFechaFormateada: string
  ) => {
    await MedicitaService.rescheduleAppointment(appointmentId, newFecha, newHora, newFechaFormateada);
  };

  const handleSaveMedicalNotes = async (
    appointmentId: string,
    notes: string,
    receta: string
  ) => {
    await MedicitaService.updateDoctorMedicalNotes(appointmentId, notes, receta, 'atendida');
  };

  const handleMarkNotificationRead = (id: string) => {
    MedicitaService.markNotificationAsRead(id);
  };

  const handleMarkAllNotificationsRead = () => {
    MedicitaService.markAllNotificationsAsRead();
  };

  const handleLogin = async (email: string, pass: string) => {
    const res = await MedicitaService.login(email, pass);
    if (res.success && res.user) {
      handleSwitchUser(res.user);
    }
    return res;
  };

  const handleRegister = async (data: Omit<User, 'id'>) => {
    const res = await MedicitaService.register(data);
    if (res.success && res.user) {
      handleSwitchUser(res.user);
    }
    return res;
  };

  const handleResetData = () => {
    MedicitaService.resetAllData();
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    const defaultUser = MedicitaService.logout();
    setCurrentUser(defaultUser);
    setCurrentView('dashboard');
    setAuthModalMode('login');
    setAuthModalOpen(true);
  };

  // Find target doctor for reschedule modal
  const rescheduleTargetDoctor = rescheduleModalApt
    ? doctors.find((d) => d.id === rescheduleModalApt.medicoId)
    : undefined;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* Top Navigation Bar */}
      <Header
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
        allUsers={allUsers}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationRead}
        onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
        onOpenAuthModal={(m) => {
          setAuthModalMode(m);
          setAuthModalOpen(true);
        }}
        onNavigate={setCurrentView}
        onLogout={handleLogout}
      />

      {/* Main Body with Sidebar + Main Content Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col lg:flex-row">
        <Sidebar
          currentView={currentView}
          onNavigate={(v) => {
            if (v === 'nueva-cita') {
              setPreselectedSpecialtyId(undefined);
              setPreselectedDoctor(undefined);
            }
            setCurrentView(v);
          }}
          currentUser={currentUser}
          activeAppointmentsCount={activeAppointmentsCount}
          onResetData={handleResetData}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {currentView === 'dashboard' && (
            <DashboardView
              currentUser={currentUser}
              upcomingAppointment={upcomingAppointment}
              specialties={specialties}
              doctors={doctors}
              onNavigate={setCurrentView}
              onSelectSpecialtyForBooking={handleStartBookingWithSpecialty}
              onSelectDoctorForBooking={handleStartBookingWithDoctor}
              onOpenReschedule={(apt) => setRescheduleModalApt(apt)}
              onOpenCancel={(apt) => setCancelModalApt(apt)}
            />
          )}

          {currentView === 'nueva-cita' && (
            <NewAppointmentFlow
              specialties={specialties}
              doctors={doctors}
              currentUser={currentUser}
              initialSpecialtyId={preselectedSpecialtyId}
              initialDoctor={preselectedDoctor}
              onAppointmentCreated={(_apt) => {
                // Keep view or user can navigate
              }}
              onCancelBooking={() => setCurrentView('dashboard')}
              onNavigateToMyAppointments={() => setCurrentView('mis-citas')}
            />
          )}

          {currentView === 'mis-citas' && (
            <MyAppointmentsView
              appointments={patientAppointments}
              onOpenReschedule={(apt) => setRescheduleModalApt(apt)}
              onOpenCancel={(apt) => setCancelModalApt(apt)}
              onNavigateToNewAppointment={() => {
                setPreselectedSpecialtyId(undefined);
                setPreselectedDoctor(undefined);
                setCurrentView('nueva-cita');
              }}
            />
          )}

          {currentView === 'especialidades' && (
            <SpecialtiesAndDoctorsView
              specialties={specialties}
              doctors={doctors}
              onSelectSpecialtyForBooking={handleStartBookingWithSpecialty}
              onSelectDoctorForBooking={handleStartBookingWithDoctor}
            />
          )}

          {currentView === 'asistente' && (
            <AIAssistantView
              specialties={specialties}
              doctors={doctors}
              currentUser={currentUser}
              appointments={patientAppointments}
              onSelectSpecialtyForBooking={handleStartBookingWithSpecialty}
              onSelectDoctorForBooking={handleStartBookingWithDoctor}
              onOpenReschedule={(apt) => setRescheduleModalApt(apt)}
              onOpenCancel={(apt) => setCancelModalApt(apt)}
              onNavigate={setCurrentView}
              onAppointmentCreated={refreshData}
            />
          )}

          {currentView === 'portal-medico' && (
            <DoctorPortalView
              currentUser={currentUser}
              doctors={doctors}
              appointments={appointments}
              onSaveMedicalNotes={handleSaveMedicalNotes}
            />
          )}

          {currentView === 'portal-admin' && (
            <AdminPortalView
              appointments={appointments}
              specialties={specialties}
              doctors={doctors}
              users={allUsers}
            />
          )}
        </main>
      </div>

      {/* Cancel Appointment Modal */}
      <CancelModal
        isOpen={!!cancelModalApt}
        appointment={cancelModalApt}
        onClose={() => setCancelModalApt(null)}
        onConfirmCancel={handleCancelAppointment}
      />

      {/* Reschedule Appointment Modal */}
      <RescheduleModal
        isOpen={!!rescheduleModalApt}
        appointment={rescheduleModalApt}
        doctor={rescheduleTargetDoctor}
        onClose={() => setRescheduleModalApt(null)}
        onConfirmReschedule={handleRescheduleAppointment}
      />

      {/* Auth Modal (Login / Register) */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onQuickLoginAs={handleSwitchUser}
        allUsers={allUsers}
      />
    </div>
  );
}
