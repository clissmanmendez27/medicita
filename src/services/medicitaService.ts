import {
  Specialty,
  Doctor,
  User,
  Appointment,
  NotificationAlert,
  AppointmentStatus,
  TimeSlot,
} from '../types';
import {
  INITIAL_SPECIALTIES,
  INITIAL_DOCTORS,
  INITIAL_USERS,
  INITIAL_APPOINTMENTS,
  INITIAL_NOTIFICATIONS,
} from '../data/seedData';
import { usuarioService } from './modules/usuarioService';
import { pacienteService } from './modules/pacienteService';
import { medicoService } from './modules/medicoService';
import { especialidadService } from './modules/especialidadService';
import { citaService } from './modules/citaService';
import { alertaService } from './modules/alertaService';
import { authService } from './modules/authService';
import { apiConfig, ApiConfigManager } from './api/apiConfig';

const STORAGE_KEYS = {
  SPECIALTIES: 'medicita_specialties_v2',
  DOCTORS: 'medicita_doctors_v2',
  USERS: 'medicita_users_v2',
  CURRENT_USER: 'medicita_current_user_v2',
  APPOINTMENTS: 'medicita_appointments_v2',
  NOTIFICATIONS: 'medicita_notifications_v2',
};

// Listeners for reactive updates
type Listener = () => void;
const listeners: Set<Listener> = new Set();

const notifyListeners = () => {
  listeners.forEach((l) => l());
};

export const subscribeToStore = (listener: Listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

// Storage helper with fallback to initial data
const getStorageItem = <T>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(item);
  } catch (error) {
    console.error(`Error reading ${key} from storage:`, error);
    return fallback;
  }
};

const setStorageItem = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    notifyListeners();
  } catch (error) {
    console.error(`Error writing ${key} to storage:`, error);
  }
};

// Initial store setup
const initStore = () => {
  getStorageItem(STORAGE_KEYS.SPECIALTIES, INITIAL_SPECIALTIES);
  const docs = getStorageItem<Doctor[]>(STORAGE_KEYS.DOCTORS, INITIAL_DOCTORS);
  const validAnaPhoto = 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?auto=format&fit=crop&q=80&w=400';
  let docsUpdated = false;
  const migratedDocs = docs.map((d) => {
    if (d.id === 'doc-ana-martinez' && (d.fotoUrl.includes('1594824813587') || !d.fotoUrl)) {
      docsUpdated = true;
      return { ...d, fotoUrl: validAnaPhoto };
    }
    return d;
  });
  if (docsUpdated) {
    try {
      localStorage.setItem(STORAGE_KEYS.DOCTORS, JSON.stringify(migratedDocs));
    } catch {
      // ignore
    }
  }

  const users = getStorageItem<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  let usersUpdated = false;
  const migratedUsers = users.map((u) => {
    if (u.id === 'user-admin' || u.rol === 'admin') {
      usersUpdated = true;
      return {
        ...u,
        id: 'user-admin',
        nombre: 'Clisman',
        apellidos: 'Mendez',
        email: 'clisman.mendez@medicita.com',
        rol: 'admin' as const,
        dni: '72842910',
        telefono: '+51 999 888 777',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
      };
    }
    return u;
  });

  if (!migratedUsers.some((u) => u.rol === 'admin')) {
    migratedUsers.push({
      id: 'user-admin',
      nombre: 'Clisman',
      apellidos: 'Mendez',
      email: 'clisman.mendez@medicita.com',
      rol: 'admin',
      dni: '72842910',
      telefono: '+51 999 888 777',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    });
    usersUpdated = true;
  }

  if (usersUpdated) {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(migratedUsers));
    } catch {
      // ignore
    }
  }

  const currentUser = getStorageItem<User>(STORAGE_KEYS.CURRENT_USER, INITIAL_USERS[0]);
  if (currentUser.id === 'user-admin' || currentUser.rol === 'admin') {
    const updatedAdmin = {
      ...currentUser,
      nombre: 'Clisman',
      apellidos: 'Mendez',
      email: 'clisman.mendez@medicita.com',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    };
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updatedAdmin));
    } catch {
      // ignore
    }
  }

  const apts = getStorageItem<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS);
  let aptsUpdated = false;
  const migratedApts = apts.map((a) => {
    if (a.medicoId === 'doc-ana-martinez' && (a.medicoFoto.includes('1594824813587') || !a.medicoFoto)) {
      aptsUpdated = true;
      return { ...a, medicoFoto: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?auto=format&fit=crop&q=80&w=200' };
    }
    return a;
  });
  if (aptsUpdated) {
    try {
      localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(migratedApts));
    } catch {
      // ignore
    }
  }

  getStorageItem(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
};

