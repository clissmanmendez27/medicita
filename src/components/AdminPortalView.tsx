import React, { useState } from 'react';
import {
  ShieldAlert,
  Users,
  Calendar,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Search,
  Filter,
} from 'lucide-react';
import { Appointment, Specialty, Doctor, User } from '../types';
import { BackendDataLayerPanel } from './BackendDataLayerPanel';

interface AdminPortalViewProps {
  appointments: Appointment[];
  specialties: Specialty[];
  doctors: Doctor[];
  users: User[];
}

export const AdminPortalView: React.FC<AdminPortalViewProps> = ({
  appointments,
  specialties,
  doctors,
  users,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('todas');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const adminUser = users.find((u) => u.rol === 'admin') || {
    nombre: 'Clisman',
    apellidos: 'Mendez',
    email: 'clisman.mendez@medicita.com',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
  };

  const total = appointments.length;
  const confirmadas = appointments.filter((a) => a.estado === 'confirmada').length;
  const atendidas = appointments.filter((a) => a.estado === 'atendida').length;
  const pendientes = appointments.filter((a) => a.estado === 'pendiente').length;
  const canceladas = appointments.filter((a) => a.estado === 'cancelada').length;

  const occupancyRate = total > 0 ? Math.round(((confirmadas + atendidas) / (total + 5)) * 100) : 78;

  const filteredAppointments = appointments.filter((a) => {
    const matchesStatus = filterStatus === 'todas' || a.estado === filterStatus;
    const matchesSearch =
      a.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.pacienteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.medicoNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.especialidadNombre.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-800 via-purple-700 to-indigo-800 text-white p-6 rounded-3xl shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-200">
            <ShieldAlert className="w-4 h-4" />
            <span>Panel de Administración y Control Clínico</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold font-sans mt-1">
            MediCita Analytics & Operaciones
          </h1>
          <p className="text-xs text-purple-100 mt-1">
            Monitoreo en tiempo real de capacidad instalada, consultas agendadas y flujo de pacientes
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15 self-start sm:self-auto">
          <img
            src={adminUser.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200'}
            alt={`${adminUser.nombre} ${adminUser.apellidos}`}
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200';
            }}
            className="w-11 h-11 rounded-xl object-cover ring-2 ring-purple-300/40 shrink-0"
          />
          <div className="text-left">
            <span className="text-[10px] font-bold text-purple-200 uppercase tracking-wider block">
              Administrador General
            </span>
            <p className="text-sm font-bold text-white leading-tight">
              {adminUser.nombre} {adminUser.apellidos}
            </p>
            <span className="text-[11px] text-purple-200 block">
              {adminUser.email}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Citas Registradas</span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{total}</p>
          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
            <TrendingUp className="w-3 h-3" /> +14% vs mes anterior
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Tasa de Ocupación</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">{occupancyRate}%</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Capacidad de consultorios</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Citas Atendidas</span>
            <CheckCircle className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-blue-700 mt-2">{atendidas}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Con informe médico</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Cancelaciones</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-rose-600 mt-2">{canceladas}</p>
          <span className="text-[11px] text-rose-500 mt-1 block">Cupos reliberados</span>
        </div>
      </div>

      {/* Specialties demand overview */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
        <h3 className="font-bold text-sm text-slate-900 font-sans">
          Capacidad y Demanda por Especialidad
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {specialties.map((esp) => {
            const count = appointments.filter((a) => a.especialidadId === esp.id).length;
            return (
              <div key={esp.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <span className="font-bold text-slate-900 block truncate">{esp.nombre}</span>
                <span className="text-slate-500 text-[11px]">{esp.doctoresCount} médicos</span>
                <p className="font-extrabold text-blue-700 text-base mt-1">{count} citas</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Backend & Data Layer Panel */}
      <BackendDataLayerPanel />

      {/* Master appointments list */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-base text-slate-900 font-sans">
              Registro General de Citas del Sistema
            </h3>
            <p className="text-xs text-slate-500">
              Vista centralizada de citas de todos los consultorios y especialidades
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar paciente, código, médico..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs font-semibold">
          {['todas', 'confirmada', 'pendiente', 'atendida', 'cancelada'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1 rounded-lg capitalize transition-all ${
                filterStatus === st
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-y border-slate-200 text-slate-500 uppercase font-bold text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Código</th>
                <th className="py-2.5 px-3">Paciente</th>
                <th className="py-2.5 px-3">Especialista</th>
                <th className="py-2.5 px-3">Especialidad</th>
                <th className="py-2.5 px-3">Fecha & Hora</th>
                <th className="py-2.5 px-3">Sede</th>
                <th className="py-2.5 px-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAppointments.map((apt) => (
                <tr key={apt.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-slate-800">{apt.codigo}</td>
                  <td className="py-3 px-3 font-medium text-slate-900">{apt.pacienteNombre}</td>
                  <td className="py-3 px-3 font-medium text-slate-700">{apt.medicoNombre}</td>
                  <td className="py-3 px-3 text-blue-700 font-semibold">{apt.especialidadNombre}</td>
                  <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                    {apt.fechaFormateada} - <strong>{apt.hora}</strong>
                  </td>
                  <td className="py-3 px-3 text-slate-500">{apt.sede}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                        apt.estado === 'confirmada'
                          ? 'bg-emerald-100 text-emerald-800'
                          : apt.estado === 'atendida'
                          ? 'bg-blue-100 text-blue-800'
                          : apt.estado === 'pendiente'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {apt.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
