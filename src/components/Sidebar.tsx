import React, { useState } from 'react';
import {
  LayoutDashboard,
  CalendarPlus,
  CalendarDays,
  Stethoscope,
  Sparkles,
  ClipboardList,
  ShieldAlert,
  PhoneCall,
  RotateCcw,
  Shield,
  ChevronRight,
  Check,
  X,
} from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  currentUser: User;
  activeAppointmentsCount: number;
  onResetData: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  currentUser,
  activeAppointmentsCount,
  onResetData,
}) => {
  const isPatient = currentUser.rol === 'paciente';
  const isDoctor = currentUser.rol === 'medico';
  const isAdmin = currentUser.rol === 'admin';
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  return (
    <aside className="w-full lg:w-64 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col justify-between shrink-0 p-3 sm:p-4">
      <div className="space-y-4 lg:space-y-6">
        {/* Action Button: Nueva Cita */}
        {isPatient && (
          <div>
            <button
              id="sidebar-new-appointment-btn"
              onClick={() => onNavigate('nueva-cita')}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all active:scale-[0.98]"
            >
              <CalendarPlus className="w-4 h-4" />
              <span>Agendar Nueva Cita</span>
            </button>
          </div>
        )}

        {/* Navigation Links - responsive scrollable on mobile, column on desktop */}
        <nav
          className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible pb-1 lg:pb-0 no-scrollbar"
          aria-label="Navegación principal"
        >
          <button
            id="nav-dashboard-btn"
            onClick={() => onNavigate('dashboard')}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all text-left whitespace-nowrap shrink-0 lg:shrink lg:w-full ${
              currentView === 'dashboard'
                ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className={`w-4 h-4 ${currentView === 'dashboard' ? 'text-blue-600' : 'text-slate-400'}`} />
            <span>Inicio / Resumen</span>
          </button>

          {isPatient && (
            <>
              <button
                id="nav-my-appointments-btn"
                onClick={() => onNavigate('mis-citas')}
                className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all text-left whitespace-nowrap shrink-0 lg:shrink lg:w-full ${
                  currentView === 'mis-citas'
                    ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <CalendarDays className={`w-4 h-4 ${currentView === 'mis-citas' ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>Mis Citas</span>
                </div>
                {activeAppointmentsCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-blue-100 text-blue-700">
                    {activeAppointmentsCount}
                  </span>
                )}
              </button>

              <button
                id="nav-specialties-btn"
                onClick={() => onNavigate('especialidades')}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all text-left whitespace-nowrap shrink-0 lg:shrink lg:w-full ${
                  currentView === 'especialidades'
                    ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Stethoscope className={`w-4 h-4 ${currentView === 'especialidades' ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>Especialidades y Médicos</span>
              </button>

              <button
                id="nav-ai-assistant-btn"
                onClick={() => onNavigate('asistente')}
                className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all text-left whitespace-nowrap shrink-0 lg:shrink lg:w-full ${
                  currentView === 'asistente'
                    ? 'bg-cyan-50 text-cyan-800 font-semibold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className={`w-4 h-4 ${currentView === 'asistente' ? 'text-cyan-600' : 'text-cyan-500'}`} />
                  <span>Asistente de Citas IA</span>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-cyan-100 text-cyan-800 hidden sm:inline">
                  Gestión
                </span>
              </button>
            </>
          )}

          {/* Doctor View Item */}
          {(isDoctor || isAdmin) && (
            <div className="lg:pt-2 flex lg:flex-col items-center lg:items-stretch gap-1">
              <div className="hidden lg:block px-3 pb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Panel Especialista
              </div>
              <button
                id="nav-doctor-portal-btn"
                onClick={() => onNavigate('portal-medico')}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all text-left whitespace-nowrap shrink-0 lg:shrink lg:w-full ${
                  currentView === 'portal-medico'
                    ? 'bg-emerald-50 text-emerald-800 font-semibold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <ClipboardList className={`w-4 h-4 ${currentView === 'portal-medico' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>Agenda del Médico</span>
              </button>
            </div>
          )}

          {/* Admin View Item */}
          {isAdmin && (
            <div className="lg:pt-2 flex lg:flex-col items-center lg:items-stretch gap-1">
              <div className="hidden lg:block px-3 pb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Administración
              </div>
              <button
                id="nav-admin-portal-btn"
                onClick={() => onNavigate('portal-admin')}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all text-left whitespace-nowrap shrink-0 lg:shrink lg:w-full ${
                  currentView === 'portal-admin'
                    ? 'bg-purple-50 text-purple-800 font-semibold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <ShieldAlert className={`w-4 h-4 ${currentView === 'portal-admin' ? 'text-purple-600' : 'text-slate-400'}`} />
                <span>Panel de Control Admin</span>
              </button>
            </div>
          )}
        </nav>
      </div>

      {/* Bottom Information Cards (desktop-focused to avoid pushing mobile layout down) */}
      <div className="hidden lg:block space-y-4 pt-4 border-t border-slate-100">
        {/* Insurance Coverage Pill */}
        {isPatient && currentUser.seguroEps && (
          <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-2xl border border-blue-100">
            <div className="flex items-center gap-2 text-blue-900 font-semibold text-xs mb-1">
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              <span>{currentUser.seguroEps}</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-snug">
              Afiliación: <span className="font-mono font-medium text-slate-800">{currentUser.numeroAfiliacion}</span>
            </p>
            <div className="mt-2 pt-2 border-t border-blue-200/50 flex items-center justify-between text-[11px] text-blue-700">
              <span>{currentUser.planSalud || 'Cobertura 80%'}</span>
              <ChevronRight className="w-3 h-3 text-blue-400" />
            </div>
          </div>
        )}

        {/* Emergency Assistance Hotline */}
        <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <PhoneCall className="w-3.5 h-3.5 text-rose-500" />
            <span className="font-medium">Central Médica:</span>
          </div>
          <span className="font-bold text-slate-900 font-mono">(01) 619-9000</span>
        </div>

        {/* Prototipo Reset helper without window.confirm */}
        {showResetConfirm ? (
          <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-xs space-y-2 animate-in fade-in">
            <p className="font-semibold text-amber-900 text-[11px] text-center">
              ¿Restablecer datos ficticios del prototipo?
            </p>
            <div className="flex gap-1.5">
              <button
                onClick={() => {
                  setShowResetConfirm(false);
                  onResetData();
                }}
                className="flex-1 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[10px] flex items-center justify-center gap-1"
              >
                <Check className="w-3 h-3" />
                <span>Sí, reiniciar</span>
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-2 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-[10px] font-medium"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        ) : (
          <button
            id="sidebar-reset-data-btn"
            onClick={() => setShowResetConfirm(true)}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-medium text-slate-400 hover:text-slate-600 hover:underline transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Restablecer datos del prototipo</span>
          </button>
        )}
      </div>
    </aside>
  );
};
