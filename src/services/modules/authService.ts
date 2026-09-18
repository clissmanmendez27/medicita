/**
 * Módulo de Autenticación (authService)
 * Gestiona el inicio de sesión, registro y estado de sesión compatible con Node.js JWT.
 * No expone contraseñas en el cliente y maneja tokens de forma segura.
 */

import { User } from '../../types';
import { AuthResponseDTO, LoginDTO, ApiResponse } from '../../types/backend';
import { apiConfig, ApiConfigManager } from '../api/apiConfig';
import { HttpClient } from '../api/httpClient';
import { INITIAL_USERS } from '../../data/seedData';
import { alertaService } from './alertaService';

const USERS_STORAGE_KEY = 'medicita_users_v2';
const CURRENT_USER_STORAGE_KEY = 'medicita_current_user_v2';

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

export const authService = {
  /**
   * Obtiene el usuario autenticado actualmente en la sesión
   */
  getCurrentUser(): User {
    try {
      const raw = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(INITIAL_USERS[0]));
        return INITIAL_USERS[0];
      }
      return JSON.parse(raw);
    } catch {
      return INITIAL_USERS[0];
    }
  },

  setCurrentUser(user: User): void {
    try {
      localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(user));
    } catch (e) {
      console.error('Error setting current user', e);
    }
  },

  getAllUsers(): User[] {
    return getMockUsers();
  },

  /**
   * Autenticación con credenciales (correo y contraseña)
   */
  async login(
    email: string,
    password?: string
  ): Promise<{ success: boolean; user?: User; error?: string; token?: string }> {
    if (password !== undefined && password.trim().length < 6) {
      return { success: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
    }

    if (apiConfig.useBackendApi) {
      const res = await HttpClient.post<AuthResponseDTO>('/auth/login', {
        correo: email.trim(),
        contrasena: password || '',
      });

      if (res.success && res.data) {
        ApiConfigManager.setAuthToken(res.data.token);
        const u = res.data.usuario;
        const p = res.data.paciente;
        const mappedUser: User = {
          id: u.id,
          email: u.correo,
          rol: u.rol.toLowerCase() as any,
          nombre: p?.nombres || u.correo.split('@')[0],
          apellidos: p?.apellidos || '',
          dni: p?.dni || '',
          telefono: p?.telefono || '',
          avatarUrl: u.avatarUrl,
        };
        this.setCurrentUser(mappedUser);
        return { success: true, user: mappedUser, token: res.data.token };
      }
      return { success: false, error: res.error || 'Credenciales inválidas' };
    }

    // Modo simulación local
    await new Promise((r) => setTimeout(r, 350));
    const users = getMockUsers();
    const found = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());

    if (found) {
      this.setCurrentUser(found);
      return { success: true, user: found };
    }

    return { success: false, error: 'Credenciales no encontradas. Verifique su correo o regístrese.' };
  },

  /**
   * Cierre de sesión seguro y revocación de token en memoria
   */
  logout(): User {
    ApiConfigManager.setAuthToken(null);
    const users = getMockUsers();
    const defaultUser = users[0] || INITIAL_USERS[0];
    this.setCurrentUser(defaultUser);
    return defaultUser;
  },

  /**
   * Registro de un nuevo paciente
   */
  async register(
    data: Omit<User, 'id'>,
    password?: string
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    if (password && password.trim().length < 6) {
      return { success: false, error: 'La contraseña debe contener al menos 6 caracteres.' };
    }

    if (apiConfig.useBackendApi) {
      const res = await HttpClient.post<AuthResponseDTO>('/auth/register', {
        correo: data.email,
        contrasena: password || '123456',
        rol: 'PACIENTE',
        nombres: data.nombre,
        apellidos: data.apellidos,
        dni: data.dni,
        telefono: data.telefono,
        seguroEps: data.seguroEps,
        planSalud: data.planSalud,
      });

      if (res.success && res.data) {
        ApiConfigManager.setAuthToken(res.data.token);
        const mappedUser: User = {
          ...data,
          id: res.data.usuario.id,
        };
        this.setCurrentUser(mappedUser);
        return { success: true, user: mappedUser };
      }
      return { success: false, error: res.error || 'Error en el registro del backend' };
    }

    // Modo simulación local
    await new Promise((r) => setTimeout(r, 400));
    const users = getMockUsers();
    if (users.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
      return { success: false, error: 'Ya existe una cuenta con este correo electrónico.' };
    }
    if (users.some((u) => u.dni === data.dni)) {
      return { success: false, error: 'El DNI ingresado ya se encuentra registrado.' };
    }

    const newId = `user-${Date.now()}`;
    const newUser: User = {
      ...data,
      id: newId,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.nombre}`,
    };

    const updatedUsers = [newUser, ...users];
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
    } catch (e) {
      console.error(e);
    }
    this.setCurrentUser(newUser);

    // Welcome notification
    alertaService.create({
      usuarioId: newId,
      tipo: 'AVISO_CLINICO',
      titulo: '¡Bienvenido a MediCita!',
      mensaje: `Hola ${newUser.nombre}, tu cuenta ha sido creada exitosamente. Ya puedes consultar especialistas y agendar tu primera cita.`,
      urgencia: 'BAJA',
    });

    return { success: true, user: newUser };
  },
};
