export type UserRole = 'paciente' | 'medico' | 'admin';

export interface User {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  rol: UserRole;
  dni: string;
  telefono: string;
  avatarUrl?: string;
  seguroEps?: string;
  planSalud?: string;
  numeroAfiliacion?: string;
  fechaNacimiento?: string;
  genero?: string;
  doctorProfileId?: string;
}

export interface Specialty {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string;
  color: string;
  doctoresCount: number;
  precioBase: number;
  sintomasFrecuentes: string[];
}

export interface TimeSlot {
  id: string;
  hora: string;
  periodo: 'mañana' | 'tarde';
  estado: 'disponible' | 'ocupado' | 'bloqueado';
}

export interface DoctorAvailabilityDay {
  fecha: string; // YYYY-MM-DD
  diaNombre: string; // e.g. "Jueves"
  diaNumero: string; // e.g. "24"
  mesNombre: string; // e.g. "Oct"
  disponibilidadNivel: 'alta' | 'media' | 'baja' | 'agotada';
  cuposDisponibles: number;
  slots: TimeSlot[];
}

export interface Doctor {
  id: string;
  nombre: string;
  especialidadId: string;
  especialidadNombre: string;
  colegiatura: string; // e.g. "CMP 48920"
  experiencia: string; // e.g. "14 años"
  calificacion: number; // e.g. 4.9
  opinionesCount: number; // e.g. 142
  sede: string; // e.g. "Torre Médica Central"
  consultorio: string; // e.g. "Cons. 402 - Piso 4"
  fotoUrl: string;
  bio: string;
  diasAtencion: string[];
  disponibilidad: DoctorAvailabilityDay[];
  precioConsulta: number;
}

export type AppointmentStatus = 'pendiente' | 'confirmada' | 'atendida' | 'cancelada';

export interface Appointment {
  id: string;
  codigo: string; // e.g. "#MED-84920"
  pacienteId: string;
  pacienteNombre: string;
  pacienteDni: string;
  pacienteTelefono: string;
  pacienteEmail: string;
  medicoId: string;
  medicoNombre: string;
  medicoFoto: string;
  medicoColegiatura: string;
  especialidadId: string;
  especialidadNombre: string;
  sede: string;
  consultorio: string;
  fecha: string; // YYYY-MM-DD
  fechaFormateada: string;
  hora: string;
  motivo: string;
  sintomasPrevios?: string[];
  estado: AppointmentStatus;
  fechaCreacion: string;
  costoTotal: number;
  coberturaEps: number;
  copago: number;
  indicacionesClinicas?: string[];
  motivoCancelacion?: string;
  notasMedicas?: string;
  recetaMedica?: string;
}

export interface NotificationAlert {
  id: string;
  tipo: 'cita_confirmada' | 'cita_reprogramada' | 'cita_cancelada' | 'recordatorio' | 'laboratorio' | 'asistente';
  titulo: string;
  mensaje: string;
  fecha: string;
  hora: string;
  leida: boolean;
  citaId?: string;
  urgencia?: 'alta' | 'media' | 'baja';
}

export interface AssistantActionBtn {
  id: string;
  label: string;
  variante?: 'primary' | 'secondary' | 'danger' | 'outline';
  accion: 'confirmar_cita' | 'cambiar_horario' | 'seleccionar_medico' | 'seleccionar_especialidad' | 'seleccionar_hora' | 'ver_mis_citas' | 'cancelar_cita' | 'reprogramar_cita' | 'reiniciar';
  payload?: any;
}

export interface AssistantMessage {
  id: string;
  remitente: 'usuario' | 'asistente';
  texto: string;
  timestamp: string;
  recomendacionEspecialidad?: string;
  doctorRecomendadoId?: string;
  tipoRespuesta?:
    | 'texto'
    | 'especialidades'
    | 'medicos'
    | 'horarios'
    | 'confirmar_reserva'
    | 'cita_confirmada'
    | 'mis_citas'
    | 'cancelar_cita'
    | 'reprogramar_cita'
    | 'aviso_no_diagnostico'
    | 'no_encontrado';
  medicosDisponibles?: Doctor[];
  especialidadSeleccionada?: Specialty;
  medicoSeleccionado?: Doctor;
  diaSeleccionado?: DoctorAvailabilityDay;
  fechaSeleccionada?: string;
  fechaFormateada?: string;
  horaSeleccionada?: string;
  citasListadas?: Appointment[];
  citaEnProceso?: Appointment;
  botonesAccion?: AssistantActionBtn[];
  esAsistenciaAutomatizada?: boolean;
  accionSugerida?: {
    tipo: 'agendar_cita' | 'ver_medico' | 'ver_citas';
    payload?: string;
    label: string;
  };
}
