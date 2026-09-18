import React from 'react';
import {
  CalendarPlus,
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Star,
  ChevronRight,
  HeartPulse,
  Baby,
  Stethoscope,
  Smile,
  Activity,
  UserCheck,
} from 'lucide-react';
import { Appointment, Doctor, Specialty, User } from '../types';

interface DashboardViewProps {
  currentUser: User;
  upcomingAppointment?: Appointment;
  specialties: Specialty[];
  doctors: Doctor[];
  onNavigate: (view: string) => void;
  onSelectSpecialtyForBooking: (specialtyId: string) => void;
  onSelectDoctorForBooking: (doctor: Doctor) => void;
  onOpenReschedule: (appointment: Appointment) => void;
  onOpenCancel: (appointment: Appointment) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser,
  upcomingAppointment,
  specialties,
  doctors,
  onNavigate,
  onSelectSpecialtyForBooking,
  onSelectDoctorForBooking,
  onOpenReschedule,
  onOpenCancel,
}) => {
  const getSpecialtyIcon = (iconName: string) => {
    switch (iconName) {
      case 'HeartPulse':
        return <HeartPulse className="w-6 h-6 text-rose-600" />;
      case 'Baby':
        return <Baby className="w-6 h-6 text-blue-600" />;
      case 'Stethoscope':
        return <Stethoscope className="w-6 h-6 text-cyan-600" />;
      case 'Sparkles':
        return <Sparkles className="w-6 h-6 text-violet-600" />;
      case 'Smile':
        return <Smile className="w-6 h-6 text-amber-600" />;
      default:
        return <Activity className="w-6 h-6 text-emerald-600" />;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-600 text-white p-6 sm:p-8 shadow-lg shadow-blue-500/15">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-xs font-semibold tracking-wide uppercase mb-3 text-blue-100">
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            <span>Sistema Inteligente MediCita</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-sans">
            ¡Hola, {currentUser.nombre}! 👋
          </h1>
          <p className="mt-2 text-blue-100 text-sm sm:text-base leading-relaxed">
            Tu salud en buenas manos. Agenda consultas médicas en menos de 2 minutos, revisa la disponibilidad en tiempo real de tus especialistas y recibe recordatorios clínicos personalizados.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              id="hero-new-appointment-btn"
              onClick={() => onNavigate('nueva-cita')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-sm shadow-md transition-all active:scale-95"
            >
              <CalendarPlus className="w-4 h-4 text-blue-600" />
              <span>Agendar cita ahora</span>
            </button>
            <button
              id="hero-ai-triage-btn"
              onClick={() => onNavigate('asistente')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-800/60 hover:bg-blue-800/80 border border-blue-400/30 text-white font-semibold text-sm transition-all"
            >
              <Sparkles className="w-4 h-4 text-cyan-300" />
              <span>Gestionar citas con IA</span>
            </button>
          </div>
        </div>

        {/* Decorative background vectors */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-80 h-80 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute right-20 top-4 opacity-15 hidden lg:block pointer-events-none">
          <Stethoscope className="w-56 h-56 text-white" />
        </div>
      </div>

      {/* Featured Card: Próxima Cita Programada */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 font-sans flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span>Tu Próxima Cita Programada</span>
          </h2>
          {upcomingAppointment && (
            <button
              id="view-all-appointments-btn"
              onClick={() => onNavigate('mis-citas')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
            >
              <span>Ver todas mis citas</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {upcomingAppointment ? (
          <div
            id="featured-appointment-card"
            className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow p-5 sm:p-6"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 border-b border-slate-100 pb-5">
              {/* Doctor and specialty info */}
              <div className="flex items-start gap-4">
                <img
                  src={upcomingAppointment.medicoFoto}
                  alt={upcomingAppointment.medicoNombre}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?auto=format&fit=crop&q=80&w=200';
                  }}
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-slate-100 shadow-xs shrink-0"
                />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {upcomingAppointment.codigo}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        upcomingAppointment.estado === 'confirmada'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      <CheckCircle className="w-3 h-3" />
                      <span className="capitalize">{upcomingAppointment.estado}</span>
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                    {upcomingAppointment.medicoNombre}
                  </h3>
                  <p className="text-xs sm:text-sm font-medium text-blue-600">
                    {upcomingAppointment.especialidadNombre} • {upcomingAppointment.medicoColegiatura}
                  </p>
                </div>
              </div>

              {/* Date, Time & Venue */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Fecha y Hora</p>
                    <p className="text-xs sm:text-sm font-bold text-slate-900">{upcomingAppointment.fechaFormateada}</p>
                    <p className="text-xs font-semibold text-blue-600 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>{upcomingAppointment.hora}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Sede y Consultorio</p>
                    <p className="text-xs sm:text-sm font-bold text-slate-900">{upcomingAppointment.sede}</p>
                    <p className="text-xs text-slate-600 mt-0.5">{upcomingAppointment.consultorio}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Preparation notice */}
            {upcomingAppointment.indicacionesClinicas && upcomingAppointment.indicacionesClinicas.length > 0 && (
              <div className="mt-4 p-3.5 bg-amber-50/80 rounded-xl border border-amber-200/70 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900">
                  <span className="font-bold">Indicaciones clínicas previas: </span>
                  {upcomingAppointment.indicacionesClinicas.join(' • ')}
                </div>
              </div>
            )}

            {/* Actions for this appointment */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Copago cubierto al 80% por {currentUser.seguroEps}</span>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  id="dashboard-reschedule-btn"
                  onClick={() => onOpenReschedule(upcomingAppointment)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Reprogramar fecha
                </button>
                <button
                  id="dashboard-cancel-btn"
                  onClick={() => onOpenCancel(upcomingAppointment)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
                >
                  Cancelar cita
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <CalendarPlus className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No tienes citas médicas pendientes</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Programa tu chequeo preventivo o consulta especializada en Medicina General, Cardiología, Dermatología y más.
            </p>
            <button
              onClick={() => onNavigate('nueva-cita')}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs"
            >
              <CalendarPlus className="w-4 h-4" />
              <span>Agendar mi primera cita</span>
            </button>
          </div>
        )}
      </div>

      {/* Grid: Especialidades Médicas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-sans">Especialidades Médicas</h2>
            <p className="text-xs text-slate-500">Selecciona el servicio clínico que necesitas consultar</p>
          </div>
          <button
            onClick={() => onNavigate('especialidades')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
          >
            <span>Ver catálogo</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {specialties.map((esp) => (
            <div
              key={esp.id}
              id={`specialty-card-${esp.id}`}
              onClick={() => onSelectSpecialtyForBooking(esp.id)}
              className="group bg-white rounded-2xl border border-slate-200 p-4 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                    {getSpecialtyIcon(esp.icono)}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                    {esp.doctoresCount} médicos
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                  {esp.nombre}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                  {esp.descripcion}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">
                  Desde S/. {esp.precioBase} <span className="font-normal text-slate-400 text-[10px]">/ consulta</span>
                </span>
                <span className="text-blue-600 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  <span>Agendar</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid: Médicos Destacados con Disponibilidad Inmediata */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-sans">Especialistas con Disponibilidad</h2>
            <p className="text-xs text-slate-500">Médicos de staff con turnos libres esta semana</p>
          </div>
          <button
            onClick={() => onNavigate('especialidades')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
          >
            <span>Ver todos los médicos</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {doctors.slice(0, 4).map((doc) => {
            const nextDay = doc.disponibilidad[0];
            return (
              <div
                key={doc.id}
                id={`doctor-card-${doc.id}`}
                className="bg-white rounded-2xl border border-slate-200 p-4 hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div className="flex items-start gap-3.5">
                  <img
                    src={doc.fotoUrl}
                    alt={doc.nombre}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?auto=format&fit=crop&q=80&w=400';
                    }}
                    className="w-14 h-14 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-blue-600 uppercase tracking-wide truncate">
                        {doc.especialidadNombre}
                      </span>
                      <div className="flex items-center gap-1 text-xs font-bold text-slate-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100 shrink-0">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        <span>{doc.calificacion}</span>
                        <span className="text-slate-400 font-normal text-[10px]">({doc.opinionesCount})</span>
                      </div>
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 truncate mt-0.5">{doc.nombre}</h4>
                    <p className="text-xs text-slate-500 truncate">{doc.colegiatura} • {doc.experiencia}</p>
                    <p className="text-xs text-slate-600 flex items-center gap-1 mt-1 truncate">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{doc.sede} ({doc.consultorio})</span>
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="text-xs">
                    <span className="text-slate-500 text-[11px] block">Próximo cupo libre:</span>
                    <span className="font-bold text-slate-900">
                      {nextDay ? `${nextDay.diaNombre} ${nextDay.diaNumero}` : 'Esta semana'}
                    </span>
                  </div>

                  <button
                    id={`book-with-doc-${doc.id}`}
                    onClick={() => onSelectDoctorForBooking(doc)}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <span>Seleccionar horario</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
