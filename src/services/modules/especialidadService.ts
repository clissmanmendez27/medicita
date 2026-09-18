/**
 * Servicio de Especialidades (especialidadService)
 * Equivalente al servicio de backend para la entidad Especialidad:
 * - id
 * - nombre
 * - descripción
 */

import { EspecialidadEntity } from '../../types/backend';
import { apiConfig } from '../api/apiConfig';
import { HttpClient } from '../api/httpClient';
import { INITIAL_SPECIALTIES } from '../../data/seedData';
import { Specialty } from '../../types';

const SPECIALTIES_STORAGE_KEY = 'medicita_specialties_v2';

function getMockSpecialties(): Specialty[] {
  try {
    const raw = localStorage.getItem(SPECIALTIES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(SPECIALTIES_STORAGE_KEY, JSON.stringify(INITIAL_SPECIALTIES));
      return INITIAL_SPECIALTIES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_SPECIALTIES;
  }
}

export const especialidadService = {
  /**
   * Obtiene todas las especialidades activas
   */
  async getAll(): Promise<EspecialidadEntity[]> {
    if (apiConfig.useBackendApi) {
      const res = await HttpClient.get<EspecialidadEntity[]>('/especialidades');
      if (res.success && res.data) {
        return res.data;
      }
    }

    const list = getMockSpecialties();
    return list.map((s) => ({
      id: s.id,
      nombre: s.nombre,
      descripcion: s.descripcion,
      icono: s.icono,
      color: s.color,
      precioBase: s.precioBase,
      sintomasFrecuentes: s.sintomasFrecuentes,
      activa: true,
    }));
  },

  /**
   * Obtiene una especialidad por su ID
   */
  async getById(id: string): Promise<EspecialidadEntity | null> {
    if (apiConfig.useBackendApi) {
      const res = await HttpClient.get<EspecialidadEntity>(`/especialidades/${id}`);
      if (res.success && res.data) {
        return res.data;
      }
      return null;
    }

    const list = await this.getAll();
    return list.find((s) => s.id === id) || null;
  },

  /**
   * Obtiene las especialidades en el formato de interfaz completo (Specialty)
   */
  async getUiSpecialties(): Promise<Specialty[]> {
    if (apiConfig.useBackendApi) {
      const res = await HttpClient.get<Specialty[]>('/especialidades', { format: 'ui' });
      if (res.success && res.data) {
        return res.data;
      }
    }

    return getMockSpecialties();
  },
};
