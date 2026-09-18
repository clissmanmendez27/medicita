/**
 * Express Backend Routes & Services Layer
 * Conceptual and functional equivalent of Node.js backend services:
 * - usuarioService
 * - pacienteService
 * - medicoService
 * - especialidadService
 * - citaService
 * - alertaService
 *
 * Backed by mock in-memory store matching the Prisma ORM schema (prisma/schema.prisma)
 */

import { Router, Request, Response } from 'express';
import {
  INITIAL_USERS,
  INITIAL_DOCTORS,
  INITIAL_SPECIALTIES,
  INITIAL_APPOINTMENTS,
  INITIAL_NOTIFICATIONS,
} from '../data/seedData';
import { User, Doctor, Appointment, NotificationAlert } from '../types';

export const backendRouter = Router();

// In-memory persistent state for the Node.js server lifecycle
let serverUsers: User[] = [...INITIAL_USERS];
let serverDoctors: Doctor[] = JSON.parse(JSON.stringify(INITIAL_DOCTORS));
let serverSpecialties = [...INITIAL_SPECIALTIES];
let serverAppointments: Appointment[] = [...INITIAL_APPOINTMENTS];
let serverAlerts: NotificationAlert[] = [...INITIAL_NOTIFICATIONS];

// -------------------------------------------------------------
// STATUS / PRISMA SCHEMA INFO
// -------------------------------------------------------------
backendRouter.get('/backend/status', (req: Request, res: Response) => {
  res.json({
    status: 'online',
    framework: 'Node.js (Express)',
    orm: 'Prisma ORM',
    schemaPath: 'prisma/schema.prisma',
    entities: ['Usuario', 'Paciente', 'Medico', 'Especialidad', 'Cita', 'Alerta'],
    services: [
      'usuarioService',
      'pacienteService',
      'medicoService',
      'especialidadService',
      'citaService',
      'alertaService',
    ],
    timestamp: new Date().toISOString(),
  });
});

// -------------------------------------------------------------
// AUTENTICACIÓN (authService)
// -------------------------------------------------------------
backendRouter.post('/auth/login', (req: Request, res: Response) => {
  const { correo, contrasena } = req.body;
  if (!correo) {
    return res.status(400).json({ error: 'El correo electrónico es requerido.' });
  }

  const user = serverUsers.find((u) => u.email.toLowerCase() === String(correo).trim().toLowerCase());
  if (!user) {
    return res.status(401).json({ error: 'Credenciales inválidas. Usuario no encontrado.' });
  }

  // Generar token JWT simulado seguro (sin credenciales expuestas)
  const token = `jwt_session_${Buffer.from(user.id + ':' + Date.now()).toString('base64')}`;

  const paciente = user.rol === 'paciente' ? {
    id: `pac-${user.id}`,
    usuarioId: user.id,
    nombres: user.nombre,
    apellidos: user.apellidos,
    dni: user.dni,
    telefono: user.telefono,
    seguroEps: user.seguroEps,
    planSalud: user.planSalud,
  } : undefined;

  return res.json({
    token,
    usuario: {
      id: user.id,
      correo: user.email,
      rol: user.rol.toUpperCase(),
      activo: true,
      avatarUrl: user.avatarUrl,
    },
    paciente,
  });
});

