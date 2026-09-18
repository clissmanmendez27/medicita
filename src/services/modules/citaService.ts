/**
 * Servicio de Citas (citaService)
 * Equivalente al servicio de backend para la entidad Cita:
 * - id
 * - pacienteId
 * - medicoId
 * - fecha
 * - hora
 * - motivo
 * - estado
 */

import { CitaEntity, EstadoCitaBackend, ApiResponse } from '../../types/backend';
import { apiConfig } from '../api/apiConfig';
import { HttpClient } from '../api/httpClient';
import { INITIAL_APPOINTMENTS, INITIAL_DOCTORS } from '../../data/seedData';
import { Appointment, Doctor, AppointmentStatus } from '../../types';
import { medicoService } from './medicoService';

const APPOINTMENTS_STORAGE_KEY = 'medicita_appointments_v2';
const DOCTORS_STORAGE_KEY = 'medicita_doctors_v2';

function getMockAppointments(): Appointment[] {
  try {
    const raw = localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(INITIAL_APPOINTMENTS));
      return INITIAL_APPOINTMENTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_APPOINTMENTS;
  }
}

function saveMockAppointments(appointments: Appointment[]): void {
  try {
    localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(appointments));
  } catch (e) {
    console.error('Error saving appointments to storage', e);
  }
}

