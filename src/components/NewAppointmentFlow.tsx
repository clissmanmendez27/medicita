import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Star,
  ShieldCheck,
  Stethoscope,
  Info,
  Sparkles,
  AlertTriangle,
  UserCheck,
  Check,
  ArrowRight,
  HeartPulse,
  Baby,
  Smile,
  Activity,
} from 'lucide-react';
import { Specialty, Doctor, DoctorAvailabilityDay, TimeSlot, User, Appointment } from '../types';

interface NewAppointmentFlowProps {
  specialties: Specialty[];
  doctors: Doctor[];
  currentUser: User;
  initialSpecialtyId?: string;
  initialDoctor?: Doctor;
  onAppointmentCreated: (appointment: Appointment) => void;
  onCancelBooking: () => void;
  onNavigateToMyAppointments: () => void;
}

export const NewAppointmentFlow: React.FC<NewAppointmentFlowProps> = ({
  specialties,
  doctors,
  currentUser,
  initialSpecialtyId,
  initialDoctor,
  onAppointmentCreated,
  onCancelBooking,
  onNavigateToMyAppointments,
}) => {
  // Stepper: 1 = Especialidad, 2 = Medico, 3 = Fecha y Hora, 4 = Motivo, 5 = Resumen, 6 = Éxito
  const [step, setStep] = useState<number>(initialDoctor ? 3 : initialSpecialtyId ? 2 : 1);

  // Form State
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<string>(
    initialDoctor ? initialDoctor.especialidadId : initialSpecialtyId || ''
  );
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(initialDoctor || null);
  const [selectedDay, setSelectedDay] = useState<DoctorAvailabilityDay | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [motivo, setMotivo] = useState<string>('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [termsAccepted, setTermsAccepted] = useState<boolean>(true);

  // UI state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [createdAppointment, setCreatedAppointment] = useState<Appointment | null>(null);
  const [formError, setFormError] = useState<string>('');

  // Sync state when incoming props change
  useEffect(() => {
    if (initialDoctor) {
      setSelectedDoctor(initialDoctor);
      setSelectedSpecialtyId(initialDoctor.especialidadId);
      setStep(3);
    } else if (initialSpecialtyId) {
      setSelectedSpecialtyId(initialSpecialtyId);
      setSelectedDoctor(null);
      setStep(2);
    }
  }, [initialSpecialtyId, initialDoctor]);

  // Sync selectedDoctor with fresh doctor availability from props
  useEffect(() => {
    if (selectedDoctor) {
      const freshDoc = doctors.find((d) => d.id === selectedDoctor.id);
      if (freshDoc) {
        setSelectedDoctor(freshDoc);
        if (selectedDay) {
          const freshDay = freshDoc.disponibilidad.find((d) => d.fecha === selectedDay.fecha);
          if (freshDay) setSelectedDay(freshDay);
        }
      }
    }
  }, [doctors]);

  // Preselect day when doctor is selected
  useEffect(() => {
    if (selectedDoctor && selectedDoctor.disponibilidad && selectedDoctor.disponibilidad.length > 0) {
      // Pick first day with available slots
      const firstAvailableDay = selectedDoctor.disponibilidad.find((d) => d.cuposDisponibles > 0) || selectedDoctor.disponibilidad[0];
      setSelectedDay(firstAvailableDay);
      setSelectedSlot(null);
    }
  }, [selectedDoctor?.id]);

  const selectedSpecialty = specialties.find((s) => s.id === selectedSpecialtyId);

  // Doctors filtered by selected specialty
  const availableDoctors = selectedSpecialtyId
    ? doctors.filter((d) => d.especialidadId === selectedSpecialtyId)
    : doctors;

  // Filter specialties by search
  const filteredSpecialties = specialties.filter((s) =>
    s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const quickReasonChips = [
    'Chequeo médico preventivo',
    'Molestia torácica / palpitaciones',
    'Lectura de exámenes de laboratorio',
    'Control periódico de tratamiento',
    'Dolor agudo o malestar persistente',
    'Revisión dermatológica de lesiones',
  ];

  const handleToggleChip = (chip: string) => {
    if (selectedSymptoms.includes(chip)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== chip));
    } else {
      setSelectedSymptoms([...selectedSymptoms, chip]);
      if (!motivo) {
        setMotivo(chip);
      }
    }
  };

  const handleConfirmAppointment = async () => {
    if (!selectedDoctor || !selectedDay || !selectedSlot) {
      setFormError('Por favor selecciona doctor, fecha y horario.');
      return;
    }
    if (!motivo.trim() || motivo.trim().length < 5) {
      setFormError('Por favor detalla el motivo de tu consulta médica (mínimo 5 caracteres).');
      return;
    }
    if (!termsAccepted) {
      setFormError('Debes aceptar la declaración de veracidad y condiciones de puntualidad.');
      return;
    }

    setFormError('');
    setIsSubmitting(true);

    try {
      const fechaFormateada = `${selectedDay.diaNombre}, ${selectedDay.diaNumero} de ${selectedDay.mesNombre}`;
      const horaFormateada = selectedSlot.hora.includes('AM') || selectedSlot.hora.includes('PM')
        ? selectedSlot.hora
        : `${selectedSlot.hora} ${selectedSlot.periodo === 'mañana' ? 'AM' : 'PM'}`;

      const { MedicitaService } = await import('../services/medicitaService');
      const appointment = await MedicitaService.createAppointment({
        medico: selectedDoctor,
        fecha: selectedDay.fecha,
        fechaFormateada,
        hora: horaFormateada,
        motivo: motivo.trim(),
        sintomasPrevios: selectedSymptoms,
      });

      setCreatedAppointment(appointment);
      onAppointmentCreated(appointment);
      setStep(6); // Success step
    } catch (err: any) {
      setFormError(err?.message || 'Ocurrió un error al confirmar la cita. Por favor intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSpecialtyIcon = (iconName: string) => {
    switch (iconName) {
      case 'HeartPulse':
        return <HeartPulse className="w-5 h-5 text-rose-600" />;
      case 'Baby':
        return <Baby className="w-5 h-5 text-blue-600" />;
      case 'Stethoscope':
        return <Stethoscope className="w-5 h-5 text-cyan-600" />;
      case 'Smile':
        return <Smile className="w-5 h-5 text-amber-600" />;
      default:
        return <Activity className="w-5 h-5 text-emerald-600" />;
    }
  };

  // Step 6: Success View
  if (step === 6 && createdAppointment) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 text-center">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-6 sm:p-10">
          <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 animate-in zoom-in">
            <CheckCircle className="w-10 h-10" />
          </div>

          <span className="text-xs font-bold tracking-wider uppercase px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Reserva Confirmada Exitosamente
          </span>

          <h2 className="text-2xl font-extrabold text-slate-900 mt-3 font-sans">
            ¡Tu cita médica está lista!
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Hemos registrado tu turno y enviado los recordatorios clínicos a tu cuenta.
          </p>

          {/* Ticket Card */}
          <div className="mt-6 bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Código de Cita</p>
                <p className="font-mono text-base font-extrabold text-blue-700">{createdAppointment.codigo}</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                Estado: Confirmada
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-slate-500 font-medium">Médico Especialista</p>
                <p className="font-bold text-slate-900">{createdAppointment.medicoNombre}</p>
                <p className="text-blue-600 font-medium">{createdAppointment.especialidadNombre}</p>
              </div>
              <div>
                <p className="text-slate-500 font-medium">Fecha y Hora</p>
                <p className="font-bold text-slate-900">{createdAppointment.fechaFormateada}</p>
                <p className="text-slate-700 font-semibold">{createdAppointment.hora}</p>
              </div>
              <div>
                <p className="text-slate-500 font-medium">Sede y Consultorio</p>
                <p className="font-bold text-slate-900">{createdAppointment.sede}</p>
                <p className="text-slate-600">{createdAppointment.consultorio}</p>
              </div>
              <div>
                <p className="text-slate-500 font-medium">Copago Estimado</p>
                <p className="font-bold text-emerald-700 text-sm">S/. {createdAppointment.copago}.00</p>
                <p className="text-[11px] text-slate-500">Cubierto 80% por {currentUser.seguroEps}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200/80 bg-blue-50/50 p-3 rounded-xl text-xs text-blue-900 flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Recomendaciones de ingreso:</p>
                <p className="text-blue-800 mt-0.5">
                  Por favor asiste 15 minutos antes con tu documento de identidad en físico en la recepción de la torre médica.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              id="success-view-my-appointments-btn"
              onClick={onNavigateToMyAppointments}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-500/20 transition-all"
            >
              Ver en Mis Citas
            </button>
            <button
              id="success-back-dashboard-btn"
              onClick={onCancelBooking}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-colors"
            >
              Volver al Inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header & Back Action */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-sans">
            Agendar Nueva Cita Médica
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Completa los pasos para reservar tu turno con especialistas certificados
          </p>
        </div>
        <button
          id="cancel-booking-flow-btn"
          onClick={onCancelBooking}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 hover:underline px-3 py-1.5"
        >
          Cancelar y Salir
        </button>
      </div>

      {/* Stepper Wizard Indicator */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <div className="grid grid-cols-5 gap-1 sm:gap-2">
          {[
            { num: 1, label: 'Especialidad' },
            { num: 2, label: 'Médico' },
            { num: 3, label: 'Fecha & Hora' },
            { num: 4, label: 'Motivo' },
            { num: 5, label: 'Confirmación' },
          ].map((s) => {
            const isCompleted = step > s.num;
            const isCurrent = step === s.num;
            return (
              <div key={s.num} className="flex flex-col items-center text-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isCompleted
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : s.num}
                </div>
                <span
                  className={`text-[10px] sm:text-xs mt-1.5 font-medium truncate max-w-[70px] sm:max-w-none ${
                    isCurrent ? 'text-blue-700 font-bold' : isCompleted ? 'text-slate-700' : 'text-slate-400'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Error alert if any */}
      {formError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* STEP 1: Selección de Especialidad */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="text-base font-bold text-slate-900 mb-1">
              Paso 1: Selecciona la Especialidad Médica
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Elige el área de atención requerida para ver los médicos disponibles
            </p>

            <input
              type="text"
              id="search-specialty-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar especialidad (ej. Cardiología, Pediatría, Dermatología)..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredSpecialties.map((esp) => (
                <div
                  key={esp.id}
                  id={`select-specialty-opt-${esp.id}`}
                  onClick={() => {
                    setSelectedSpecialtyId(esp.id);
                    setSelectedDoctor(null);
                    setStep(2);
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    selectedSpecialtyId === esp.id
                      ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50/70'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 rounded-lg bg-white border border-slate-200">
                        {getSpecialtyIcon(esp.icono)}
                      </div>
                      <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                        {esp.doctoresCount} médicos
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-slate-900">{esp.nombre}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {esp.descripcion}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">S/. {esp.precioBase}</span>
                    <span className="text-blue-600 font-bold flex items-center gap-1">
                      <span>Seleccionar</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Selección de Médico */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Paso 2: Selecciona a tu Médico Especialista
                </h2>
                <p className="text-xs text-slate-500">
                  Especialistas calificados en {selectedSpecialty?.nombre}
                </p>
              </div>
              <button
                onClick={() => setStep(1)}
                className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Cambiar especialidad</span>
              </button>
            </div>

            {availableDoctors.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                No se encontraron médicos para esta especialidad.
              </div>
            ) : (
              <div className="space-y-3.5">
                {availableDoctors.map((doc) => {
                  const isSelected = selectedDoctor?.id === doc.id;
                  const nextSlotDay = doc.disponibilidad[0];
                  return (
                    <div
                      key={doc.id}
                      id={`select-doc-card-${doc.id}`}
                      className={`p-4 rounded-2xl border transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <img
                            src={doc.fotoUrl}
                            alt={doc.nombre}
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?auto=format&fit=crop&q=80&w=400';
                            }}
                            className="w-16 h-16 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-slate-900 text-sm sm:text-base">{doc.nombre}</h3>
                              <div className="flex items-center gap-1 text-xs font-bold text-slate-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                <span>{doc.calificacion}</span>
                              </div>
                            </div>
                            <p className="text-xs text-blue-700 font-semibold">{doc.especialidadNombre} • {doc.colegiatura}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{doc.experiencia} • {doc.bio}</p>
                            <p className="text-xs text-slate-600 flex items-center gap-1 mt-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              <span>{doc.sede} ({doc.consultorio})</span>
                            </p>
                          </div>
                        </div>

                        <div className="sm:text-right shrink-0 flex sm:flex-col items-center sm:items-end justify-between gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                          <div>
                            <span className="text-[11px] text-slate-500 block">Próximo turno:</span>
                            <span className="text-xs font-bold text-slate-900">
                              {nextSlotDay ? `${nextSlotDay.diaNombre} ${nextSlotDay.diaNumero}` : 'Esta semana'}
                            </span>
                          </div>
                          <button
                            id={`choose-doc-btn-${doc.id}`}
                            onClick={() => {
                              setSelectedDoctor(doc);
                              setStep(3);
                            }}
                            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
                          >
                            Seleccionar este médico
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Step 2 Bottom Navigation */}
            <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200"
              >
                Volver a Especialidades
              </button>
              <button
                type="button"
                id="step-2-next-btn"
                onClick={() => {
                  if (!selectedDoctor) {
                    setFormError('Debes seleccionar un médico especialista para continuar.');
                  } else {
                    setFormError('');
                    setStep(3);
                  }
                }}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  selectedDoctor
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                }`}
              >
                Continuar a Selección de Horario
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Selección de Fecha y Horario */}
      {step === 3 && selectedDoctor && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Paso 3: Selecciona Fecha y Horario
                </h2>
                <p className="text-xs text-slate-500">
                  Con {selectedDoctor.nombre} en {selectedDoctor.sede}
                </p>
              </div>
              <button
                onClick={() => setStep(2)}
                className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Cambiar médico</span>
              </button>
            </div>

            {/* Doctor mini banner */}
            <div className="flex items-center gap-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
              <img
                src={selectedDoctor.fotoUrl}
                alt={selectedDoctor.nombre}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?auto=format&fit=crop&q=80&w=400';
                }}
                className="w-10 h-10 rounded-lg object-cover ring-1 ring-slate-200 shrink-0"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-900">{selectedDoctor.nombre}</span>
                <span className="text-slate-500 block">{selectedDoctor.especialidadNombre} • {selectedDoctor.consultorio}</span>
              </div>
            </div>

            {/* Calendar Day Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                1. Selecciona el Día de Consulta:
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {selectedDoctor.disponibilidad.map((day) => {
                  const isDaySelected = selectedDay?.fecha === day.fecha;
                  const isExhausted = day.disponibilidadNivel === 'agotada' || day.cuposDisponibles === 0;

                  return (
                    <button
                      key={day.fecha}
                      id={`day-select-${day.fecha}`}
                      disabled={isExhausted}
                      onClick={() => {
                        setSelectedDay(day);
                        setSelectedSlot(null);
                      }}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        isDaySelected
                          ? 'border-blue-600 bg-blue-600 text-white shadow-md ring-2 ring-blue-400'
                          : isExhausted
                          ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                          : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <p className={`text-[11px] font-medium ${isDaySelected ? 'text-blue-100' : 'text-slate-500'}`}>
                        {day.diaNombre.slice(0, 3)}
                      </p>
                      <p className="text-lg font-black my-0.5">{day.diaNumero}</p>
                      <p className={`text-[10px] font-semibold ${isDaySelected ? 'text-blue-100' : 'text-slate-400'}`}>
                        {day.mesNombre}
                      </p>

                      <span
                        className={`inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                          isDaySelected
                            ? 'bg-blue-700 text-white'
                            : isExhausted
                            ? 'bg-slate-200 text-slate-500'
                            : day.cuposDisponibles <= 2
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isExhausted ? 'Agotado' : `${day.cuposDisponibles} cupos`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Slot Picker */}
            {selectedDay && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    2. Selecciona la Hora del Turno ({selectedDay.diaNombre} {selectedDay.diaNumero} de {selectedDay.mesNombre}):
                  </label>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                      <span>Disponible</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" />
                      <span>Ocupado</span>
                    </span>
                  </div>
                </div>

                {/* Morning Slots */}
                <div>
                  <span className="text-xs font-semibold text-slate-500 block mb-2">Turno Mañana</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {selectedDay.slots
                      .filter((s) => s.periodo === 'mañana')
                      .map((slot) => {
                        const isSlotSelected = selectedSlot?.id === slot.id;
                        const isOccupied = slot.estado === 'ocupado';

                        return (
                          <button
                            key={slot.id}
                            id={`slot-${slot.id}`}
                            type="button"
                            title={isOccupied ? 'Horario ocupado por otro paciente' : 'Horario disponible'}
                            onClick={() => {
                              if (isOccupied) {
                                setFormError(
                                  `El horario ${slot.hora} AM no se encuentra disponible (ocupado por otro paciente). Por favor selecciona otro horario disponible.`
                                );
                              } else {
                                setFormError('');
                                setSelectedSlot(slot);
                              }
                            }}
                            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                              isSlotSelected
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-300'
                                : isOccupied
                                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through hover:border-rose-300 hover:bg-rose-50/50'
                                : 'bg-white hover:bg-blue-50 text-slate-800 border-slate-300 hover:border-blue-400'
                            }`}
                          >
                            {slot.hora} AM
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* Afternoon Slots */}
                <div>
                  <span className="text-xs font-semibold text-slate-500 block mb-2">Turno Tarde</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {selectedDay.slots
                      .filter((s) => s.periodo === 'tarde')
                      .map((slot) => {
                        const isSlotSelected = selectedSlot?.id === slot.id;
                        const isOccupied = slot.estado === 'ocupado';

                        return (
                          <button
                            key={slot.id}
                            id={`slot-${slot.id}`}
                            type="button"
                            title={isOccupied ? 'Horario ocupado por otro paciente' : 'Horario disponible'}
                            onClick={() => {
                              if (isOccupied) {
                                setFormError(
                                  `El horario ${slot.hora} PM no se encuentra disponible (ocupado por otro paciente). Por favor selecciona otro horario disponible.`
                                );
                              } else {
                                setFormError('');
                                setSelectedSlot(slot);
                              }
                            }}
                            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                              isSlotSelected
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-300'
                                : isOccupied
                                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through hover:border-rose-300 hover:bg-rose-50/50'
                                : 'bg-white hover:bg-blue-50 text-slate-800 border-slate-300 hover:border-blue-400'
                            }`}
                          >
                            {slot.hora} PM
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* Temporary reservation pill */}
                {selectedSlot && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      Cupo seleccionado: <strong>{selectedSlot.hora} {selectedSlot.periodo === 'mañana' ? 'AM' : 'PM'}</strong>. Se mantendrá bloqueado provisionalmente mientras completas el motivo.
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200"
              >
                Volver
              </button>
              <button
                type="button"
                id="step-3-next-btn"
                onClick={() => {
                  if (!selectedSlot) {
                    setFormError('Debes seleccionar un horario disponible antes de continuar.');
                  } else {
                    setFormError('');
                    setStep(4);
                  }
                }}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  selectedSlot
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                }`}
              >
                Continuar al Motivo de Consulta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: Motivo de Consulta y Cobertura */}
      {step === 4 && selectedDoctor && selectedDay && selectedSlot && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Paso 4: Motivo de Consulta Médica
                </h2>
                <p className="text-xs text-slate-500">
                  Ayuda al {selectedDoctor.nombre} a preparar tu historia clínica previa
                </p>
              </div>
              <button
                onClick={() => setStep(3)}
                className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Modificar fecha u hora</span>
              </button>
            </div>

            {/* Quick Chips */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Motivos o síntomas comunes (haz clic para añadir rápidamente):
              </label>
              <div className="flex flex-wrap gap-2">
                {quickReasonChips.map((chip) => {
                  const isChecked = selectedSymptoms.includes(chip);
                  return (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => handleToggleChip(chip)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        isChecked
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {isChecked ? '✓ ' : '+ '}
                      {chip}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Detailed textarea */}
            <div>
              <label htmlFor="motivo-textarea" className="block text-xs font-bold text-slate-700 mb-1">
                Describe tus síntomas o la razón de la consulta:
              </label>
              <textarea
                id="motivo-textarea"
                rows={3}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Por favor describe brevemente tus síntomas, tiempo de evolución o si requieres una orden específica..."
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                <span>Sé lo más detallado posible para el médico tratante.</span>
                <span>{motivo.length} caracteres</span>
              </div>
            </div>

            {/* Cost & Insurance Coverage Box */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Honorario médico base ({selectedDoctor.especialidadNombre})</span>
                <span className="font-semibold text-slate-900">S/. {selectedDoctor.precioConsulta}.00</span>
              </div>
              <div className="flex items-center justify-between text-emerald-700 font-medium">
                <span>Cobertura EPS ({currentUser.seguroEps} - 80%)</span>
                <span>- S/. {Math.round(selectedDoctor.precioConsulta * 0.8)}.00</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm font-bold text-slate-900">
                <span>Copago final estimado a cancelar en clínica</span>
                <span className="text-blue-700 font-extrabold">
                  S/. {selectedDoctor.precioConsulta - Math.round(selectedDoctor.precioConsulta * 0.8)}.00
                </span>
              </div>
            </div>

            {/* Nav */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                onClick={() => setStep(3)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200"
              >
                Volver
              </button>
              <button
                id="step-4-next-btn"
                disabled={!motivo.trim() || motivo.length < 5}
                onClick={() => setStep(5)}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  motivo.trim().length >= 5
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                Revisar Resumen y Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: Resumen Final y Confirmación */}
      {step === 5 && selectedDoctor && selectedDay && selectedSlot && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900 font-sans">
                  Paso 5: Resumen Final y Confirmación de Cita
                </h2>
                <p className="text-xs text-slate-500">
                  Verifica que todos los datos de tu reserva sean correctos
                </p>
              </div>
              <button
                onClick={() => setStep(4)}
                className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Editar datos</span>
              </button>
            </div>

            {/* Summary Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Doctor Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Médico & Especialidad</p>
                <div className="flex items-center gap-3">
                  <img
                    src={selectedDoctor.fotoUrl}
                    alt={selectedDoctor.nombre}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?auto=format&fit=crop&q=80&w=400';
                    }}
                    className="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-200"
                  />
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{selectedDoctor.nombre}</h4>
                    <p className="text-xs text-blue-600 font-semibold">{selectedDoctor.especialidadNombre}</p>
                    <p className="text-[11px] text-slate-500">{selectedDoctor.colegiatura}</p>
                  </div>
                </div>
              </div>

              {/* Patient Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Datos del Paciente</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <div className="text-xs">
                    <h4 className="font-bold text-slate-900">{currentUser.nombre} {currentUser.apellidos}</h4>
                    <p className="text-slate-600">DNI: {currentUser.dni} • Tel: {currentUser.telefono}</p>
                    <p className="text-emerald-700 font-semibold">{currentUser.seguroEps || 'Particular'}</p>
                  </div>
                </div>
              </div>

              {/* Date & Location */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5 text-xs">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Fecha, Horario y Lugar</p>
                <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>{selectedDay.diaNombre}, {selectedDay.diaNumero} de {selectedDay.mesNombre}</span>
                </p>
                <p className="font-semibold text-blue-700 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>{selectedSlot.hora} {selectedSlot.periodo === 'mañana' ? 'AM' : 'PM'}</span>
                </p>
                <p className="text-slate-600 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>{selectedDoctor.sede} ({selectedDoctor.consultorio})</span>
                </p>
              </div>

              {/* Reason */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5 text-xs">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Motivo de Consulta</p>
                <p className="text-slate-800 font-medium italic">
                  "{motivo}"
                </p>
                {selectedSymptoms.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedSymptoms.map((s) => (
                      <span key={s} className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Terms checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="accept-terms-checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded-sm text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <span className="text-xs text-slate-600 leading-relaxed">
                  Confirmo que los datos registrados son correctos y me comprometo a presentarme en recepción con 15 minutos de anticipación. Entiendo que en caso de no poder asistir, podré reprogramar o cancelar oportunamente desde la sección <strong>Mis Citas</strong>.
                </span>
              </label>
            </div>

            {/* Confirmation actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                onClick={() => setStep(4)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200"
              >
                Modificar datos
              </button>

              <button
                id="confirm-appointment-final-btn"
                disabled={isSubmitting || !termsAccepted}
                onClick={handleConfirmAppointment}
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 active:scale-95"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Confirmando con la clínica...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Confirmar Cita Médica</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
