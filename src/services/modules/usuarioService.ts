/**
 * Servicio de Usuarios (usuarioService)
 * Equivalente al servicio de backend para la entidad Usuario:
 * - id
 * - correo
 * - contraseña/autenticación (protegida)
 * - rol
 */

import { UsuarioEntity, CreateUsuarioDTO, ApiResponse } from '../../types/backend';
import { apiConfig } from '../api/apiConfig';
import { HttpClient } from '../api/httpClient';
import { INITIAL_USERS } from '../../data/seedData';
import { User } from '../../types';

const USERS_STORAGE_KEY = 'medicita_users_v2';

// Helper to access current mock users in localStorage
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
    console.error('Error saving users to localStorage', e);
  }
}

export const usuarioService = {
  /**
   * Obtiene todos los usuarios del sistema (o consulta API)
   */
  async getAll(): Promise<UsuarioEntity[]> {
    if (apiConfig.useBackendApi) {
      const res = await HttpClient.get<UsuarioEntity[]>('/usuarios');
      if (res.success && res.data) {
        return res.data;
      }
    }

    // Modo simulación local
    const users = getMockUsers();
    return users.map((u) => ({
      id: u.id,
      correo: u.email,
      rol: u.rol.toUpperCase() as UsuarioEntity['rol'],
      activo: true,
      avatarUrl: u.avatarUrl,
    }));
  },

  /**
   * Obtiene un usuario por su identificador único
   */
  async getById(id: string): Promise<UsuarioEntity | null> {
    if (apiConfig.useBackendApi) {
      const res = await HttpClient.get<UsuarioEntity>(`/usuarios/${id}`);
      if (res.success && res.data) {
        return res.data;
      }
      return null;
    }

    const users = getMockUsers();
    const found = users.find((u) => u.id === id);
    if (!found) return null;

    return {
      id: found.id,
      correo: found.email,
      rol: found.rol.toUpperCase() as UsuarioEntity['rol'],
      activo: true,
      avatarUrl: found.avatarUrl,
    };
  },

  /**
   * Obtiene un usuario por su correo electrónico
   */
  async getByEmail(correo: string): Promise<UsuarioEntity | null> {
    if (apiConfig.useBackendApi) {
      const res = await HttpClient.get<UsuarioEntity>(`/usuarios/email/${encodeURIComponent(correo)}`);
      if (res.success && res.data) {
        return res.data;
      }
    }

    const users = getMockUsers();
    const found = users.find((u) => u.email.toLowerCase() === correo.trim().toLowerCase());
    if (!found) return null;

    return {
      id: found.id,
      correo: found.email,
      rol: found.rol.toUpperCase() as UsuarioEntity['rol'],
      activo: true,
      avatarUrl: found.avatarUrl,
    };
  },

  /**
   * Crea un nuevo usuario en la base de datos
   */
  async create(dto: CreateUsuarioDTO): Promise<ApiResponse<UsuarioEntity>> {
    if (apiConfig.useBackendApi) {
      return HttpClient.post<UsuarioEntity>('/usuarios', dto);
    }

    const users = getMockUsers();
    if (users.some((u) => u.email.toLowerCase() === dto.correo.toLowerCase())) {
      return { success: false, error: 'El correo ya se encuentra registrado.' };
    }

    const newId = `user-${Date.now()}`;
    const newMockUser: User = {
      id: newId,
      nombre: dto.correo.split('@')[0],
      apellidos: '',
      email: dto.correo,
      rol: dto.rol.toLowerCase() as any,
      dni: '',
      telefono: '',
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${dto.correo}`,
    };

    saveMockUsers([newMockUser, ...users]);

    return {
      success: true,
      data: {
        id: newId,
        correo: dto.correo,
        rol: dto.rol,
        activo: true,
      },
    };
  },
};
