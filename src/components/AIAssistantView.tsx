import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
  Stethoscope,
  MapPin,
  CalendarDays,
  RotateCcw,
  Info,
  ChevronRight,
  User,
  HeartPulse,
  Baby,
  Smile,
  Check,
} from 'lucide-react';
import {
  AssistantMessage,
  Doctor,
  Specialty,
  Appointment,
  User as UserType,
  DoctorAvailabilityDay,
} from '../types';
import { MedicitaService } from '../services/medicitaService';

interface AIAssistantViewProps {
  specialties: Specialty[];
  doctors: Doctor[];
  currentUser: UserType;
  appointments: Appointment[];
  onSelectSpecialtyForBooking: (specialtyId: string) => void;
  onSelectDoctorForBooking: (doctor: Doctor) => void;
  onOpenReschedule?: (apt: Appointment) => void;
  onOpenCancel?: (apt: Appointment) => void;
  onNavigate: (view: string) => void;
  onAppointmentCreated?: () => void;
}

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({
  specialties,
  doctors,
  currentUser,
  appointments,
  onSelectSpecialtyForBooking,
  onSelectDoctorForBooking,
  onOpenReschedule,
  onOpenCancel,
  onNavigate,
  onAppointmentCreated,
}) => {
  // Conversational booking context state
  const [activeSpecialty, setActiveSpecialty] = useState<Specialty | null>(null);
  const [activeDoctor, setActiveDoctor] = useState<Doctor | null>(null);
  const [activeDay, setActiveDay] = useState<DoctorAvailabilityDay | null>(null);
  const [activeHour, setActiveHour] = useState<string | null>(null);
  const [pendingAppointmentAction, setPendingAppointmentAction] = useState<Appointment | null>(null);

  const initialGreeting: AssistantMessage = {
    id: 'msg-init',
    remitente: 'asistente',
    texto: `¡Hola, ${currentUser.nombre}! Soy el Asistente Automatizado de MediCita.\n\nEstoy aquí para orientarte y ayudarte a gestionar tus citas médicas en nuestro centro de salud:\n• Ayudarte a encontrar la especialidad médica adecuada\n• Mostrarte los médicos disponibles y sus sedes\n• Consultar horarios reales y guiarte en tu reserva\n• Mostrar tus próximas citas programadas\n• Orientarte para reprogramar o cancelar una cita\n\n¿En qué te puedo ayudar hoy?`,
    timestamp: 'Ahora',
    esAsistenciaAutomatizada: true,
  };

  const [messages, setMessages] = useState<AssistantMessage[]>([initialGreeting]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Quick demonstration prompts matching the prompt requirements
  const quickPrompts = [
    'Quiero una cita con cardiología',
    'Quiero al Dr. Carlos',
    '10:00 AM',
    'Mostrar mis próximas citas',
    '¿Qué especialidades tienen?',
    'Cancelar o reprogramar una cita',
  ];

  // Helper to format timestamps
  const getTimeString = () =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // 1. Triggered when user selects or asks for a specialty
  const handleSelectSpecialty = (sp: Specialty, userText?: string) => {
    setActiveSpecialty(sp);
    const docs = doctors.filter((d) => d.especialidadId === sp.id);

    const userMsg: AssistantMessage = {
      id: `usr-${Date.now()}`,
      remitente: 'usuario',
      texto: userText || `Quiero una cita con ${sp.nombre.toLowerCase()}`,
      timestamp: getTimeString(),
    };

    const botMsg: AssistantMessage = {
      id: `bot-${Date.now() + 1}`,
      remitente: 'asistente',
      texto: `Claro. Estas son las opciones disponibles de **${sp.nombre}**.\n\nContamos con ${docs.length} especialista(s) en esta área. Selecciona el médico con el que deseas atenderte o indícame su nombre:`,
      timestamp: getTimeString(),
      tipoRespuesta: 'medicos',
      especialidadSeleccionada: sp,
      medicosDisponibles: docs,
      esAsistenciaAutomatizada: true,
    };

    setMessages((prev) => [...prev, userMsg, botMsg]);
  };

  // 2. Triggered when user selects or asks for a doctor
  const handleSelectDoctor = (doc: Doctor, userText?: string) => {
    setActiveDoctor(doc);
    // Find matching specialty
    const sp = specialties.find((s) => s.id === doc.especialidadId) || null;
    if (sp) setActiveSpecialty(sp);

    // Pick first available day with free slots
    const firstDayWithSlots = doc.disponibilidad.find(
      (d) => d.slots.filter((s) => s.estado === 'disponible').length > 0
    ) || doc.disponibilidad[0];

    setActiveDay(firstDayWithSlots);

    const userMsg: AssistantMessage = {
      id: `usr-${Date.now()}`,
      remitente: 'usuario',
      texto: userText || `Quiero al ${doc.nombre}`,
      timestamp: getTimeString(),
    };

    const botMsg: AssistantMessage = {
      id: `bot-${Date.now() + 1}`,
      remitente: 'asistente',
      texto: `El **${doc.nombre}** (${doc.especialidadNombre}) tiene estos horarios disponibles en la ${doc.sede} (${doc.consultorio}).\n\nPor favor selecciona el día y la hora que prefieras:`,
      timestamp: getTimeString(),
      tipoRespuesta: 'horarios',
      medicoSeleccionado: doc,
      diaSeleccionado: firstDayWithSlots as any,
      esAsistenciaAutomatizada: true,
    };

    setMessages((prev) => [...prev, userMsg, botMsg]);
  };

  // 3. Triggered when user selects a time slot
  const handleSelectSlot = (day: DoctorAvailabilityDay, hora: string, userText?: string) => {
    if (!activeDoctor) return;
    setActiveDay(day);
    setActiveHour(hora);

    const fechaFormateada = `${day.diaNombre} ${day.diaNumero} de ${day.mesNombre}`;

    const userMsg: AssistantMessage = {
      id: `usr-${Date.now()}`,
      remitente: 'usuario',
      texto: userText || hora,
      timestamp: getTimeString(),
    };

    const botMsg: AssistantMessage = {
      id: `bot-${Date.now() + 1}`,
      remitente: 'asistente',
      texto: `Has seleccionado el **${fechaFormateada}** a las **${hora}** con el **${activeDoctor.nombre}** (${activeDoctor.especialidadNombre}).\n\n¿Deseas confirmar la cita?`,
      timestamp: getTimeString(),
      tipoRespuesta: 'confirmar_reserva',
      medicoSeleccionado: activeDoctor,
      fechaSeleccionada: day.fecha,
      fechaFormateada: fechaFormateada,
      horaSeleccionada: hora,
      esAsistenciaAutomatizada: true,
      botonesAccion: [
        {
          id: 'btn-confirm',
          label: 'Confirmar',
          variante: 'primary',
          accion: 'confirmar_cita',
        },
        {
          id: 'btn-change-hour',
          label: 'Cambiar horario',
          variante: 'secondary',
          accion: 'cambiar_horario',
        },
      ],
    };

    setMessages((prev) => [...prev, userMsg, botMsg]);
  };

  // 4. Triggered when confirming appointment booking
  const handleConfirmAppointment = async (
    targetDoc: Doctor,
    fecha: string,
    fechaFormateada: string,
    hora: string
  ) => {
    setIsLoading(true);

    try {
      const createdApt = await MedicitaService.createAppointment({
        medico: targetDoc,
        fecha,
        fechaFormateada,
        hora,
        motivo: 'Consulta médica agendada a través de Asistente Automatizado',
      });

      if (onAppointmentCreated) {
        onAppointmentCreated();
      }

      const botMsg: AssistantMessage = {
        id: `bot-${Date.now() + 1}`,
        remitente: 'asistente',
        texto: `✅ **¡Cita confirmada con éxito!**\n\nTu cita ha quedado registrada en el sistema bajo el código **${createdApt.codigo}** para el paciente **${currentUser.nombre} ${currentUser.apellidos}**.\n\n• **Especialidad:** ${targetDoc.especialidadNombre}\n• **Médico:** ${targetDoc.nombre}\n• **Fecha:** ${fechaFormateada}\n• **Hora:** ${hora}\n• **Lugar:** ${targetDoc.sede} - ${targetDoc.consultorio}`,
        timestamp: getTimeString(),
        tipoRespuesta: 'cita_confirmada',
        citaEnProceso: createdApt,
        esAsistenciaAutomatizada: true,
        botonesAccion: [
          {
            id: 'btn-view-my-apts',
            label: 'Ver en Mis Citas',
            variante: 'primary',
            accion: 'ver_mis_citas',
          },
          {
            id: 'btn-restart',
            label: 'Agendar otra cita',
            variante: 'outline',
            accion: 'reiniciar',
          },
        ],
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: AssistantMessage = {
        id: `bot-${Date.now() + 1}`,
        remitente: 'asistente',
        texto: `⚠️ No pudimos confirmar el turno: ${err.message || 'El horario fue ocupado recientemente'}. Por favor selecciona otro horario disponible:`,
        timestamp: getTimeString(),
        tipoRespuesta: 'horarios',
        medicoSeleccionado: targetDoc,
        diaSeleccionado: activeDay as any,
        esAsistenciaAutomatizada: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Show user's upcoming appointments
  const handleShowMyAppointments = (userText?: string) => {
    const userMsg: AssistantMessage = {
      id: `usr-${Date.now()}`,
      remitente: 'usuario',
      texto: userText || 'Mostrar mis próximas citas',
      timestamp: getTimeString(),
    };

    const activeApts = appointments.filter(
      (a) => a.estado === 'confirmada' || a.estado === 'pendiente'
    );

    let botMsg: AssistantMessage;
    if (activeApts.length === 0) {
      botMsg = {
        id: `bot-${Date.now() + 1}`,
        remitente: 'asistente',
        texto: `Actualmente no tienes citas médicas programadas a tu nombre (${currentUser.nombre} ${currentUser.apellidos}).\n\n¿Deseas agendar una cita con alguna de nuestras especialidades disponibles?`,
        timestamp: getTimeString(),
        tipoRespuesta: 'especialidades',
        esAsistenciaAutomatizada: true,
        botonesAccion: [
          {
            id: 'btn-explore-specialties',
            label: 'Ver especialidades',
            variante: 'primary',
            accion: 'seleccionar_especialidad',
          },
        ],
      };
    } else {
      botMsg = {
        id: `bot-${Date.now() + 1}`,
        remitente: 'asistente',
        texto: `Tienes **${activeApts.length} cita(s) programada(s)**. Aquí tienes el detalle de tus próximos turnos:`,
        timestamp: getTimeString(),
        tipoRespuesta: 'mis_citas',
        citasListadas: activeApts,
        esAsistenciaAutomatizada: true,
      };
    }

    setMessages((prev) => [...prev, userMsg, botMsg]);
  };

  // 6. Handle Cancel / Reschedule orientation
  const handleGuideCancellationOrReschedule = (userText?: string) => {
    const userMsg: AssistantMessage = {
      id: `usr-${Date.now()}`,
      remitente: 'usuario',
      texto: userText || 'Cancelar o reprogramar una cita',
      timestamp: getTimeString(),
    };

    const activeApts = appointments.filter(
      (a) => a.estado === 'confirmada' || a.estado === 'pendiente'
    );

    let botMsg: AssistantMessage;
    if (activeApts.length === 0) {
      botMsg = {
        id: `bot-${Date.now() + 1}`,
        remitente: 'asistente',
        texto: `No tienes citas activas para cancelar o reprogramar en este momento. Si necesitas un turno nuevo, puedo mostrarte nuestras especialidades.`,
        timestamp: getTimeString(),
        esAsistenciaAutomatizada: true,
      };
    } else {
      botMsg = {
        id: `bot-${Date.now() + 1}`,
        remitente: 'asistente',
        texto: `Selecciona la cita que deseas gestionar. Recuerda que la reprogramación y cancelación en MediCita son inmediatas y liberan el turno para otros pacientes:`,
        timestamp: getTimeString(),
        tipoRespuesta: 'mis_citas',
        citasListadas: activeApts,
        esAsistenciaAutomatizada: true,
      };
    }

    setMessages((prev) => [...prev, userMsg, botMsg]);
  };

  // Direct cancellation confirmation in assistant
  const handleConfirmCancelInChat = async (apt: Appointment) => {
    setIsLoading(true);
    try {
      await MedicitaService.cancelAppointment(apt.id, 'Cancelada a través del Asistente Automatizado');
      if (onAppointmentCreated) onAppointmentCreated();

      const botMsg: AssistantMessage = {
        id: `bot-${Date.now() + 1}`,
        remitente: 'asistente',
        texto: `La cita **${apt.codigo}** con el **${apt.medicoNombre}** para el **${apt.fechaFormateada} a las ${apt.hora}** ha sido cancelada exitosamente y el cupo ha quedado liberado en el sistema.\n\n¿Deseas agendar un nuevo turno o consultar otra especialidad?`,
        timestamp: getTimeString(),
        esAsistenciaAutomatizada: true,
        tipoRespuesta: 'especialidades',
        botonesAccion: [
          {
            id: 'btn-new-apt',
            label: 'Agendar nueva cita',
            variante: 'primary',
            accion: 'seleccionar_especialidad',
          },
        ],
      };
      setMessages((prev) => [...prev, botMsg]);
      setPendingAppointmentAction(null);
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // Main natural language query handler
  const handleSendMessage = async (textToSend?: string) => {
    const rawQuery = (textToSend || inputMessage).trim();
    if (!rawQuery || isLoading) return;

    const userMsg: AssistantMessage = {
      id: `usr-${Date.now()}`,
      remitente: 'usuario',
      texto: rawQuery,
      timestamp: getTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    const lower = rawQuery.toLowerCase();

    // 1. Guardrail check: Clinical symptoms or medical advice inquiry
    const hasClinicalSymptoms =
      lower.includes('me duele') ||
      lower.includes('tengo dolor') ||
      lower.includes('tengo fiebre') ||
      lower.includes('que pastilla') ||
      lower.includes('qué pastilla') ||
      lower.includes('que tomo') ||
      lower.includes('qué tomo') ||
      lower.includes('diagnostico') ||
      lower.includes('diagnóstico') ||
      lower.includes('recet') ||
      lower.includes('tratamiento') ||
      lower.includes('enfermedad');

    if (hasClinicalSymptoms) {
      setIsLoading(false);
      let suggestedSpec = 'Medicina General';
      if (lower.includes('pecho') || lower.includes('corazon') || lower.includes('corazón') || lower.includes('palpitacion')) {
        suggestedSpec = 'Cardiología';
      } else if (lower.includes('piel') || lower.includes('mancha') || lower.includes('grano')) {
        suggestedSpec = 'Dermatología';
      } else if (lower.includes('diente') || lower.includes('muela') || lower.includes('boca')) {
        suggestedSpec = 'Odontología';
      } else if (lower.includes('hijo') || lower.includes('niño') || lower.includes('bebe') || lower.includes('bebé')) {
        suggestedSpec = 'Pediatría';
      }

      const spObj = specialties.find((s) => s.nombre.toLowerCase() === suggestedSpec.toLowerCase()) || specialties[0];
      const matchedDoctors = doctors.filter((d) => d.especialidadId === spObj?.id);

      const botMsg: AssistantMessage = {
        id: `bot-${Date.now() + 1}`,
        remitente: 'asistente',
        texto: `⚠️ **Aviso de Asistencia Automatizada**:\n\nComo asistente automatizado de MediCita, **no realizo diagnósticos médicos ni recomiendo tratamientos**.\n\nMi función está limitada a la orientación y gestión dentro del sistema de citas. Para que un profesional médico colegiado evalúe tus síntomas de forma segura, te sugiero agendar una cita con **${spObj.nombre}**. Estos son los médicos disponibles:`,
        timestamp: getTimeString(),
        tipoRespuesta: 'medicos',
        especialidadSeleccionada: spObj,
        medicosDisponibles: matchedDoctors,
        esAsistenciaAutomatizada: true,
      };

      setMessages((prev) => [...prev, botMsg]);
      return;
    }

    // 2. Intent: View upcoming appointments ("Mostrar mis próximas citas")
    if (
      lower.includes('mis citas') ||
      lower.includes('proximas citas') ||
      lower.includes('próximas citas') ||
      lower.includes('ver citas') ||
      lower.includes('citas programadas')
    ) {
      setIsLoading(false);
      const activeApts = appointments.filter(
        (a) => a.estado === 'confirmada' || a.estado === 'pendiente'
      );
      if (activeApts.length === 0) {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now() + 1}`,
            remitente: 'asistente',
            texto: `Actualmente no tienes citas médicas programadas a tu nombre (${currentUser.nombre} ${currentUser.apellidos}). ¿Deseas consultar nuestras especialidades para agendar una?`,
            timestamp: getTimeString(),
            tipoRespuesta: 'especialidades',
            esAsistenciaAutomatizada: true,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now() + 1}`,
            remitente: 'asistente',
            texto: `Tienes **${activeApts.length} cita(s) programada(s)**. Puedes revisarlas o gestionarlas a continuación:`,
            timestamp: getTimeString(),
            tipoRespuesta: 'mis_citas',
            citasListadas: activeApts,
            esAsistenciaAutomatizada: true,
          },
        ]);
      }
      return;
    }

    // 3. Intent: Cancel appointment
    if (lower.includes('cancelar') && !lower.includes('no cancelar')) {
      setIsLoading(false);
      const activeApts = appointments.filter(
        (a) => a.estado === 'confirmada' || a.estado === 'pendiente'
      );
      if (activeApts.length === 0) {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now() + 1}`,
            remitente: 'asistente',
            texto: `No tienes citas médicas activas para cancelar en este momento.`,
            timestamp: getTimeString(),
            esAsistenciaAutomatizada: true,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now() + 1}`,
            remitente: 'asistente',
            texto: `Con gusto te oriento para cancelar tu cita. Selecciona a continuación la cita que deseas anular:`,
            timestamp: getTimeString(),
            tipoRespuesta: 'mis_citas',
            citasListadas: activeApts,
            esAsistenciaAutomatizada: true,
          },
        ]);
      }
      return;
    }

    // 4. Intent: Reschedule appointment
    if (lower.includes('reprogramar') || lower.includes('cambiar fecha')) {
      setIsLoading(false);
      const activeApts = appointments.filter(
        (a) => a.estado === 'confirmada' || a.estado === 'pendiente'
      );
      if (activeApts.length === 0) {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now() + 1}`,
            remitente: 'asistente',
            texto: `No tienes citas médicas activas para reprogramar.`,
            timestamp: getTimeString(),
            esAsistenciaAutomatizada: true,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now() + 1}`,
            remitente: 'asistente',
            texto: `Para reprogramar tu cita, selecciona cuál de tus turnos deseas mover a una nueva fecha:`,
            timestamp: getTimeString(),
            tipoRespuesta: 'mis_citas',
            citasListadas: activeApts,
            esAsistenciaAutomatizada: true,
          },
        ]);
      }
      return;
    }

    // 5. Intent: Specific Doctor Mention (e.g., "Quiero al Dr. Carlos")
    const matchedDoctor = doctors.find((d) => {
      const nameParts = d.nombre.toLowerCase().replace('dr.', '').replace('dra.', '').trim().split(' ');
      return (
        lower.includes(d.nombre.toLowerCase()) ||
        nameParts.some((part) => part.length > 3 && lower.includes(part))
      );
    });

    if (matchedDoctor) {
      setIsLoading(false);
      setActiveDoctor(matchedDoctor);
      const sp = specialties.find((s) => s.id === matchedDoctor.especialidadId) || null;
      if (sp) setActiveSpecialty(sp);

      const targetDay =
        matchedDoctor.disponibilidad.find(
          (d) => d.slots.filter((s) => s.estado === 'disponible').length > 0
        ) || matchedDoctor.disponibilidad[0];
      setActiveDay(targetDay);

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now() + 1}`,
          remitente: 'asistente',
          texto: `El **${matchedDoctor.nombre}** tiene estos horarios disponibles en **${matchedDoctor.especialidadNombre}** (${matchedDoctor.sede} - ${matchedDoctor.consultorio}):`,
          timestamp: getTimeString(),
          tipoRespuesta: 'horarios',
          medicoSeleccionado: matchedDoctor,
          diaSeleccionado: targetDay as any,
          esAsistenciaAutomatizada: true,
        },
      ]);
      return;
    }

    // 6. Intent: Specific Hour Mention (e.g., "10:00 AM" or "10:00")
    const hourMatch = lower.match(/\b(0[89]|1[012]|0[1-5]):([0-5][0-9])\s*(am|pm)?\b/i) || lower.match(/\b(10:00|08:00|09:00|11:00|02:00|03:00|04:00|05:00)\b/i);
    if (hourMatch && activeDoctor) {
      setIsLoading(false);
      let hourStr = hourMatch[0].toUpperCase();
      if (!hourStr.includes('AM') && !hourStr.includes('PM')) {
        const hourNum = parseInt(hourStr.split(':')[0], 10);
        hourStr = `${hourStr} ${hourNum >= 8 && hourNum <= 11 ? 'AM' : 'PM'}`;
      }

      // Check if slot exists in active day
      const day = activeDay || activeDoctor.disponibilidad[0];
      const fechaFormateada = `${day.diaNombre} ${day.diaNumero} de ${day.mesNombre}`;

      handleSelectSlot(day, hourStr, rawQuery);
      return;
    }

    // 7. Intent: Specific Specialty Mention (e.g., "Quiero una cita con cardiología")
    const matchedSpecialty = specialties.find(
      (s) =>
        lower.includes(s.nombre.toLowerCase()) ||
        (s.nombre.toLowerCase() === 'cardiología' && (lower.includes('cardio') || lower.includes('cardiologia'))) ||
        (s.nombre.toLowerCase() === 'pediatría' && (lower.includes('pediat') || lower.includes('pediatria'))) ||
        (s.nombre.toLowerCase() === 'dermatología' && (lower.includes('derma') || lower.includes('dermatologia'))) ||
        (s.nombre.toLowerCase() === 'odontología' && (lower.includes('odonto') || lower.includes('dental') || lower.includes('odontologia'))) ||
        (s.nombre.toLowerCase() === 'ginecología' && (lower.includes('gineco') || lower.includes('ginecologia'))) ||
        (s.nombre.toLowerCase() === 'medicina general' && lower.includes('general'))
    );

    if (matchedSpecialty) {
      setIsLoading(false);
      setActiveSpecialty(matchedSpecialty);
      const docs = doctors.filter((d) => d.especialidadId === matchedSpecialty.id);

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now() + 1}`,
          remitente: 'asistente',
          texto: `Claro. Estas son las opciones disponibles de **${matchedSpecialty.nombre}**:\n\nSelecciona el médico de tu preferencia o escribe su nombre:`,
          timestamp: getTimeString(),
          tipoRespuesta: 'medicos',
          especialidadSeleccionada: matchedSpecialty,
          medicosDisponibles: docs,
          esAsistenciaAutomatizada: true,
        },
      ]);
      return;
    }

    // 8. Intent: List all specialties
    if (
      lower.includes('especialidad') ||
      lower.includes('especialidades') ||
      lower.includes('catalogo') ||
      lower.includes('servicios')
    ) {
      setIsLoading(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now() + 1}`,
          remitente: 'asistente',
          texto: `En MediCita contamos con **${specialties.length} especialidades médicas**. Puedes elegir una de ellas para ver sus médicos disponibles:`,
          timestamp: getTimeString(),
          tipoRespuesta: 'especialidades',
          esAsistenciaAutomatizada: true,
        },
      ]);
      return;
    }

    // 9. Intent: Controlled message when asking for non-existing medical specialty or doctor
    if (
      lower.includes('neurolog') ||
      lower.includes('oftalmo') ||
      lower.includes('traumato') ||
      lower.includes('oncol') ||
      lower.includes('psiquiat') ||
      lower.includes('urolog') ||
      lower.includes('house')
    ) {
      setIsLoading(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now() + 1}`,
          remitente: 'asistente',
          texto: `No encontramos la especialidad o profesional solicitado en nuestro catálogo actual. En MediCita disponemos de:\n\n• **Cardiología**\n• **Pediatría**\n• **Medicina General**\n• **Dermatología**\n• **Odontología**\n• **Ginecología**\n\n¿Deseas agendar con alguna de estas especialidades?`,
          timestamp: getTimeString(),
          tipoRespuesta: 'especialidades',
          esAsistenciaAutomatizada: true,
        },
      ]);
      return;
    }

    // 10. Intent: Incomplete appointment request (e.g., "Quiero cita para mañana", "Necesito un turno", "Quiero una cita")
    const isIncompleteBookingRequest =
      (lower.includes('quiero cita') ||
        lower.includes('necesito cita') ||
        lower.includes('agendar cita') ||
        lower.includes('quiero un turno') ||
        lower.includes('necesito un turno') ||
        lower.includes('sacar cita') ||
        lower.includes('cita para mañana') ||
        lower.includes('turno para mañana') ||
        lower.includes('cita hoy')) &&
      !matchedSpecialty &&
      !matchedDoctor;

    if (isIncompleteBookingRequest) {
      setIsLoading(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now() + 1}`,
          remitente: 'asistente',
          texto: `Con gusto te oriento para programar tu cita. Para encontrar los turnos y consultorios correctos, por favor indícame:\n\n• ¿Para qué **especialidad médica** requieres la cita?\n• O si tienes preferencia, ¿con qué **médico especialista** deseas atenderte?\n\nTambién puedes seleccionar directamente una de nuestras especialidades disponibles a continuación:`,
          timestamp: getTimeString(),
          tipoRespuesta: 'especialidades',
          esAsistenciaAutomatizada: true,
        },
      ]);
      return;
    }

    // 11. Call the intelligent server endpoint for advanced conversational routing
    try {
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensaje: rawQuery,
          historial: messages.slice(-5).map((m) => ({ remitente: m.remitente, texto: m.texto })),
          contexto: {
            pacienteNombre: currentUser.nombre,
            especialidadActual: activeSpecialty?.nombre,
            medicoActual: activeDoctor?.nombre,
            fechaActual: activeDay?.fecha,
            horaActual: activeHour,
          },
        }),
      });

      if (!res.ok) throw new Error('API assistant error');
      const data = await res.json();

      let botResponse = data.respuesta || 'Entendido. ¿Cómo deseas continuar con tu cita?';
      let meta = data.meta || {};

      let responseType: AssistantMessage['tipoRespuesta'] = 'texto';
      let docToPass: Doctor | undefined = undefined;
      let specToPass: Specialty | undefined = undefined;
      let docsList: Doctor[] | undefined = undefined;

      if (meta.intencion === 'buscar_especialidad') {
        responseType = 'especialidades';
      } else if (meta.intencion === 'buscar_medico' && meta.especialidad) {
        const sp = specialties.find(
          (s) => s.nombre.toLowerCase() === meta.especialidad.toLowerCase()
        );
        if (sp) {
          specToPass = sp;
          docsList = doctors.filter((d) => d.especialidadId === sp.id);
          responseType = 'medicos';
        }
      } else if (meta.intencion === 'consultar_horarios' && (meta.medicoNombre || meta.medicoId)) {
        const doc = doctors.find(
          (d) => d.id === meta.medicoId || d.nombre.toLowerCase().includes(meta.medicoNombre?.toLowerCase())
        );
        if (doc) {
          docToPass = doc;
          setActiveDoctor(doc);
          responseType = 'horarios';
        }
      } else if (meta.intencion === 'ver_citas') {
        responseType = 'mis_citas';
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now() + 1}`,
          remitente: 'asistente',
          texto: botResponse,
          timestamp: getTimeString(),
          tipoRespuesta: responseType,
          medicoSeleccionado: docToPass,
          especialidadSeleccionada: specToPass,
          medicosDisponibles: docsList,
          citasListadas: responseType === 'mis_citas' ? appointments.filter((a) => a.estado === 'confirmada' || a.estado === 'pendiente') : undefined,
          esAsistenciaAutomatizada: true,
        },
      ]);
    } catch {
      // Friendly fallback if network is interrupted
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now() + 1}`,
          remitente: 'asistente',
          texto: `Con gusto te ayudo con la gestión de tus citas. Puedes indicarme la especialidad médica, el nombre del doctor o consultar tus próximas citas programadas.`,
          timestamp: getTimeString(),
          tipoRespuesta: 'especialidades',
          esAsistenciaAutomatizada: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-12">
      {/* Informative Header with Explicit Disclaimer & Automated Assistance Identity */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-cyan-600 text-white flex items-center justify-center shadow-md shadow-cyan-600/20 shrink-0">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-bold text-base sm:text-lg text-slate-900">
                  Asistente Automatizado de Citas
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 text-[11px] font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Asistencia Automatizada</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Gestión inteligente de turnos, médicos, disponibilidad de horarios y citas en MediCita
              </p>
            </div>
          </div>

          <button
            id="reset-assistant-conversation-btn"
            onClick={() => {
              setActiveSpecialty(null);
              setActiveDoctor(null);
              setActiveDay(null);
              setActiveHour(null);
              setPendingAppointmentAction(null);
              setMessages([initialGreeting]);
            }}
            className="self-start sm:self-auto px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-600 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reiniciar conversación</span>
          </button>
        </div>

        {/* Regulatory & Safety Notice Banner */}
        <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-900 leading-relaxed">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Aviso importante de atención:</span> El asistente{' '}
            <span className="font-semibold underline decoration-amber-400">NO realiza diagnósticos médicos</span>,{' '}
            <span className="font-semibold underline decoration-amber-400">NO recomienda tratamientos</span> ni interpreta síntomas como diagnóstico clínico. Su función está estrictamente limitada a la gestión y orientación dentro del sistema de citas de MediCita.
          </div>
        </div>
      </div>

      {/* Main Chat Box Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[600px] overflow-hidden">
        {/* Messages List Area */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-5">
          {messages.map((msg) => {
            const isBot = msg.remitente === 'asistente';

            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-2xl ${isBot ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    isBot ? 'bg-cyan-100 text-cyan-700' : 'bg-blue-600 text-white'
                  }`}
                >
                  {isBot ? <Sparkles className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                {/* Message Bubble & Interactive Cards */}
                <div className="space-y-3 min-w-0 w-full">
                  {/* Bubble */}
                  <div
                    className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      isBot
                        ? 'bg-slate-50 border border-slate-200 text-slate-800'
                        : 'bg-blue-600 text-white rounded-tr-xs ml-auto max-w-fit'
                    }`}
                  >
                    {isBot && msg.esAsistenciaAutomatizada && (
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-cyan-800 uppercase tracking-wider mb-1.5 pb-1 border-b border-slate-200/80">
                        <Sparkles className="w-3 h-3 text-cyan-600" />
                        <span>Respuesta automatizada MediCita</span>
                      </div>
                    )}
                    <p className="whitespace-pre-line">{msg.texto}</p>
                    <span
                      className={`block text-[10px] mt-2 ${
                        isBot ? 'text-slate-400' : 'text-blue-200'
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                  </div>

                  {/* 1. Interactive Specialty Selector Card */}
                  {isBot && msg.tipoRespuesta === 'especialidades' && (
                    <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-2.5 animate-in fade-in">
                      <p className="text-xs font-bold text-blue-900">
                        Selecciona una especialidad para ver médicos y horarios:
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {specialties.map((sp) => (
                          <button
                            key={sp.id}
                            onClick={() => handleSelectSpecialty(sp)}
                            className="p-2.5 rounded-xl bg-white border border-blue-100 hover:border-blue-400 hover:bg-blue-50 text-left transition-all group shadow-2xs"
                          >
                            <p className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                              {sp.nombre}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              {sp.doctoresCount} médicos disponibles
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 2. Interactive Doctor Cards List */}
                  {isBot && msg.tipoRespuesta === 'medicos' && msg.medicosDisponibles && (
                    <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-2.5 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-900">
                          Médicos disponibles en {msg.especialidadSeleccionada?.nombre || 'la especialidad'}:
                        </span>
                      </div>

                      <div className="space-y-2">
                        {msg.medicosDisponibles.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-blue-100 hover:border-blue-300 transition-all shadow-2xs"
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={doc.fotoUrl}
                                alt={doc.nombre}
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?auto=format&fit=crop&q=80&w=400';
                                }}
                                className="w-11 h-11 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
                              />
                              <div className="text-xs">
                                <h4 className="font-bold text-slate-900">{doc.nombre}</h4>
                                <p className="text-blue-600 font-semibold">{doc.especialidadNombre}</p>
                                <p className="text-[11px] text-slate-500">
                                  {doc.sede} • {doc.consultorio}
                                </p>
                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                  {doc.colegiatura}
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={() => handleSelectDoctor(doc)}
                              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shrink-0 flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                            >
                              <span>Ver horarios</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3. Interactive Doctor Available Slots Selector */}
                  {isBot && msg.tipoRespuesta === 'horarios' && msg.medicoSeleccionado && (
                    <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-2xl space-y-3 animate-in fade-in">
                      <div className="flex items-center justify-between gap-2 border-b border-blue-200 pb-2">
                        <div className="text-xs">
                          <p className="font-bold text-blue-900">
                            Turnos disponibles con {msg.medicoSeleccionado.nombre}
                          </p>
                          <p className="text-[11px] text-blue-700">
                            {msg.medicoSeleccionado.sede} • Consulta: S/. {msg.medicoSeleccionado.precioConsulta}
                          </p>
                        </div>
                      </div>

                      {/* Day Tabs */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-600">
                          Selecciona el día de atención:
                        </label>
                        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                          {msg.medicoSeleccionado.disponibilidad.map((day) => {
                            const isSelected = activeDay?.fecha === day.fecha;
                            const hasFreeSlots =
                              day.slots.filter((s) => s.estado === 'disponible').length > 0;

                            return (
                              <button
                                key={day.fecha}
                                onClick={() => setActiveDay(day)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all text-center border ${
                                  isSelected
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                    : hasFreeSlots
                                    ? 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
                                    : 'bg-slate-100 text-slate-400 border-slate-200 opacity-60'
                                }`}
                              >
                                <p className="text-[10px] uppercase font-bold">{day.diaNombre}</p>
                                <p className="text-sm font-bold">
                                  {day.diaNumero} {day.mesNombre}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Hours Slots Grid */}
                      {activeDay && (
                        <div className="space-y-1.5 bg-white p-3 rounded-xl border border-blue-100">
                          <p className="text-[11px] font-bold text-slate-700">
                            Horas disponibles para el {activeDay.diaNombre} {activeDay.diaNumero} de{' '}
                            {activeDay.mesNombre}:
                          </p>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
                            {activeDay.slots.map((slot) => {
                              const isFree = slot.estado === 'disponible';
                              const isSelected = activeHour === slot.hora;

                              return (
                                <button
                                  key={slot.id}
                                  disabled={!isFree}
                                  onClick={() => handleSelectSlot(activeDay, slot.hora)}
                                  className={`px-2.5 py-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1 ${
                                    isSelected
                                      ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-300'
                                      : isFree
                                      ? 'bg-white hover:bg-blue-50 text-slate-800 border-slate-200 hover:border-blue-400'
                                      : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through'
                                  }`}
                                >
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  <span>{slot.hora}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 4. Interactive Booking Confirmation Card (Confirmar / Cambiar horario) */}
                  {isBot && msg.tipoRespuesta === 'confirmar_reserva' && msg.medicoSeleccionado && (
                    <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-3.5 animate-in fade-in">
                      <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                        <Calendar className="w-4 h-4 text-emerald-600" />
                        <span>Resumen para confirmación de cita:</span>
                      </div>

                      <div className="bg-white p-3.5 rounded-xl border border-emerald-100 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Paciente:</span>
                          <span className="font-bold text-slate-900">
                            {currentUser.nombre} {currentUser.apellidos}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Médico:</span>
                          <span className="font-bold text-slate-900">
                            {msg.medicoSeleccionado.nombre}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Especialidad:</span>
                          <span className="font-semibold text-blue-700">
                            {msg.medicoSeleccionado.especialidadNombre}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Fecha y Hora:</span>
                          <span className="font-bold text-emerald-700">
                            {msg.fechaFormateada} a las {msg.horaSeleccionada}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Ubicación:</span>
                          <span className="text-slate-700">
                            {msg.medicoSeleccionado.sede} ({msg.medicoSeleccionado.consultorio})
                          </span>
                        </div>
                      </div>

                      {/* Required Action Buttons: Confirmar & Cambiar horario */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          id="btn-assistant-confirm-booking"
                          onClick={() => {
                            if (msg.medicoSeleccionado && msg.fechaSeleccionada && msg.horaSeleccionada && msg.fechaFormateada) {
                              handleConfirmAppointment(
                                msg.medicoSeleccionado,
                                msg.fechaSeleccionada,
                                msg.fechaFormateada,
                                msg.horaSeleccionada
                              );
                            }
                          }}
                          disabled={isLoading}
                          className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Check className="w-4 h-4" />
                          <span>Confirmar</span>
                        </button>

                        <button
                          id="btn-assistant-change-booking-time"
                          onClick={() => {
                            if (msg.medicoSeleccionado) {
                              handleSelectDoctor(msg.medicoSeleccionado, 'Deseo cambiar el horario');
                            }
                          }}
                          className="py-2.5 px-4 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors"
                        >
                          Cambiar horario
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 5. Cita Confirmada Result Card */}
                  {isBot && msg.tipoRespuesta === 'cita_confirmada' && msg.citaEnProceso && (
                    <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl space-y-3 animate-in fade-in">
                      <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span>Comprobante de Reserva Generado</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-emerald-100 text-xs space-y-1.5">
                        <p>
                          <span className="text-slate-500">Código de cita:</span>{' '}
                          <span className="font-mono font-bold text-blue-700">
                            {msg.citaEnProceso.codigo}
                          </span>
                        </p>
                        <p>
                          <span className="text-slate-500">Estado:</span>{' '}
                          <span className="font-bold text-emerald-700 capitalize">
                            {msg.citaEnProceso.estado}
                          </span>
                        </p>
                        <p className="text-slate-600 text-[11px] pt-1">
                          Presentarse con 10 minutos de anticipación y portar su DNI en el módulo de admisión.
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => onNavigate('mis-citas')}
                          className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <span>Ver en Mis Citas</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setActiveDoctor(null);
                            setActiveSpecialty(null);
                            setMessages((prev) => [
                              ...prev,
                              {
                                id: `bot-${Date.now()}`,
                                remitente: 'asistente',
                                texto: '¿Con qué otra especialidad o médico deseas agendar?',
                                timestamp: getTimeString(),
                                tipoRespuesta: 'especialidades',
                                esAsistenciaAutomatizada: true,
                              },
                            ]);
                          }}
                          className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors"
                        >
                          Agendar otra cita
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 6. List of User's Appointments ("Mostrar mis próximas citas") */}
                  {isBot && msg.tipoRespuesta === 'mis_citas' && msg.citasListadas && (
                    <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-2.5 animate-in fade-in">
                      <p className="text-xs font-bold text-blue-900">
                        Tus próximas citas registradas:
                      </p>
                      <div className="space-y-2.5">
                        {msg.citasListadas.map((apt) => (
                          <div
                            key={apt.id}
                            className="bg-white p-3.5 rounded-xl border border-blue-100 shadow-2xs space-y-2 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-blue-700">{apt.codigo}</span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 capitalize">
                                {apt.estado}
                              </span>
                            </div>

                            <div className="space-y-0.5">
                              <h4 className="font-bold text-slate-900">{apt.medicoNombre}</h4>
                              <p className="text-blue-600 font-semibold">{apt.especialidadNombre}</p>
                              <p className="text-slate-500 text-[11px]">
                                {apt.fechaFormateada} • {apt.hora}
                              </p>
                              <p className="text-slate-400 text-[11px]">
                                {apt.sede} - {apt.consultorio}
                              </p>
                            </div>

                            {/* Actions for this appointment: Reprogramar / Cancelar */}
                            <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                              <button
                                onClick={() => {
                                  if (onOpenReschedule) {
                                    onOpenReschedule(apt);
                                  } else {
                                    const doc = doctors.find((d) => d.id === apt.medicoId);
                                    if (doc) handleSelectDoctor(doc, `Reprogramar cita ${apt.codigo}`);
                                  }
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs transition-colors flex items-center gap-1"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Reprogramar</span>
                              </button>

                              <button
                                onClick={() => {
                                  setPendingAppointmentAction(apt);
                                  setMessages((prev) => [
                                    ...prev,
                                    {
                                      id: `usr-${Date.now()}`,
                                      remitente: 'usuario',
                                      texto: `Deseo cancelar la cita ${apt.codigo}`,
                                      timestamp: getTimeString(),
                                    },
                                    {
                                      id: `bot-${Date.now() + 1}`,
                                      remitente: 'asistente',
                                      texto: `¿Confirmas que deseas cancelar tu cita **${apt.codigo}** con el **${apt.medicoNombre}** para el **${apt.fechaFormateada} a las ${apt.hora}**?\n\nEsta acción liberará el cupo en el sistema.`,
                                      timestamp: getTimeString(),
                                      tipoRespuesta: 'cancelar_cita',
                                      citaEnProceso: apt,
                                      esAsistenciaAutomatizada: true,
                                    },
                                  ]);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition-colors flex items-center gap-1"
                              >
                                <XCircle className="w-3 h-3" />
                                <span>Cancelar cita</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 7. Interactive Cancellation Confirmation Card */}
                  {isBot && msg.tipoRespuesta === 'cancelar_cita' && msg.citaEnProceso && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl space-y-3 animate-in fade-in">
                      <p className="text-xs font-bold text-rose-900">
                        Confirmación de cancelación para la cita {msg.citaEnProceso.codigo}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleConfirmCancelInChat(msg.citaEnProceso!)}
                          disabled={isLoading}
                          className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors"
                        >
                          Sí, cancelar cita
                        </button>
                        <button
                          onClick={() => {
                            setPendingAppointmentAction(null);
                            setMessages((prev) => [
                              ...prev,
                              {
                                id: `bot-${Date.now()}`,
                                remitente: 'asistente',
                                texto: 'Tu cita se mantiene activa y programada.',
                                timestamp: getTimeString(),
                                esAsistenciaAutomatizada: true,
                              },
                            ]);
                          }}
                          className="py-2 px-3 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors"
                        >
                          Mantener cita
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Generic Action Buttons */}
                  {isBot && msg.botonesAccion && msg.tipoRespuesta !== 'confirmar_reserva' && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {msg.botonesAccion.map((btn) => (
                        <button
                          key={btn.id}
                          onClick={() => {
                            if (btn.accion === 'ver_mis_citas') {
                              onNavigate('mis-citas');
                            } else if (btn.accion === 'seleccionar_especialidad') {
                              handleSendMessage('¿Qué especialidades tienen?');
                            } else if (btn.accion === 'reiniciar') {
                              setActiveDoctor(null);
                              setActiveSpecialty(null);
                              setActiveDay(null);
                              setActiveHour(null);
                              setMessages([initialGreeting]);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            btn.variante === 'primary'
                              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                              : 'bg-white border border-slate-300 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-3 mr-auto">
              <div className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-500 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce delay-100" />
                <div className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce delay-200" />
                <span>Consultando disponibilidad en el sistema...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts Bar */}
        <div className="p-2.5 bg-slate-50/80 border-t border-slate-200 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide shrink-0 mr-1">
              Sugerencias rápidas:
            </span>
            {quickPrompts.map((q) => (
              <button
                key={q}
                onClick={() => handleSendMessage(q)}
                disabled={isLoading}
                className="px-2.5 py-1 rounded-full bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-700 text-slate-600 text-xs whitespace-nowrap transition-colors shadow-2xs disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              id="ai-assistant-user-input"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Escribe lo que necesitas (ej: Quiero una cita con cardiología, Quiero al Dr. Carlos, 10:00 AM)..."
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 disabled:opacity-60 placeholder:text-slate-400"
            />
            <button
              id="ai-assistant-send-btn"
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-cyan-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Enviar</span>
            </button>
          </form>

          <p className="text-[10px] text-slate-400 text-center mt-2 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3 text-slate-400" />
            <span>Asistencia automatizada exclusiva para gestión de citas. No emite diagnósticos ni prescribe medicamentos.</span>
          </p>
        </div>
      </div>
    </div>
  );
};
