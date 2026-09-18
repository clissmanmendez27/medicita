import React, { useState, useEffect } from 'react';
import { RotateCcw, X, Calendar, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { Appointment, Doctor, DoctorAvailabilityDay, TimeSlot } from '../types';

interface RescheduleModalProps {
  appointment: Appointment | null;
  doctor: Doctor | undefined;
  isOpen: boolean;
  onClose: () => void;
  onConfirmReschedule: (
    appointmentId: string,
    newFecha: string,
    newHora: string,
    newFechaFormateada: string
  ) => Promise<void>;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  appointment,
  doctor,
  isOpen,
  onClose,
  onConfirmReschedule,
}) => {
  const [selectedDay, setSelectedDay] = useState<DoctorAvailabilityDay | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Reset and sync state when opening modal or changing appointment
  useEffect(() => {
    if (isOpen && doctor) {
      const firstAvailableDay =
        doctor.disponibilidad.find((d) => d.cuposDisponibles > 0) ||
        doctor.disponibilidad[0] ||
        null;
      setSelectedDay(firstAvailableDay);
      setSelectedSlot(null);
      setError('');
    }
  }, [isOpen, appointment?.id, doctor?.id]);

  // Keyboard accessibility: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !appointment || !doctor) return null;

  const handleConfirm = async () => {
    if (!selectedDay || !selectedSlot) {
      setError('Por favor selecciona una nueva fecha y horario.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const fechaFormateada = `${selectedDay.diaNombre}, ${selectedDay.diaNumero} de ${selectedDay.mesNombre}`;
      const horaFormateada = selectedSlot.hora.includes('AM') || selectedSlot.hora.includes('PM')
        ? selectedSlot.hora
        : `${selectedSlot.hora} ${selectedSlot.periodo === 'mañana' ? 'AM' : 'PM'}`;

      await onConfirmReschedule(appointment.id, selectedDay.fecha, horaFormateada, fechaFormateada);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al reprogramar la cita. Inténtalo nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reschedule-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-blue-600">
            <RotateCcw className="w-5 h-5" />
            <h3 id="reschedule-modal-title" className="font-bold text-base text-slate-900 font-sans">
              Reprogramar Cita Médica
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current appointment info */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-mono font-bold text-slate-700">{appointment.codigo}</span>
            <span className="font-semibold text-blue-700">{appointment.especialidadNombre}</span>
          </div>
          <p className="font-bold text-slate-900">{appointment.medicoNombre}</p>
          <p className="text-slate-600">
            Horario actual programado: <strong>{appointment.fechaFormateada} a las {appointment.hora}</strong>
          </p>
        </div>

        {/* Days selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
            1. Selecciona la nueva fecha:
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {doctor.disponibilidad.map((day) => {
              const isSelected = selectedDay?.fecha === day.fecha;
              const isAgotado = day.cuposDisponibles === 0;

              return (
                <button
                  key={day.fecha}
                  type="button"
                  disabled={isAgotado}
                  onClick={() => {
                    setSelectedDay(day);
                    setSelectedSlot(null);
                  }}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                      : isAgotado
                      ? 'bg-slate-100 text-slate-400 border-slate-200 opacity-60 cursor-not-allowed'
                      : 'border-slate-200 hover:border-blue-300 text-slate-800'
                  }`}
                >
                  <p className="text-[10px] font-medium opacity-80">{day.diaNombre.slice(0, 3)}</p>
                  <p className="text-base font-black my-0.5">{day.diaNumero}</p>
                  <span className="text-[9px] font-bold block">{isAgotado ? 'Agotado' : `${day.cuposDisponibles} cupos`}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Slots selector */}
        {selectedDay && (
          <div className="space-y-3 pt-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
              2. Selecciona el nuevo horario ({selectedDay.diaNombre} {selectedDay.diaNumero}):
            </label>

            <div>
              <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">Turno Mañana</span>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {selectedDay.slots
                  .filter((s) => s.periodo === 'mañana')
                  .map((slot) => {
                    const isSelected = selectedSlot?.id === slot.id;
                    const isOccupied = slot.estado === 'ocupado';
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        disabled={isOccupied}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : isOccupied
                            ? 'bg-slate-100 text-slate-400 border-slate-200 line-through cursor-not-allowed'
                            : 'bg-white text-slate-800 border-slate-200 hover:border-blue-400'
                        }`}
                      >
                        {slot.hora} AM
                      </button>
                    );
                  })}
              </div>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">Turno Tarde</span>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {selectedDay.slots
                  .filter((s) => s.periodo === 'tarde')
                  .map((slot) => {
                    const isSelected = selectedSlot?.id === slot.id;
                    const isOccupied = slot.estado === 'ocupado';
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        disabled={isOccupied}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : isOccupied
                            ? 'bg-slate-100 text-slate-400 border-slate-200 line-through cursor-not-allowed'
                            : 'bg-white text-slate-800 border-slate-200 hover:border-blue-400'
                        }`}
                      >
                        {slot.hora} PM
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {selectedSlot && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              Nueva programación: <strong>{selectedDay?.diaNombre} {selectedDay?.diaNumero} a las {selectedSlot.hora} {selectedSlot.periodo === 'mañana' ? 'AM' : 'PM'}</strong>. Se conservará tu código {appointment.codigo}.
            </span>
          </div>
        )}

        {error && (
          <p className="text-xs text-rose-600 font-medium">{error}</p>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200"
          >
            Cancelar
          </button>
          <button
            id="confirm-reschedule-btn"
            type="button"
            disabled={!selectedSlot || isSubmitting}
            onClick={handleConfirm}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs disabled:opacity-50"
          >
            {isSubmitting ? 'Reprogramando...' : 'Confirmar Nueva Fecha'}
          </button>
        </div>
      </div>
    </div>
  );
};
