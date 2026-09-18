import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, XCircle } from 'lucide-react';
import { Appointment } from '../types';

interface CancelModalProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmCancel: (appointmentId: string, reason: string) => Promise<void>;
}

export const CancelModal: React.FC<CancelModalProps> = ({
  appointment,
  isOpen,
  onClose,
  onConfirmCancel,
}) => {
  const [selectedReason, setSelectedReason] = useState<string>('Conflicto de horario o trabajo');
  const [additionalNotes, setAdditionalNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Reset form state upon opening
  useEffect(() => {
    if (isOpen) {
      setSelectedReason('Conflicto de horario o trabajo');
      setAdditionalNotes('');
      setError('');
    }
  }, [isOpen, appointment?.id]);

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

  if (!isOpen || !appointment) return null;

  const reasons = [
    'Conflicto de horario o trabajo',
    'Mejoría de síntomas clínicos',
    'Prefiero cambiar a modalidad de teleconsulta',
    'Dificultad de traslado hacia la sede médica',
    'Otro motivo personal',
  ];

  const handleConfirm = async () => {
    const finalReason = additionalNotes.trim()
      ? `${selectedReason}: ${additionalNotes.trim()}`
      : selectedReason;

    setIsSubmitting(true);
    setError('');

    try {
      await onConfirmCancel(appointment.id, finalReason);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'No se pudo cancelar la cita. Inténtalo nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-5 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-rose-600">
            <AlertTriangle className="w-5 h-5" />
            <h3 id="cancel-modal-title" className="font-bold text-base text-slate-900 font-sans">
              Cancelar Cita Médica
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Appointment mini summary */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-mono font-bold text-slate-700">{appointment.codigo}</span>
            <span className="font-semibold text-blue-700">{appointment.especialidadNombre}</span>
          </div>
          <p className="font-bold text-slate-900">{appointment.medicoNombre}</p>
          <p className="text-slate-600">
            {appointment.fechaFormateada} a las {appointment.hora} • {appointment.sede}
          </p>
        </div>

        {/* Reason choices */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">
            Por favor indícanos el motivo de la cancelación:
          </label>
          <div className="space-y-2">
            {reasons.map((r) => (
              <label
                key={r}
                className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                  selectedReason === r
                    ? 'border-rose-300 bg-rose-50/50 text-rose-900 font-semibold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="cancellation-reason"
                  value={r}
                  checked={selectedReason === r}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="text-rose-600 focus:ring-rose-500"
                />
                <span>{r}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Optional text */}
        <div>
          <label htmlFor="cancel-notes" className="block text-xs font-medium text-slate-600 mb-1">
            Comentario u observación adicional (opcional):
          </label>
          <textarea
            id="cancel-notes"
            rows={2}
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            placeholder="Detalles adicionales..."
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
          />
        </div>

        {/* Warning banner */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
          <strong>Aviso:</strong> Al confirmar la cancelación, este horario quedará disponible de inmediato en el sistema para que otro paciente pueda reservarlo.
        </div>

        {error && (
          <p className="text-xs text-rose-600 font-medium">{error}</p>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200"
          >
            Mantener mi Cita
          </button>
          <button
            id="confirm-cancel-appointment-modal-btn"
            type="button"
            disabled={isSubmitting}
            onClick={handleConfirm}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-xs flex items-center gap-1.5 disabled:opacity-50"
          >
            <XCircle className="w-4 h-4" />
            <span>{isSubmitting ? 'Cancelando...' : 'Confirmar Cancelación'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
