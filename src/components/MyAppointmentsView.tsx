import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  XCircle,
  FileText,
  Search,
  CalendarPlus,
  ChevronDown,
  Stethoscope,
  Filter,
} from 'lucide-react';
import { Appointment, AppointmentStatus } from '../types';

interface MyAppointmentsViewProps {
  appointments: Appointment[];
  onOpenReschedule: (appointment: Appointment) => void;
  onOpenCancel: (appointment: Appointment) => void;
  onNavigateToNewAppointment: () => void;
}

export const MyAppointmentsView: React.FC<MyAppointmentsViewProps> = ({
  appointments,
  onOpenReschedule,
  onOpenCancel,
  onNavigateToNewAppointment,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('todas');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedNotesId, setExpandedNotesId] = useState<string | null>(null);

  const getStatusBadge = (estado: AppointmentStatus) => {
    switch (estado) {
      case 'confirmada':
        return {
          label: 'Confirmada',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: CheckCircle,
        };
      case 'pendiente':
        return {
          label: 'Pendiente',
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: Clock,
        };
      case 'atendida':
        return {
          label: 'Atendida',
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: Stethoscope,
        };
      case 'cancelada':
        return {
          label: 'Cancelada',
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: XCircle,
        };
    }
  };

  const filtered = appointments.filter((apt) => {
    const matchesStatus = filterStatus === 'todas' || apt.estado === filterStatus;
    const matchesSearch =
      apt.medicoNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.especialidadNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.sede.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const countByStatus = {
    todas: appointments.length,
    confirmada: appointments.filter((a) => a.estado === 'confirmada').length,
    pendiente: appointments.filter((a) => a.estado === 'pendiente').length,
    atendida: appointments.filter((a) => a.estado === 'atendida').length,
    cancelada: appointments.filter((a) => a.estado === 'cancelada').length,
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-sans">
            Mis Citas Médicas
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Historial clínico, citas programadas y seguimiento de consultas
          </p>
        </div>

        <button
          id="my-appointments-new-cta-btn"
          onClick={onNavigateToNewAppointment}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all self-start sm:self-auto"
        >
          <CalendarPlus className="w-4 h-4" />
          <span>Agendar nueva cita</span>
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            {[
              { id: 'todas', label: 'Todas', count: countByStatus.todas },
              { id: 'confirmada', label: 'Confirmadas', count: countByStatus.confirmada },
              { id: 'pendiente', label: 'Pendientes', count: countByStatus.pendiente },
              { id: 'atendida', label: 'Atendidas', count: countByStatus.atendida },
              { id: 'cancelada', label: 'Canceladas', count: countByStatus.cancelada },
            ].map((tab) => (
              <button
                key={tab.id}
                id={`filter-tab-${tab.id}`}
                onClick={() => setFilterStatus(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  filterStatus === tab.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    filterStatus === tab.id ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              id="search-appointments-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por médico, código (#MED)..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Appointments List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <Filter className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No se encontraron citas con este filtro</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Intenta cambiar el criterio de búsqueda o agenda una nueva cita médica.
          </p>
          <button
            onClick={onNavigateToNewAppointment}
            className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
          >
            Agendar cita ahora
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((apt) => {
            const badge = getStatusBadge(apt.estado);
            const StatusIcon = badge.icon;
            const canModify = apt.estado === 'confirmada' || apt.estado === 'pendiente';
            const isNotesExpanded = expandedNotesId === apt.id;

            return (
              <div
                key={apt.id}
                id={`appointment-card-${apt.id}`}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow p-5"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-extrabold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800">
                      {apt.codigo}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${badge.bg}`}
                    >
                      <StatusIcon className="w-3.5 h-3.5" />
                      <span>{badge.label}</span>
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-400">
                    Registrada el {apt.fechaCreacion}
                  </span>
                </div>

                {/* Body row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
                  {/* Doctor */}
                  <div className="flex items-start gap-3">
                    <img
                      src={apt.medicoFoto}
                      alt={apt.medicoNombre}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?auto=format&fit=crop&q=80&w=200';
                      }}
                      className="w-14 h-14 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
                    />
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{apt.medicoNombre}</h3>
                      <p className="text-xs text-blue-600 font-semibold">{apt.especialidadNombre}</p>
                      <p className="text-[11px] text-slate-500">{apt.medicoColegiatura}</p>
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="space-y-1 text-xs">
                    <p className="text-slate-400 font-medium uppercase text-[10px] tracking-wider">Fecha & Horario</p>
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      <span>{apt.fechaFormateada}</span>
                    </p>
                    <p className="text-blue-700 font-semibold flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{apt.hora}</span>
                    </p>
                  </div>

                  {/* Venue */}
                  <div className="space-y-1 text-xs">
                    <p className="text-slate-400 font-medium uppercase text-[10px] tracking-wider">Lugar de Atención</p>
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-cyan-600" />
                      <span>{apt.sede}</span>
                    </p>
                    <p className="text-slate-500">{apt.consultorio}</p>
                  </div>
                </div>

                {/* Motivo registrado */}
                <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100 text-xs">
                  <span className="font-semibold text-slate-700">Motivo de consulta: </span>
                  <span className="text-slate-600">"{apt.motivo}"</span>
                </div>

                {/* Cancelled note if applicable */}
                {apt.estado === 'cancelada' && apt.motivoCancelacion && (
                  <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Motivo de cancelación: </span>
                      <span>{apt.motivoCancelacion}</span>
                    </div>
                  </div>
                )}

                {/* Doctor notes and prescription for attended appointments */}
                {apt.estado === 'atendida' && (apt.notasMedicas || apt.recetaMedica) && (
                  <div className="mt-3">
                    <button
                      onClick={() => setExpandedNotesId(isNotesExpanded ? null : apt.id)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 py-1"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{isNotesExpanded ? 'Ocultar informe médico y receta' : 'Ver informe médico y receta emitida'}</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isNotesExpanded ? 'rotate-180' : ''}`} />
                    </button>

                    {isNotesExpanded && (
                      <div className="mt-2 p-3.5 bg-blue-50/50 rounded-xl border border-blue-100 text-xs space-y-2 animate-in fade-in">
                        {apt.notasMedicas && (
                          <div>
                            <span className="font-bold text-slate-800">Diagnóstico / Observaciones:</span>
                            <p className="text-slate-700 mt-0.5">{apt.notasMedicas}</p>
                          </div>
                        )}
                        {apt.recetaMedica && (
                          <div className="pt-2 border-t border-blue-100">
                            <span className="font-bold text-slate-800">Receta / Indicaciones Farmacológicas:</span>
                            <p className="text-slate-700 mt-0.5">{apt.recetaMedica}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Actions Footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-slate-500">
                    Copago estimado: <strong className="text-slate-800">S/. {apt.copago}.00</strong> (Cobertura Sura 80%)
                  </div>

                  <div className="flex items-center gap-2">
                    {canModify && (
                      <>
                        <button
                          id={`reschedule-btn-${apt.id}`}
                          onClick={() => onOpenReschedule(apt)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1.5"
                        >
                          <RotateCcw className="w-3 h-3 text-slate-500" />
                          <span>Reprogramar</span>
                        </button>
                        <button
                          id={`cancel-btn-${apt.id}`}
                          onClick={() => onOpenCancel(apt)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center gap-1.5"
                        >
                          <XCircle className="w-3 h-3 text-rose-500" />
                          <span>Cancelar</span>
                        </button>
                      </>
                    )}
                    {apt.estado === 'cancelada' && (
                      <button
                        onClick={onNavigateToNewAppointment}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors"
                      >
                        Reagendar cita
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
