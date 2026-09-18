import React, { useState } from 'react';
import {
  Bell,
  CheckCircle,
  Calendar,
  AlertTriangle,
  LogOut,
  ChevronDown,
  UserCheck,
  Stethoscope,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { User, NotificationAlert } from '../types';

interface HeaderProps {
  currentUser: User;
  onSwitchUser: (user: User) => void;
  allUsers: User[];
  notifications: NotificationAlert[];
  onMarkNotificationRead: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
  onOpenAuthModal: (mode: 'login' | 'register') => void;
  onNavigate: (view: string) => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onSwitchUser,
  allUsers,
  notifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onOpenAuthModal,
  onNavigate,
  onLogout,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const unreadCount = notifications.filter((n) => !n.leida).length;

  const getRoleBadge = (rol: string) => {
    switch (rol) {
      case 'medico':
        return {
          label: 'Médico Especialista',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: Stethoscope,
        };
      case 'admin':
        return {
          label: 'Administrador Clínico',
          bg: 'bg-purple-50 text-purple-700 border-purple-200',
          icon: ShieldCheck,
        };
      default:
        return {
          label: 'Paciente Afiliado',
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: UserCheck,
        };
    }
  };

  const roleInfo = getRoleBadge(currentUser.rol);
  const RoleIcon = roleInfo.icon;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo & Mobile Brand */}
        <div className="flex items-center gap-3">
          <button
            id="brand-logo-btn"
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2.5 text-left focus:outline-hidden group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xl tracking-tight text-slate-900 font-sans">Medi<span className="text-blue-600">Cita</span></span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  Prototipo
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Gestión Inteligente de Citas Médicas</p>
            </div>
          </button>

          <button
            type="button"
            id="header-backend-btn"
            onClick={() => onNavigate('admin')}
            className="hidden md:inline-flex items-center gap-1 text-[10px] font-semibold tracking-wider uppercase px-2 py-1 rounded-full bg-purple-100 hover:bg-purple-200 text-purple-800 transition-colors self-center"
            title="Ver capa de servicios backend y esquema Prisma ORM"
          >
            <span>Backend & Prisma</span>
          </button>
        </div>

        {/* Center Quick Switch for Demonstrating Roles */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100/90 rounded-full border border-slate-200 text-xs">
          <span className="text-slate-500 font-medium pl-1">Rol activo:</span>
          {allUsers.slice(0, 3).map((u) => {
            const isActive = u.id === currentUser.id;
            return (
              <button
                key={u.id}
                id={`quick-switch-${u.rol}`}
                onClick={() => onSwitchUser(u)}
                className={`px-2.5 py-1 rounded-full font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
              >
                {u.rol === 'paciente' ? 'Paciente' : u.rol === 'medico' ? 'Médico' : 'Admin'}
              </button>
            );
          })}
        </div>

        {/* Right Actions: Assistant Pill, Notifications, User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* AI Assistant Quick Pill */}
          <button
            id="header-ai-assistant-btn"
            onClick={() => onNavigate('asistente')}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-800 hover:bg-cyan-100 text-xs font-semibold transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-600 animate-pulse" />
            <span>Asistente IA</span>
          </button>

          {/* Notifications Trigger */}
          <div className="relative">
            <button
              id="notifications-bell-btn"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
              aria-label="Ver notificaciones"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white animate-in zoom-in">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown Panel */}
            {showNotifications && (
              <div
                id="notifications-dropdown-menu"
                className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150"
              >
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-sm text-slate-900">Alertas y Notificaciones</h4>
                    <p className="text-xs text-slate-500">
                      {unreadCount} {unreadCount === 1 ? 'alerta pendiente' : 'alertas pendientes'}
                    </p>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      id="mark-all-read-btn"
                      onClick={() => onMarkAllNotificationsRead()}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      Marcar leídas
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-sm text-slate-400">
                      No tienes notificaciones pendientes.
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => onMarkNotificationRead(notif.id)}
                        className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors flex items-start gap-3 ${
                          !notif.leida ? 'bg-blue-50/40' : ''
                        }`}
                      >
                        <div className="shrink-0 mt-0.5">
                          {notif.tipo === 'cita_confirmada' && (
                            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                              <CheckCircle className="w-4 h-4" />
                            </div>
                          )}
                          {notif.tipo === 'cita_cancelada' && (
                            <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">
                              <X className="w-4 h-4" />
                            </div>
                          )}
                          {notif.tipo === 'cita_reprogramada' && (
                            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                              <Calendar className="w-4 h-4" />
                            </div>
                          )}
                          {notif.tipo === 'recordatorio' && (
                            <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                              <AlertTriangle className="w-4 h-4" />
                            </div>
                          )}
                          {(notif.tipo === 'laboratorio' || notif.tipo === 'asistente') && (
                            <div className="w-7 h-7 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center">
                              <Sparkles className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h5 className={`text-xs font-semibold truncate ${!notif.leida ? 'text-slate-900' : 'text-slate-700'}`}>
                              {notif.titulo}
                            </h5>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap">{notif.hora}</span>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                            {notif.mensaje}
                          </p>
                        </div>
                        {!notif.leida && (
                          <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center">
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-xs text-slate-600 hover:text-slate-900 font-medium"
                  >
                    Cerrar panel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Menu */}
          <div className="relative">
            <button
              id="user-profile-trigger-btn"
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-xl hover:bg-slate-100 border border-slate-200 transition-all text-left"
            >
              <img
                src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120'}
                alt={currentUser.nombre}
                className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200"
              />
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-slate-900 leading-none truncate max-w-[120px]">
                  {currentUser.nombre} {currentUser.apellidos.split(' ')[0]}
                </p>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5 capitalize">
                  {currentUser.rol}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {showUserDropdown && (
              <div
                id="user-profile-dropdown"
                className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="p-3 border-b border-slate-100 bg-slate-50/70 rounded-xl mb-1">
                  <div className="flex items-center gap-2">
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.nombre}
                      className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-slate-900 truncate">
                        {currentUser.nombre} {currentUser.apellidos}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
                    </div>
                  </div>
                  <div className={`mt-2.5 px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 ${roleInfo.bg}`}>
                    <RoleIcon className="w-3.5 h-3.5" />
                    <span>{roleInfo.label}</span>
                  </div>
                  {currentUser.dni && (
                    <p className="text-[11px] text-slate-500 mt-2">
                      <span className="font-semibold text-slate-700">DNI:</span> {currentUser.dni} •{' '}
                      <span className="font-semibold text-slate-700">EPS:</span> {currentUser.seguroEps || 'Particular'}
                    </p>
                  )}
                </div>

                <div className="p-1">
                  <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400 px-3 py-1.5">
                    Cambiar modo de vista:
                  </div>
                  {allUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        onSwitchUser(u);
                        setShowUserDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                        u.id === currentUser.id ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="truncate">
                        {u.nombre} ({u.rol === 'paciente' ? 'Paciente' : u.rol === 'medico' ? 'Médico' : 'Admin'})
                      </span>
                      {u.id === currentUser.id && <CheckCircle className="w-3.5 h-3.5 text-blue-600" />}
                    </button>
                  ))}
                </div>

                <div className="border-t border-slate-100 mt-1 pt-1">
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onOpenAuthModal('login');
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <UserCheck className="w-4 h-4 text-slate-400" />
                    <span>Iniciar sesión con otra cuenta</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onOpenAuthModal('register');
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4 text-slate-400" />
                    <span>Registrar nuevo paciente</span>
                  </button>
                  <button
                    id="user-logout-btn"
                    onClick={() => {
                      setShowUserDropdown(false);
                      if (onLogout) {
                        onLogout();
                      } else {
                        onOpenAuthModal('login');
                      }
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