export const citaService = {
  /**
   * Obtiene la lista de citas filtrada
   */
  async getAll(filter?: {
    pacienteId?: string;
    medicoId?: string;
    estado?: EstadoCitaBackend | AppointmentStatus;
  }): Promise<CitaEntity[]> {
    if (apiConfig.useBackendApi) {
      const res = await HttpClient.get<CitaEntity[]>('/citas', filter);
      if (res.success && res.data) {
        return res.data;
      }
    }

    let list = getMockAppointments();
    if (filter?.pacienteId) {
      list = list.filter((a) => a.pacienteId === filter.pacienteId);
    }
    if (filter?.medicoId) {
      list = list.filter((a) => a.medicoId === filter.medicoId);
    }
    if (filter?.estado) {
      const targetState = filter.estado.toLowerCase();
      list = list.filter((a) => a.estado.toLowerCase() === targetState);
    }

    return list.map((a) => ({
      id: a.id,
      codigo: a.codigo,
      pacienteId: a.pacienteId,
      medicoId: a.medicoId,
      especialidadId: a.especialidadId,
      fecha: a.fecha,
      hora: a.hora,
      motivo: a.motivo,
      estado: a.estado.toUpperCase() as EstadoCitaBackend,
      sintomasPrevios: a.sintomasPrevios,
      costoTotal: a.costoTotal,
      coberturaEps: a.coberturaEps,
      copago: a.copago,
      motivoCancelacion: a.motivoCancelacion,
      notasMedicas: a.notasMedicas,
      recetaMedica: a.recetaMedica,
    }));
  },

  /**
   * Obtiene una cita por su ID
   */
  async getById(id: string): Promise<CitaEntity | null> {
    if (apiConfig.useBackendApi) {
      const res = await HttpClient.get<CitaEntity>(`/citas/${id}`);
      if (res.success && res.data) {
        return res.data;
      }
      return null;
    }

    const list = await this.getAll();
    return list.find((c) => c.id === id) || null;
  },

  /**
   * Obtiene las citas en el formato UI enriquecido (Appointment)
   */
  async getUiAppointments(filter?: {
    pacienteId?: string;
    medicoId?: string;
    estado?: AppointmentStatus;
  }): Promise<Appointment[]> {
    if (apiConfig.useBackendApi) {
      const res = await HttpClient.get<Appointment[]>('/citas', { ...filter, format: 'ui' });
      if (res.success && res.data) {
        return res.data;
      }
    }

    let list = getMockAppointments();
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

  /**
   * Registra una nueva cita médica
   */
  async create(input: {
    pacienteId: string;
    pacienteNombre: string;
    pacienteDni: string;
    pacienteTelefono: string;
    pacienteEmail: string;
    medico: Doctor;
    fecha: string;
    fechaFormateada: string;
    hora: string;
    motivo: string;
    sintomasPrevios?: string[];
  }): Promise<Appointment> {
    if (apiConfig.useBackendApi) {
      const res = await HttpClient.post<Appointment>('/citas', input);
      if (res.success && res.data) {
        return res.data;
      }
      throw new Error(res.error || 'Error al conectar con la API de citas');
    }

    // Double-booking check in doctor availability
    const doctorsRaw = localStorage.getItem(DOCTORS_STORAGE_KEY);
    const doctors: Doctor[] = doctorsRaw ? JSON.parse(doctorsRaw) : INITIAL_DOCTORS;
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

    const appointments = getMockAppointments();
    const randomDigits = Math.floor(10000 + Math.random() * 90000);
    const codigo = `#MED-${randomDigits}`;

    const precioBase = input.medico.precioConsulta;
    const cobertura = Math.round(precioBase * 0.8);
    const copago = precioBase - cobertura;

    const newAppointment: Appointment = {
      id: `apt-${Date.now()}`,
      codigo,
      pacienteId: input.pacienteId,
      pacienteNombre: input.pacienteNombre,
      pacienteDni: input.pacienteDni,
      pacienteTelefono: input.pacienteTelefono,
      pacienteEmail: input.pacienteEmail,
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
      copago,
      indicacionesClinicas: [
        'Presentarse 15 minutos antes en la recepción del consultorio.',
        'Llevar documento de identidad (DNI o Pasaporte) en físico.',
        'En caso de exámenes previos relacionados, llevarlos impresos o digitales.',
      ],
    };

    // Mark slot occupied
    await medicoService.updateSlotStatus(input.medico.id, input.fecha, input.hora, 'ocupado');

    const updated = [newAppointment, ...appointments];
    saveMockAppointments(updated);

    return newAppointment;
  },

  /**
   * Cancela una cita médica existente
   */
  async cancel(appointmentId: string, motivo: string): Promise<boolean> {
    if (apiConfig.useBackendApi) {
      const res = await HttpClient.post<boolean>(`/citas/${appointmentId}/cancelar`, { motivo });
      return !!res.success;
    }

    const appointments = getMockAppointments();
    const target = appointments.find((a) => a.id === appointmentId);
    if (!target) return false;

    if (target.estado === 'cancelada') {
      return true;
    }

    // Liberate time slot in doctor availability
    await medicoService.updateSlotStatus(target.medicoId, target.fecha, target.hora, 'disponible');

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

    saveMockAppointments(updated);
    return true;
  },

  /**
   * Reprograma una cita para nueva fecha y hora
   */
  async reschedule(
    appointmentId: string,
    newFecha: string,
    newHora: string,
    newFechaFormateada: string
  ): Promise<boolean> {
    if (apiConfig.useBackendApi) {
      const res = await HttpClient.post<boolean>(`/citas/${appointmentId}/reprogramar`, {
        nuevaFecha: newFecha,
        nuevaHora: newHora,
        nuevaFechaFormateada: newFechaFormateada,
      });
      return !!res.success;
    }

    const appointments = getMockAppointments();
    const target = appointments.find((a) => a.id === appointmentId);
    if (!target) throw new Error('Cita no encontrada.');
    if (target.estado === 'cancelada') throw new Error('No es posible reprogramar una cita cancelada.');

    // Verify slot
    const doctorsRaw = localStorage.getItem(DOCTORS_STORAGE_KEY);
    const doctors: Doctor[] = doctorsRaw ? JSON.parse(doctorsRaw) : INITIAL_DOCTORS;
    const targetDoc = doctors.find((d) => d.id === target.medicoId);
    const targetDay = targetDoc?.disponibilidad.find((d) => d.fecha === newFecha);
    const cleanTargetHour = newHora.replace(/ (AM|PM)/i, '').trim();
    const newSlot = targetDay?.slots.find(
      (s) => s.hora.trim() === cleanTargetHour || s.hora === newHora
    );

    if (newSlot && newSlot.estado === 'ocupado') {
      throw new Error(`El nuevo horario (${newHora}) ya se encuentra ocupado.`);
    }

    // Liberate old slot & occupy new slot
    await medicoService.updateSlotStatus(target.medicoId, target.fecha, target.hora, 'disponible');
    await medicoService.updateSlotStatus(target.medicoId, newFecha, newHora, 'ocupado');

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

    saveMockAppointments(updated);
    return true;
  },

  /**
   * Actualiza las notas médicas y receta emitidas por el médico
   */
  async updateDoctorMedicalNotes(
    appointmentId: string,
    notasMedicas: string,
    recetaMedica: string,
    nuevoEstado: AppointmentStatus = 'atendida'
  ): Promise<boolean> {
    if (apiConfig.useBackendApi) {
      const res = await HttpClient.patch<boolean>(`/citas/${appointmentId}/notas`, {
        notasMedicas,
        recetaMedica,
        estado: nuevoEstado,
      });
      return !!res.success;
    }

    const appointments = getMockAppointments();
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

    saveMockAppointments(updated);
    return true;
  },
};
