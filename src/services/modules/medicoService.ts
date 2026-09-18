/**
 * Servicio de Médicos (medicoService)
 * Equivalente al servicio de backend para la entidad Médico:
 * - id
 * - nombres
 * - apellidos
 * - especialidadId
 * - información profesional (colegiatura, experiencia, biografía, sede, consultorio, precio, fotos)
 * - disponibilidad (agenda de turnos y cupos)
 */

import { MedicoEntity, ApiResponse } from '../../types/backend';
import { apiConfig } from '../api/apiConfig';
import { HttpClient } from '../api/httpClient';
import { INITIAL_DOCTORS } from '../../data/seedData';
import { Doctor, TimeSlot } from '../../types';

const DOCTORS_STORAGE_KEY = 'medicita_doctors_v2';

function getMockDoctors(): Doctor[] {
  try {
    const raw = localStorage.getItem(DOCTORS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(DOCTORS_STORAGE_KEY, JSON.stringify(INITIAL_DOCTORS));
      return INITIAL_DOCTORS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DOCTORS;
  }
}

function saveMockDoctors(doctors: Doctor[]): void {
  try {
    localStorage.setItem(DOCTORS_STORAGE_KEY, JSON.stringify(doctors));
  } catch (e) {
    console.error('Error saving doctors to storage', e);
  }
}

export const medicoService = {
  /**
   * Obtiene la lista de médicos (opcionalmente filtrada por especialidad)
   */
  async getAll(especialidadId?: string): Promise<MedicoEntity[]> {
    if (apiConfig.useBackendApi) {
      const res = await HttpClient.get<MedicoEntity[]>('/medicos', { especialidadId });
      if (res.success && res.data) {
        return res.data;
      }
    }

    let doctors = getMockDoctors();
    if (especialidadId) {
      doctors = doctors.filter((d) => d.especialidadId === especialidadId);
    }

    return doctors.map((d) => {
      const parts = d.nombre.replace(/^(Dr\.|Dra\.)\s*/, '').split(' ');
      const nombres = parts[0] || d.nombre;
      const apellidos = parts.slice(1).join(' ') || '';

      return {
        id: d.id,
        nombres,
        apellidos,
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
      };
    });
  },

  /**
   * Obtiene el detalle de un médico por su ID
   */
  async getById(id: string): Promise<MedicoEntity | null> {
    if (apiConfig.useBackendApi) {
      const res = await HttpClient.get<MedicoEntity>(`/medicos/${id}`);
      if (res.success && res.data) {
        return res.data;
      }
      return null;
    }

    const doctors = await this.getAll();
    return doctors.find((d) => d.id === id) || null;
  },

  /**
   * Obtiene la lista en el formato completo para la UI (Doctor)
   */
  async getUiDoctors(especialidadId?: string): Promise<Doctor[]> {
    if (apiConfig.useBackendApi) {
      const res = await HttpClient.get<Doctor[]>('/medicos', { format: 'ui', especialidadId });
      if (res.success && res.data) {
        return res.data;
      }
    }

    const doctors = getMockDoctors();
    if (!especialidadId) return doctors;
    return doctors.filter((d) => d.especialidadId === especialidadId);
  },

  /**
   * Actualiza el estado de un slot de horario (disponible / ocupado / bloqueado)
   */
  async updateSlotStatus(
    doctorId: string,
    fecha: string,
    hora: string,
    nuevoEstado: TimeSlot['estado']
  ): Promise<boolean> {
    if (apiConfig.useBackendApi) {
      const res = await HttpClient.patch<boolean>(`/medicos/${doctorId}/slots`, {
        fecha,
        hora,
        nuevoEstado,
      });
      return !!res.success;
    }

    const doctors = getMockDoctors();
    const updatedDoctors = doctors.map((doc) => {
      if (doc.id !== doctorId) return doc;

      const updatedDisponibilidad = doc.disponibilidad.map((day) => {
        if (day.fecha !== fecha) return day;

        const updatedSlots = day.slots.map((slot) => {
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

    saveMockDoctors(updatedDoctors);
    return true;
  },
};