backendRouter.post('/auth/register', (req: Request, res: Response) => {
  const { correo, contrasena, nombres, apellidos, dni, telefono, seguroEps, planSalud } = req.body;

  if (!correo || !nombres || !dni) {
    return res.status(400).json({ error: 'Faltan campos obligatorios para el registro.' });
  }

  if (serverUsers.some((u) => u.email.toLowerCase() === String(correo).toLowerCase())) {
    return res.status(409).json({ error: 'Ya existe un usuario con este correo electrónico.' });
  }

  if (serverUsers.some((u) => u.dni === String(dni))) {
    return res.status(409).json({ error: 'El DNI ingresado ya se encuentra registrado.' });
  }

  const newId = `user-${Date.now()}`;
  const newUser: User = {
    id: newId,
    nombre: nombres,
    apellidos: apellidos || '',
    email: correo,
    rol: 'paciente',
    dni,
    telefono: telefono || '',
    seguroEps,
    planSalud,
    avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${nombres}`,
  };

  serverUsers.unshift(newUser);

  const token = `jwt_session_${Buffer.from(newId + ':' + Date.now()).toString('base64')}`;

  return res.status(201).json({
    token,
    usuario: {
      id: newId,
      correo,
      rol: 'PACIENTE',
      activo: true,
      avatarUrl: newUser.avatarUrl,
    },
    paciente: {
      id: `pac-${newId}`,
      usuarioId: newId,
      nombres,
      apellidos,
      dni,
      telefono,
      seguroEps,
      planSalud,
    },
  });
});

// -------------------------------------------------------------
// USUARIOS (usuarioService)
// -------------------------------------------------------------
backendRouter.get('/usuarios', (req: Request, res: Response) => {
  const sanitized = serverUsers.map((u) => ({
    id: u.id,
    correo: u.email,
    rol: u.rol.toUpperCase(),
    activo: true,
    avatarUrl: u.avatarUrl,
  }));
  res.json(sanitized);
});

backendRouter.get('/usuarios/:id', (req: Request, res: Response) => {
  const user = serverUsers.find((u) => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }
  res.json({
    id: user.id,
    correo: user.email,
    rol: user.rol.toUpperCase(),
    activo: true,
    avatarUrl: user.avatarUrl,
  });
});

// -------------------------------------------------------------
// PACIENTES (pacienteService)
// -------------------------------------------------------------
backendRouter.get('/pacientes', (req: Request, res: Response) => {
  const pacientes = serverUsers
    .filter((u) => u.rol === 'paciente')
    .map((u) => ({
      id: `pac-${u.id}`,
      usuarioId: u.id,
      nombres: u.nombre,
      apellidos: u.apellidos,
      dni: u.dni,
      telefono: u.telefono,
      seguroEps: u.seguroEps,
      planSalud: u.planSalud,
      numeroAfiliacion: u.numeroAfiliacion,
    }));
  res.json(pacientes);
});

backendRouter.get('/pacientes/usuario/:usuarioId', (req: Request, res: Response) => {
  const u = serverUsers.find((user) => user.id === req.params.usuarioId);
  if (!u) {
    return res.status(404).json({ error: 'Paciente no encontrado para este usuario' });
  }
  res.json({
    id: `pac-${u.id}`,
    usuarioId: u.id,
    nombres: u.nombre,
    apellidos: u.apellidos,
    dni: u.dni,
    telefono: u.telefono,
    seguroEps: u.seguroEps,
  });
});

// -------------------------------------------------------------
// MÉDICOS (medicoService)
// -------------------------------------------------------------
backendRouter.get('/medicos', (req: Request, res: Response) => {
  const { especialidadId, format } = req.query;
  let list = serverDoctors;

  if (especialidadId) {
    list = list.filter((d) => d.especialidadId === String(especialidadId));
  }

  if (format === 'ui') {
    return res.json(list);
  }

  const entities = list.map((d) => ({
    id: d.id,
    nombres: d.nombre,
    apellidos: '',
    especialidadId: d.especialidadId,
    informacionProfesional: {
      colegiatura: d.colegiatura,
      experiencia: d.experiencia,
      calificacion: d.calificacion,
      opinionesCount: d.opinionesCount,
      sede: d.sede,
      consultorio: d.consultorio,
      fotoUrl: d.fotoUrl,
      bio: d.bio,
      precioConsulta: d.precioConsulta,
    },
    disponibilidad: d.disponibilidad,
    activo: true,
  }));

  res.json(entities);
});

backendRouter.get('/medicos/:id', (req: Request, res: Response) => {
  const doc = serverDoctors.find((d) => d.id === req.params.id);
  if (!doc) {
    return res.status(404).json({ error: 'Médico no encontrado' });
  }
  res.json(doc);
});

backendRouter.patch('/medicos/:id/slots', (req: Request, res: Response) => {
  const { fecha, hora, nuevoEstado } = req.body;
  const doc = serverDoctors.find((d) => d.id === req.params.id);
  if (!doc) {
    return res.status(404).json({ error: 'Médico no encontrado' });
  }

  const day = doc.disponibilidad.find((d) => d.fecha === fecha);
  if (day) {
    const cleanTarget = hora.replace(/ (AM|PM)/i, '').trim();
    const slot = day.slots.find((s) => s.hora.trim() === cleanTarget || s.hora === hora);
    if (slot) {
      slot.estado = nuevoEstado;
    }
  }

  res.json({ success: true });
});

// -------------------------------------------------------------
// ESPECIALIDADES (especialidadService)
// -------------------------------------------------------------
backendRouter.get('/especialidades', (req: Request, res: Response) => {
  res.json(serverSpecialties);
});

backendRouter.get('/especialidades/:id', (req: Request, res: Response) => {
  const esp = serverSpecialties.find((s) => s.id === req.params.id);
  if (!esp) {
    return res.status(404).json({ error: 'Especialidad no encontrada' });
  }
  res.json(esp);
});

// -------------------------------------------------------------
// CITAS (citaService)
// -------------------------------------------------------------
backendRouter.get('/citas', (req: Request, res: Response) => {
  const { pacienteId, medicoId, estado, format } = req.query;
  let list = serverAppointments;

  if (pacienteId) {
    list = list.filter((a) => a.pacienteId === String(pacienteId));
  }
  if (medicoId) {
    list = list.filter((a) => a.medicoId === String(medicoId));
  }
  if (estado) {
    list = list.filter((a) => a.estado.toLowerCase() === String(estado).toLowerCase());
  }

  if (format === 'ui') {
    return res.json(list);
  }

  const entities = list.map((a) => ({
    id: a.id,
    codigo: a.codigo,
    pacienteId: a.pacienteId,
    medicoId: a.medicoId,
    especialidadId: a.especialidadId,
    fecha: a.fecha,
    hora: a.hora,
    motivo: a.motivo,
    estado: a.estado.toUpperCase(),
    costoTotal: a.costoTotal,
    coberturaEps: a.coberturaEps,
    copago: a.copago,
  }));

  res.json(entities);
});

backendRouter.post('/citas', (req: Request, res: Response) => {
  const input = req.body;
  if (!input.medico?.id || !input.fecha || !input.hora) {
    return res.status(400).json({ error: 'Datos incompletos para crear la cita médica.' });
  }

  // Verificar disponibilidad del slot (prevención de colisión)
  const doc = serverDoctors.find((d) => d.id === input.medico.id);
  const day = doc?.disponibilidad.find((d) => d.fecha === input.fecha);
  const cleanHour = input.hora.replace(/ (AM|PM)/i, '').trim();
  const slot = day?.slots.find((s) => s.hora.trim() === cleanHour || s.hora === input.hora);

  if (slot && slot.estado === 'ocupado') {
    return res.status(409).json({
      error: `El horario seleccionado (${input.hora} del ${input.fechaFormateada || input.fecha}) ya se encuentra ocupado.`,
    });
  }

  const randomDigits = Math.floor(10000 + Math.random() * 90000);
  const codigo = `#MED-${randomDigits}`;
  const precioBase = input.medico.precioConsulta || 100;
  const cobertura = Math.round(precioBase * 0.8);
  const copago = precioBase - cobertura;

  const newAppointment: Appointment = {
    id: `apt-${Date.now()}`,
    codigo,
    pacienteId: input.pacienteId || 'user-anon',
    pacienteNombre: input.pacienteNombre || 'Paciente Registrado',
    pacienteDni: input.pacienteDni || '',
    pacienteTelefono: input.pacienteTelefono || '',
    pacienteEmail: input.pacienteEmail || '',
    medicoId: input.medico.id,
    medicoNombre: input.medico.nombre,
    medicoFoto: input.medico.fotoUrl,
    medicoColegiatura: input.medico.colegiatura,
    especialidadId: input.medico.especialidadId,
    especialidadNombre: input.medico.especialidadNombre,
    sede: input.medico.sede,
    consultorio: input.medico.consultorio,
    fecha: input.fecha,
    fechaFormateada: input.fechaFormateada || input.fecha,
    hora: input.hora,
    motivo: input.motivo,
    sintomasPrevios: input.sintomasPrevios,
    estado: 'confirmada',
    fechaCreacion: new Date().toISOString().split('T')[0],
    costoTotal: precioBase,
    coberturaEps: cobertura,
    copago,
    indicacionesClinicas: [
      'Presentarse 15 minutos antes en la recepción del consultorio.',
      'Llevar documento de identidad (DNI o Pasaporte) en físico.',
    ],
  };

  // Marcar slot ocupado
  if (slot) {
    slot.estado = 'ocupado';
  }

  serverAppointments.unshift(newAppointment);

  // Crear notificación
  serverAlerts.unshift({
    id: `notif-${Date.now()}`,
    tipo: 'cita_confirmada',
    titulo: 'Cita confirmada en backend',
    mensaje: `Cita ${codigo} programada para el ${newAppointment.fechaFormateada} a las ${newAppointment.hora}.`,
    fecha: 'Hoy',
    hora: 'Ahora',
    leida: false,
    citaId: newAppointment.id,
    urgencia: 'alta',
  });

  res.status(201).json(newAppointment);
});

backendRouter.post('/citas/:id/cancelar', (req: Request, res: Response) => {
  const { motivo } = req.body;
  const apt = serverAppointments.find((a) => a.id === req.params.id);
  if (!apt) {
    return res.status(404).json({ error: 'Cita no encontrada' });
  }

  if (apt.estado === 'cancelada') {
    return res.json({ success: true, message: 'La cita ya estaba cancelada.' });
  }

  apt.estado = 'cancelada';
  apt.motivoCancelacion = motivo || 'Cancelación solicitada por el usuario';

  // Liberar slot en médico
  const doc = serverDoctors.find((d) => d.id === apt.medicoId);
  const day = doc?.disponibilidad.find((d) => d.fecha === apt.fecha);
  const cleanHour = apt.hora.replace(/ (AM|PM)/i, '').trim();
  const slot = day?.slots.find((s) => s.hora.trim() === cleanHour || s.hora === apt.hora);
  if (slot) {
    slot.estado = 'disponible';
  }

  res.json({ success: true, message: 'Cita cancelada con éxito' });
});

backendRouter.post('/citas/:id/reprogramar', (req: Request, res: Response) => {
  const { nuevaFecha, nuevaHora, nuevaFechaFormateada } = req.body;
  const apt = serverAppointments.find((a) => a.id === req.params.id);
  if (!apt) {
    return res.status(404).json({ error: 'Cita no encontrada' });
  }

  // Liberar slot anterior
  const doc = serverDoctors.find((d) => d.id === apt.medicoId);
  const oldDay = doc?.disponibilidad.find((d) => d.fecha === apt.fecha);
  const oldSlot = oldDay?.slots.find((s) => s.hora === apt.hora);
  if (oldSlot) oldSlot.estado = 'disponible';

  // Ocupar nuevo slot
  const newDay = doc?.disponibilidad.find((d) => d.fecha === nuevaFecha);
  const newSlot = newDay?.slots.find((s) => s.hora === nuevaHora);
  if (newSlot) newSlot.estado = 'ocupado';

  apt.fecha = nuevaFecha;
  apt.hora = nuevaHora;
  apt.fechaFormateada = nuevaFechaFormateada || nuevaFecha;
  apt.estado = 'confirmada';

  res.json({ success: true, cita: apt });
});

// -------------------------------------------------------------
// ALERTAS (alertaService)
// -------------------------------------------------------------
backendRouter.get('/alertas', (req: Request, res: Response) => {
  res.json(serverAlerts);
});

backendRouter.post('/alertas', (req: Request, res: Response) => {
  const { mensaje, titulo, tipo, urgencia, citaId } = req.body;
  const newAlert: NotificationAlert = {
    id: `notif-${Date.now()}`,
    tipo: (tipo?.toLowerCase() as any) || 'asistente',
    titulo: titulo || 'Notificación MediCita',
    mensaje,
    fecha: 'Hoy',
    hora: 'Ahora',
    leida: false,
    citaId,
    urgencia: (urgencia?.toLowerCase() as any) || 'baja',
  };
  serverAlerts.unshift(newAlert);
  res.status(201).json(newAlert);
});

backendRouter.patch('/alertas/:id/leida', (req: Request, res: Response) => {
  const alert = serverAlerts.find((a) => a.id === req.params.id);
  if (alert) {
    alert.leida = true;
  }
  res.json({ success: true });
});

backendRouter.patch('/alertas/marcar-todas-leidas', (req: Request, res: Response) => {
  serverAlerts.forEach((a) => {
    a.leida = true;
  });
  res.json({ success: true });
});
