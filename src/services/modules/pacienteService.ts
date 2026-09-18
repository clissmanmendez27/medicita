/**
 * Servicio de Pacientes (pacienteService)
 * Equivalente al servicio de backend para la entidad Paciente:
 * - id
 * - usuarioId
 * - nombres
 * - apellidos
 * - DNI
 * - teléfono
 */

import { PacienteEntity, CreatePacienteDTO, ApiResponse } from '../../types/backend';
import { apiConfig } from '../api/apiConfig';
import { HttpClient } from '../api/httpClient';
import { INITIAL_USERS } from '../../data/seedData';
import { User } from '../../types';

const USERS_STORAGE_KEY = 'medicita_users_v2';

function getMockUsers(): User[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_USERS;
  }
}

function saveMockUsers(users: User[]): void {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Error saving users to storage', e);
  }
}

export const pacienteService = {
  /**
   * Obtiene todos los pacientes registrados
   */
  async getAll(): Promise<PacienteEntity[]> {
    if (apiConfig.useBackendApi) {
      const res = await HttpClient.get<PacienteEntity[]>('/pacientes');
      if (res.success && res.data) {
        return res.data;
      }
    }

    const users = getMockUsers();
    return users
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
        fechaNacimiento: u.fechaNacimiento,
        genero: u.genero,
      }));
  },

  /**
   * Obtiene un paciente por su id de paciente
   */
  async getById(id: string): Promise<PacienteEntity | null> {
    if (apiConfig.useBackendApi) {
      const res = await HttpClient.get<PacienteEntity>(`/pacientes/${id}`);
      if (res.success && res.data) {
        return res.data;
      }
      return null;
    }

    const pacientes = await this.getAll();
    return pacientes.find((p) => p.id === id) || null;
  },

  /**
   * Obtiene un paciente asociado a su cuenta de usuario (usuarioId)
   */
  async getByUsuarioId(usuarioId: string): Promise<PacienteEntity | null> {
    if (apiConfig.useBackendApi) {
      const res = await HttpClient.get<PacienteEntity>(`/pacientes/usuario/${usuarioId}`);
      if (res.success && res.data) {
        return res.data;
      }
      return null;
    }

    const users = getMockUsers();
    const u = users.find((user) => user.id === usuarioId);
    if (!u) return null;

    return {
      id: `pac-${u.id}`,
      usuarioId: u.id,
      nombres: u.nombre,
      apellidos: u.apellidos,
      dni: u.dni,
      telefono: u.telefono,
      seguroEps: u.seguroEps,
      planSalud: u.planSalud,
      numeroAfiliacion: u.numeroAfiliacion,
    };
  },

  /**
   * Obtiene un paciente por su DNI
   */
  async getByDni(dni: string): Promise<PacienteEntity | null> {
    if (apiConfig.useBackendApi) {
      const res = await HttpClient.get<PacienteEntity>(`/pacientes/dni/${dni}`);
      if (res.success && res.data) {
        return res.data;
      }
      return null;
    }

    const users = getMockUsers();
    const u = users.find((user) => user.dni === dni.trim());
    if (!u) return null;

    return {
      id: `pac-${u.id}`,
      usuarioId: u.id,
      nombres: u.nombre,
      apellidos: u.apellidos,
      dni: u.dni,
      telefono: u.telefono,
      seguroEps: u.seguroEps,
    };
  },

  /**
   * Crea o actualiza el registro de un paciente
   */
  async create(dto: CreatePacienteDTO): Promise<ApiResponse<PacienteEntity>> {
    if (apiConfig.useBackendApi) {
      return HttpClient.post<PacienteEntity>('/pacientes', dto);
    }

    const users = getMockUsers();
    const existingIndex = users.findIndex((u) => u.id === dto.usuarioId);

    const newPaciente: PacienteEntity = {
      id: `pac-${dto.usuarioId}`,
      usuarioId: dto.usuarioId,
      nombres: dto.nombres,
      apellidos: dto.apellidos,
      dni: dto.dni,
      telefono: dto.telefono,
      seguroEps: dto.seguroEps,
      planSalud: dto.planSalud,
      numeroAfiliacion: dto.numeroAfiliacion,
    };

    if (existingIndex >= 0) {
      users[existingIndex] = {
        ...users[existingIndex],
        nombre: dto.nombres,
        apellidos: dto.apellidos,
        dni: dto.dni,
        telefono: dto.telefono,
        seguroEps: dto.seguroEps,
        planSalud: dto.planSalud,
        numeroAfiliacion: dto.numeroAfiliacion,
      };
      saveMockUsers(users);
    }

    return {
      success: true,
      data: newPaciente,
    };
  },
};