initStore();

export const MedicitaService = {
  // Current User / Session
  getCurrentUser(): User {
    return getStorageItem(STORAGE_KEYS.CURRENT_USER, INITIAL_USERS[0]);
  },

  setCurrentUser(user: User): void {
    setStorageItem(STORAGE_KEYS.CURRENT_USER, user);
  },

  getAllUsers(): User[] {
    return getStorageItem(STORAGE_KEYS.USERS, INITIAL_USERS);
  },

  async login(email: string, password?: string): Promise<{ success: boolean; user?: User; error?: string }> {
    await new Promise((r) => setTimeout(r, 400));
    if (password !== undefined && password.trim().length < 6) {
      return { success: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
    }
    const users = this.getAllUsers();
    const normalized = email.trim().toLowerCase();
    const found = users.find((u) => {
      const uEmail = u.email.toLowerCase();
      if (uEmail === normalized) return true;
      if (u.rol === 'admin') {
        return (
          normalized === 'admin@medicita.com' ||
          normalized === 'clisman.mendez@medicita.com' ||
          normalized === 'clissman.mendez.27@unsch.edu.pe' ||
          normalized === 'admin'
        );
      }
      return false;
    });
    if (found) {
      this.setCurrentUser(found);
      return { success: true, user: found };
    }
    return { success: false, error: 'Credenciales no encontradas. Verifique su correo o regístrese.' };
  },

  logout(): User {
    const users = this.getAllUsers();
    const defaultUser = users[0] || INITIAL_USERS[0];
    this.setCurrentUser(defaultUser);
    return defaultUser;
  },

  async register(data: Omit<User, 'id'>): Promise<{ success: boolean; user?: User; error?: string }> {
    await new Promise((r) => setTimeout(r, 400));
    const users = this.getAllUsers();
    if (users.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
      return { success: false, error: 'Ya existe una cuenta con este correo electrónico.' };
    }
    if (users.some((u) => u.dni === data.dni)) {
      return { success: false, error: 'El DNI ingresado ya se encuentra registrado.' };
    }

    const newUser: User = {
      ...data,
      id: `user-${Date.now()}`,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.nombre}`,
    };

    const updatedUsers = [newUser, ...users];
    setStorageItem(STORAGE_KEYS.USERS, updatedUsers);
    this.setCurrentUser(newUser);

    // Welcome notification
    this.addNotification({
      tipo: 'asistente',
      titulo: '¡Bienvenido a MediCita!',
      mensaje: `Hola ${newUser.nombre}, tu cuenta ha sido creada exitosamente. Ya puedes consultar especialistas y agendar tu primera cita.`,
      urgencia: 'baja',
    });

    return { success: true, user: newUser };
  },

  // Specialties
  async getSpecialties(): Promise<Specialty[]> {
    return getStorageItem(STORAGE_KEYS.SPECIALTIES, INITIAL_SPECIALTIES);
  },

  async getSpecialtyById(id: string): Promise<Specialty | undefined> {
    const specialties = await this.getSpecialties();
    return specialties.find((s) => s.id === id);
  },

  // Doctors
  async getDoctors(specialtyId?: string): Promise<Doctor[]> {
    const doctors = getStorageItem<Doctor[]>(STORAGE_KEYS.DOCTORS, INITIAL_DOCTORS);
    const validAnaPhoto = 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?auto=format&fit=crop&q=80&w=400';
    const sanitized = doctors.map((d) => {
      if (d.id === 'doc-ana-martinez' && (d.fotoUrl.includes('1594824813587') || !d.fotoUrl)) {
        return { ...d, fotoUrl: validAnaPhoto };
      }
      return d;
    });
    if (!specialtyId) return sanitized;
    return sanitized.filter((d) => d.especialidadId === specialtyId);
  },

  async getDoctorById(id: string): Promise<Doctor | undefined> {
    const doctors = await this.getDoctors();
    return doctors.find((d) => d.id === id);
  },

  // Appointments
  async getAppointments(filter?: { pacienteId?: string; medicoId?: string; estado?: AppointmentStatus }): Promise<Appointment[]> {
    let list = getStorageItem<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS);
    if (filter?.pacienteId) {
      list = list.filter((a) => a.pacienteId === filter.pacienteId);
    }
    if (filter?.medicoId) {
      list = list.filter((a) => a.medicoId === filter.medicoId);
    }
    if (filter?.estado) {
      list = list.filter((a) => a.estado === filter.estado);
    }
    return list;
  },

  async getAppointmentById(id: string): Promise<Appointment | undefined> {
    const list = await this.getAppointments();
    return list.find((a) => a.id === id);
  },

  async createAppointment(input: {
    medico: Doctor;
    fecha: string;
    fechaFormateada: string;
    hora: string;
    motivo: string;
    sintomasPrevios?: string[];
  }): Promise<Appointment> {
    await new Promise((r) => setTimeout(r, 450));

    // Double-booking verification check
    const doctors = getStorageItem<Doctor[]>(STORAGE_KEYS.DOCTORS, INITIAL_DOCTORS);
    const targetDoc = doctors.find((d) => d.id === input.medico.id);
    const targetDay = targetDoc?.disponibilidad.find((day) => day.fecha === input.fecha);
    const cleanTargetHour = input.hora.replace(/ (AM|PM)/i, '').trim();
    const existingSlot = targetDay?.slots.find(
      (s) => s.hora.trim() === cleanTargetHour || s.hora === input.hora
    );

    if (existingSlot && existingSlot.estado === 'ocupado') {
      throw new Error(
        `El horario seleccionado (${input.hora} del ${input.fechaFormateada}) ya no se encuentra disponible. Por favor selecciona otro turno libre.`
      );
    }

    const user = this.getCurrentUser();
    const appointments = getStorageItem<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS);

    const randomDigits = Math.floor(10000 + Math.random() * 90000);
    const codigo = `#MED-${randomDigits}`;

    const precioBase = input.medico.precioConsulta;
    const cobertura = Math.round(precioBase * 0.8);
    const copago = precioBase - cobertura;

    const newAppointment: Appointment = {
      id: `apt-${Date.now()}`,
      codigo,
      pacienteId: user.id,
      pacienteNombre: `${user.nombre} ${user.apellidos}`,
      pacienteDni: user.dni,
      pacienteTelefono: user.telefono,
      pacienteEmail: user.email,
      medicoId: input.medico.id,
      medicoNombre: input.medico.nombre,
      medicoFoto: input.medico.fotoUrl,
      medicoColegiatura: input.medico.colegiatura,
      especialidadId: input.medico.especialidadId,
      especialidadNombre: input.medico.especialidadNombre,
      sede: input.medico.sede,
      consultorio: input.medico.consultorio,
      fecha: input.fecha,
      fechaFormateada: input.fechaFormateada,
      hora: input.hora,
      motivo: input.motivo,
      sintomasPrevios: input.sintomasPrevios,
      estado: 'confirmada',
      fechaCreacion: new Date().toISOString().split('T')[0],
      costoTotal: precioBase,
      coberturaEps: cobertura,
      copago: copago,
      indicacionesClinicas: [
        'Presentarse 15 minutos antes en la recepción del consultorio.',
        'Llevar documento de identidad (DNI o Pasaporte) en físico.',
        'En caso de exámenes previos relacionados, llevarlos impresos o digitales.',
      ],
    };

    // Mark slot as occupied in doctor availability
    this.updateDoctorSlotStatus(input.medico.id, input.fecha, input.hora, 'ocupado');

    const updated = [newAppointment, ...appointments];
    setStorageItem(STORAGE_KEYS.APPOINTMENTS, updated);

    // Create confirmation alert
    this.addNotification({
      tipo: 'cita_confirmada',
      titulo: '¡Cita confirmada con éxito!',
      mensaje: `Tu cita médica ${codigo} con ${input.medico.nombre} (${input.medico.especialidadNombre}) para el ${input.fechaFormateada} a las ${input.hora} ha sido confirmada.`,
      citaId: newAppointment.id,
      urgencia: 'alta',
    });

    return newAppointment;
  },

  async cancelAppointment(appointmentId: string, motivo: string): Promise<boolean> {
    await new Promise((r) => setTimeout(r, 350));
    const appointments = getStorageItem<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS);
    const target = appointments.find((a) => a.id === appointmentId);
    if (!target) return false;

    // Idempotency: prevent re-cancelling or duplicate slot liberation
    if (target.estado === 'cancelada') {
      return true;
    }

    // Liberate time slot in doctor availability
    this.updateDoctorSlotStatus(target.medicoId, target.fecha, target.hora, 'disponible');

    const updated = appointments.map((a) => {
      if (a.id === appointmentId) {
        return {
          ...a,
          estado: 'cancelada' as AppointmentStatus,
          motivoCancelacion: motivo,
        };
      }
      return a;
    });

    setStorageItem(STORAGE_KEYS.APPOINTMENTS, updated);

    // Notification
    this.addNotification({
      tipo: 'cita_cancelada',
      titulo: 'Cita médica cancelada',
      mensaje: `La cita ${target.codigo} con ${target.medicoNombre} programada para el ${target.fechaFormateada} ha sido cancelada. Motivo: "${motivo}". El horario ha quedado liberado.`,
      citaId: appointmentId,
      urgencia: 'media',
    });

    return true;
  },

  async rescheduleAppointment(
    appointmentId: string,
    newFecha: string,
    newHora: string,
    newFechaFormateada: string
  ): Promise<boolean> {
    await new Promise((r) => setTimeout(r, 400));
    const appointments = getStorageItem<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS);
    const target = appointments.find((a) => a.id === appointmentId);
    if (!target) {
      throw new Error('La cita a reprogramar no fue encontrada.');
    }
    if (target.estado === 'cancelada') {
      throw new Error('No es posible reprogramar una cita que ya fue cancelada.');
    }

    // Verify if new target slot is available
    const doctors = getStorageItem<Doctor[]>(STORAGE_KEYS.DOCTORS, INITIAL_DOCTORS);
    const targetDoc = doctors.find((d) => d.id === target.medicoId);
    const targetDay = targetDoc?.disponibilidad.find((day) => day.fecha === newFecha);
    const cleanTargetHour = newHora.replace(/ (AM|PM)/i, '').trim();
    const newSlot = targetDay?.slots.find(
      (s) => s.hora.trim() === cleanTargetHour || s.hora === newHora
    );

    if (newSlot && newSlot.estado === 'ocupado') {
      throw new Error(
        `El nuevo horario seleccionado (${newHora} del ${newFechaFormateada}) ya se encuentra ocupado. Por favor elige otro turno.`
      );
    }

    // Liberate old slot
    this.updateDoctorSlotStatus(target.medicoId, target.fecha, target.hora, 'disponible');

    // Occupy new slot
    this.updateDoctorSlotStatus(target.medicoId, newFecha, newHora, 'ocupado');

    const updated = appointments.map((a) => {
      if (a.id === appointmentId) {
        return {
          ...a,
          fecha: newFecha,
          hora: newHora,
          fechaFormateada: newFechaFormateada,
          estado: 'confirmada' as AppointmentStatus,
        };
      }
      return a;
    });

    setStorageItem(STORAGE_KEYS.APPOINTMENTS, updated);

    // Notification
    this.addNotification({
      tipo: 'cita_reprogramada',
      titulo: 'Cita médica reprogramada',
      mensaje: `Tu cita ${target.codigo} con ${target.medicoNombre} ha sido reprogramada con éxito para el ${newFechaFormateada} a las ${newHora}.`,
      citaId: appointmentId,
      urgencia: 'alta',
    });

    return true;
  },

  async updateDoctorMedicalNotes(
    appointmentId: string,
    notasMedicas: string,
    recetaMedica: string,
    nuevoEstado: AppointmentStatus = 'atendida'
  ): Promise<boolean> {
    const appointments = getStorageItem<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS);
    const target = appointments.find((a) => a.id === appointmentId);
    if (!target) return false;

    const updated = appointments.map((a) => {
      if (a.id === appointmentId) {
        return {
          ...a,
          estado: nuevoEstado,
          notasMedicas,
          recetaMedica,
        };
      }
      return a;
    });

    setStorageItem(STORAGE_KEYS.APPOINTMENTS, updated);
    return true;
  },

  updateDoctorSlotStatus(doctorId: string, fecha: string, hora: string, nuevoEstado: TimeSlot['estado']) {
    const doctors = getStorageItem<Doctor[]>(STORAGE_KEYS.DOCTORS, INITIAL_DOCTORS);
    const updatedDoctors = doctors.map((doc) => {
      if (doc.id !== doctorId) return doc;

      const updatedDisponibilidad = doc.disponibilidad.map((day) => {
        if (day.fecha !== fecha) return day;

        const updatedSlots = day.slots.map((slot) => {
          // Normalize time string e.g. "09:30 AM" or "09:30"
          const cleanSlotHour = slot.hora.trim();
          const cleanTargetHour = hora.replace(/ (AM|PM)/i, '').trim();
          if (cleanSlotHour === cleanTargetHour || slot.hora === hora) {
            return { ...slot, estado: nuevoEstado };
          }
          return slot;
        });

        const available = updatedSlots.filter((s) => s.estado === 'disponible').length;
        let nivel: 'alta' | 'media' | 'baja' | 'agotada' = 'alta';
        if (available === 0) nivel = 'agotada';
        else if (available <= 2) nivel = 'baja';
        else if (available <= 6) nivel = 'media';

        return {
          ...day,
          slots: updatedSlots,
          cuposDisponibles: available,
          disponibilidadNivel: nivel,
        };
      });

      return {
        ...doc,
        disponibilidad: updatedDisponibilidad,
      };
    });

    setStorageItem(STORAGE_KEYS.DOCTORS, updatedDoctors);
  },

  // Notifications
  getNotifications(): NotificationAlert[] {
    return getStorageItem<NotificationAlert[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  },

  addNotification(notif: Omit<NotificationAlert, 'id' | 'fecha' | 'hora' | 'leida'>): void {
    const list = this.getNotifications();
    const now = new Date();
    const newNotif: NotificationAlert = {
      ...notif,
      id: `notif-${Date.now()}`,
      fecha: 'Hoy',
      hora: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
      leida: false,
    };
    setStorageItem(STORAGE_KEYS.NOTIFICATIONS, [newNotif, ...list]);
  },

  markNotificationAsRead(id: string): void {
    const list = this.getNotifications();
    const updated = list.map((n) => (n.id === id ? { ...n, leida: true } : n));
    setStorageItem(STORAGE_KEYS.NOTIFICATIONS, updated);
  },

  markAllNotificationsAsRead(): void {
    const list = this.getNotifications();
    const updated = list.map((n) => ({ ...n, leida: true }));
    setStorageItem(STORAGE_KEYS.NOTIFICATIONS, updated);
  },

  // Reset to initial prototype data
  resetAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.SPECIALTIES);
    localStorage.removeItem(STORAGE_KEYS.DOCTORS);
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.APPOINTMENTS);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    initStore();
    notifyListeners();
  },

  // Capa de Servicios Modulares de Backend (Node.js + Prisma ORM)
  usuarioService,
  pacienteService,
  medicoService,
  especialidadService,
  citaService,
  alertaService,
  authService,
  apiConfig,
  ApiConfigManager,
  notifyStoreChange: notifyListeners,
};
