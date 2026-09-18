/**
 * Backend Data Models and DTOs
 * Structured strictly according to the Node.js + Prisma backend specifications.
 */

// -------------------------------------------------------------
// ENUMS
// -------------------------------------------------------------

export type RolUsuarioBackend = 'PACIENTE' | 'MEDICO' | 'ADMIN';

export type EstadoCitaBackend = 'PENDIENTE' | 'CONFIRMADA' | 'ATENDIDA' | 'CANCELADA';

export type TipoAlertaBackend =
  | 'CITA_CONFIRMADA'
  | 'CITA_REPROGRAMADA'
  | 'CITA_CANCELADA'
  | 'RECORDATORIO'
  | 'AVISO_CLINICO'
  | 'SISTEMA';

// -------------------------------------------------------------
// ENTIDADES PRINCIPALES (Prisma ORM Equivalent)
// -------------------------------------------------------------

/**
 * Entidad Usuario:
 * - id
 * - correo
 * - contraseña/autenticación (hash seguro en servidor, no expuesto al cliente)
 * - rol
 */
export interface UsuarioEntity {
  id: string;
  correo: string;
  contrasenaHash?: string; // Omitido en respuestas seguras del cliente
  rol: RolUsuarioBackend;
  activo?: boolean;
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Entidad Paciente:
 * - id
 * - usuarioId
 * - nombres
 * - apellidos
 * - DNI
 * - teléfono
 */
export interface PacienteEntity {
  id: string;
  usuarioId: string;
  nombres: string;
  apellidos: string;
  dni: string;
  telefono: string;
  fechaNacimiento?: string;
  genero?: string;
  seguroEps?: string;
  planSalud?: string;
  numeroAfiliacion?: string;
  direccion?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Entidad Médico:
 * - id
 * - nombres
 * - apellidos
 * - especialidadId
 * - información profesional
 * - disponibilidad
 */
export interface MedicoInformacionProfesional {
  colegiatura: string;
  rne?: string;
  experiencia: string;
  calificacion: number;
  opinionesCount: number;
  sede: string;
  consultorio: string;
  fotoUrl?: string;
  bio: string;
  precioConsulta: number;
}

export interface MedicoEntity {
  id: string;
  usuarioId?: string;
  nombres: string;
  apellidos: string;
  especialidadId: string;
  informacionProfesional: MedicoInformacionProfesional;
  disponibilidad: any; // Matriz estructurada de días y turnos
  activo?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Entidad Especialidad:
 * - id
 * - nombre
 * - descripción
 */
export interface EspecialidadEntity {
  id: string;
  nombre: string;
  descripcion: string;
  icono?: string;
  color?: string;
  precioBase?: number;
  sintomasFrecuentes?: string[];
  activa?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Entidad Cita:
 * - id
 * - pacienteId
 * - medicoId
 * - fecha
 * - hora
 * - motivo
 * - estado
 */
export interface CitaEntity {
  id: string;
  codigo?: string;
  pacienteId: string;
  medicoId: string;
  especialidadId?: string;
  fecha: string;
  hora: string;
  motivo: string;
  estado: EstadoCitaBackend;
  sintomasPrevios?: string[];
  costoTotal?: number;
  coberturaEps?: number;
  copago?: number;
  motivoCancelacion?: string;
  notasMedicas?: string;
  recetaMedica?: string;
  indicacionesPrevias?: string[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Entidad Alerta:
 * - id
 * - usuarioId
 * - mensaje
 * - tipo
 * - fecha
 * - leída
 */
export interface AlertaEntity {
  id: string;
  usuarioId: string;
  mensaje: string;
  titulo?: string;
  tipo: TipoAlertaBackend;
  fecha: string;
  leida: boolean;
  citaId?: string;
  urgencia?: 'ALTA' | 'MEDIA' | 'BAJA';
  createdAt?: string;
  updatedAt?: string;
}

// -------------------------------------------------------------
// DTOs (Data Transfer Objects para API y Servicios)
// -------------------------------------------------------------

export interface LoginDTO {
  correo: string;
  contrasena: string;
}

export interface AuthResponseDTO {
  token: string;
  usuario: UsuarioEntity;
  paciente?: PacienteEntity;
  medico?: MedicoEntity;
}

export interface CreateUsuarioDTO {
  correo: string;
  contrasena: string;
  rol: RolUsuarioBackend;
}

export interface CreatePacienteDTO {
  usuarioId: string;
  nombres: string;
  apellidos: string;
  dni: string;
  telefono: string;
  seguroEps?: string;
  planSalud?: string;
  numeroAfiliacion?: string;
}

export interface CreateCitaDTO {
  pacienteId: string;
  medicoId: string;
  especialidadId: string;
  fecha: string;
  hora: string;
  motivo: string;
  sintomasPrevios?: string[];
}

export interface ReprogramarCitaDTO {
  nuevaFecha: string;
  nuevaHora: string;
  motivo?: string;
}

export interface CancelarCitaDTO {
  motivo: string;
}

export interface CreateAlertaDTO {
  usuarioId: string;
  mensaje: string;
  titulo?: string;
  tipo: TipoAlertaBackend;
  citaId?: string;
  urgencia?: 'ALTA' | 'MEDIA' | 'BAJA';
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
