import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  UserCheck,
  FileText,
  CheckCircle,
  Stethoscope,
  ChevronDown,
  Save,
  AlertCircle,
  MapPin,
  Pill,
} from 'lucide-react';
import { Appointment, Doctor, User } from '../types';

interface DoctorPortalViewProps {
  currentUser: User;
  doctors: Doctor[];
  appointments: Appointment[];
  onSaveMedicalNotes: (
    appointmentId: string,
    notes: string,
    receta: string
  ) => Promise<void>;
}

export const DoctorPortalView: React.FC<DoctorPortalViewProps> = ({
  currentUser,
  doctors,
  appointments,
  onSaveMedicalNotes,
}) => {
  // Find doctor profile corresponding to user or pick first doctor
  const currentDoctor =
    doctors.find((d) => d.id === currentUser.doctorProfileId) || doctors[0];

  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(currentDoctor.id);

  useEffect(() => {
    if (currentUser.doctorProfileId) {
      setSelectedDoctorId(currentUser.doctorProfileId);
    }
  }, [currentUser.doctorProfileId]);

  const activeDoc = doctors.find((d) => d.id === selectedDoctorId) || currentDoctor;

  const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null);
  const [medicalNotes, setMedicalNotes] = useState<string>('');
  const [prescription, setPrescription] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Doctor's appointments
  const doctorAppointments = appointments.filter((a) => a.medicoId === activeDoc.id);

  const handleStartAttending = (apt: Appointment) => {
    setEditingAppointmentId(apt.id);
    setMedicalNotes(apt.notasMedicas || '');
    setPrescription(apt.recetaMedica || '');
    setSuccessMsg('');
  };

  const handleSaveNotes = async (appointmentId: string) => {
    setIsSaving(true);
    try {
      await onSaveMedicalNotes(appointmentId, medicalNotes, prescription);
      setSuccessMsg('Atención registrada y receta médica emitida con éxito.');
      setTimeout(() => {
        setEditingAppointmentId(null);
        setSuccessMsg('');
      }, 1500);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 text-white p-6 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={activeDoc.fotoUrl}
            alt={activeDoc.nombre}
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?auto=format&fit=crop&q=80&w=400';
            }}
            className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white/30 shrink-0"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/20 text-emerald-100 uppercase tracking-wider">
                Portal Médico Clínico
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold font-sans mt-0.5">
              {activeDoc.nombre}
            </h1>
            <p className="text-xs text-emerald-100">
              {activeDoc.especialidadNombre} • {activeDoc.colegiatura} • {activeDoc.sede} ({activeDoc.consultorio})
            </p>
          </div>
        </div>

        {/* Doctor Switcher for Testing */}
        <div className="bg-black/20 p-2.5 rounded-2xl border border-white/20 text-xs">
          <label className="block text-[10px] uppercase font-bold text-emerald-200 mb-1">
            Simular vista de otro médico:
          </label>
          <select
            value={activeDoc.id}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            className="bg-white text-slate-800 font-semibold px-3 py-1.5 rounded-xl text-xs focus:outline-hidden"
          >
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nombre} ({d.especialidadNombre})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <span className="text-xs text-slate-500 font-medium">Total de citas asignadas</span>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{doctorAppointments.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <span className="text-xs text-slate-500 font-medium">Citas por atender / confirmadas</span>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">
            {doctorAppointments.filter((a) => a.estado === 'confirmada').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <span className="text-xs text-slate-500 font-medium">Pacientes ya atendidos</span>
          <p className="text-2xl font-extrabold text-blue-600 mt-1">
            {doctorAppointments.filter((a) => a.estado === 'atendida').length}
          </p>
        </div>
      </div>

      {/* Agenda & Patient List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 font-sans">
          Agenda de Pacientes de {activeDoc.nombre}
        </h2>

        {doctorAppointments.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-400 text-xs">
            No hay citas programadas actualmente para este médico.
          </div>
        ) : (
          <div className="space-y-4">
            {doctorAppointments.map((apt) => {
              const isEditing = editingAppointmentId === apt.id;

              return (
                <div
                  key={apt.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-bold px-2.5 py-1 bg-slate-100 rounded-lg text-slate-700">
                        {apt.codigo}
                      </span>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full capitalize ${
                          apt.estado === 'atendida'
                            ? 'bg-blue-100 text-blue-800'
                            : apt.estado === 'confirmada'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {apt.estado}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-600">
                      <span className="flex items-center gap-1 font-semibold text-slate-900">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        <span>{apt.fechaFormateada}</span>
                      </span>
                      <span className="flex items-center gap-1 font-bold text-blue-700">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{apt.hora}</span>
                      </span>
                    </div>
                  </div>

                  {/* Patient Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-slate-400 font-medium uppercase text-[10px]">Paciente:</span>
                      <p className="font-bold text-slate-900 text-sm">{apt.pacienteNombre}</p>
                      <p className="text-slate-500">DNI: {apt.pacienteDni}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium uppercase text-[10px]">Contacto:</span>
                      <p className="font-semibold text-slate-800">{apt.pacienteTelefono}</p>
                      <p className="text-slate-500">{apt.pacienteEmail}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium uppercase text-[10px]">Sede de Atención:</span>
                      <p className="font-semibold text-slate-800">{apt.sede}</p>
                      <p className="text-slate-500">{apt.consultorio}</p>
                    </div>
                  </div>

                  {/* Reason stated by patient */}
                  <div className="text-xs">
                    <span className="font-bold text-slate-700">Motivo registrado por el paciente: </span>
                    <span className="text-slate-600 italic">"{apt.motivo}"</span>
                  </div>

                  {/* Clinical Editor if attending */}
                  {isEditing ? (
                    <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200 space-y-3 animate-in fade-in">
                      <h4 className="font-bold text-xs text-blue-950 uppercase tracking-wide flex items-center gap-1.5">
                        <Stethoscope className="w-4 h-4 text-blue-600" />
                        <span>Registro de Consulta y Receta Médica</span>
                      </h4>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Diagnóstico clínico y notas médicas:
                        </label>
                        <textarea
                          rows={2}
                          value={medicalNotes}
                          onChange={(e) => setMedicalNotes(e.target.value)}
                          placeholder="Escribe el diagnóstico, observaciones clínicas o plan de seguimiento..."
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Prescripción farmacológica / Receta médica:
                        </label>
                        <textarea
                          rows={2}
                          value={prescription}
                          onChange={(e) => setPrescription(e.target.value)}
                          placeholder="Medicamentos, dosis, frecuencia y días de tratamiento..."
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {successMsg && (
                        <p className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          <span>{successMsg}</span>
                        </p>
                      )}

                      <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setEditingAppointmentId(null)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-white border border-slate-200"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => handleSaveNotes(apt.id)}
                          className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-1.5 shadow-xs"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>{isSaving ? 'Guardando...' : 'Guardar y Marcar Atendida'}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div>
                        {apt.notasMedicas && (
                          <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Informe médico registrado</span>
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleStartAttending(apt)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>{apt.estado === 'atendida' ? 'Editar Informe Médico' : 'Registrar Atención'}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
