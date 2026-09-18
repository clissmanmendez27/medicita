/**
 * Servicio de Alertas y Notificaciones (alertaService)
 * Equivalente al servicio de backend para la entidad Alerta:
 * - id
 * - usuarioId
 * - mensaje
 * - tipo
 * - fecha
 * - leída
 */

import { AlertaEntity, CreateAlertaDTO, ApiResponse } from '../../types/backend';
import { apiConfig } from '../api/apiConfig';
import { HttpClient } from '../api/httpClient';
import { INITIAL_NOTIFICATIONS } from '../../data/seedData';
import { NotificationAlert } from '../../types';

const NOTIFICATIONS_STORAGE_KEY = 'medicita_notifications_v2';

function getMockNotifications(): NotificationAlert[] {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(INITIAL_NOTIFICATIONS));
      return INITIAL_NOTIFICATIONS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_NOTIFICATIONS;
  }
}

function saveMockNotifications(alerts: NotificationAlert[]): void {
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(alerts));
  } catch (e) {
    console.error('Error saving notifications to storage', e);
  }
}

export const alertaService = {
  /**
   * Obtiene la lista de alertas (opcionalmente filtrada por usuario)
   */
  async getAll(usuarioId?: string): Promise<AlertaEntity[]> {
    if (apiConfig.useBackendApi) {
      const res = await HttpClient.get<AlertaEntity[]>('/alertas', { usuarioId });
      if (res.success && res.data) {
        return res.data;
      }
    }

    const list = getMockNotifications();
    return list.map((n) => ({
      id: n.id,
      usuarioId: usuarioId || 'user-current',
      mensaje: n.mensaje,
      titulo: n.titulo,
      tipo: n.tipo.toUpperCase() as any,
      fecha: `${n.fecha} ${n.hora}`,
      leida: n.leida,
      citaId: n.citaId,
      urgencia: n.urgencia?.toUpperCase() as any,
    }));
  },

  /**
   * Obtiene la lista en formato UI (NotificationAlert)
   */
  async getUiNotifications(): Promise<NotificationAlert[]> {
    if (apiConfig.useBackendApi) {
      const res = await HttpClient.get<NotificationAlert[]>('/alertas', { format: 'ui' });
      if (res.success && res.data) {
        return res.data;
      }
    }

    return getMockNotifications();
  },

  /**
   * Registra una nueva alerta en la base de datos
   */
  async create(dto: CreateAlertaDTO): Promise<ApiResponse<AlertaEntity>> {
    if (apiConfig.useBackendApi) {
      return HttpClient.post<AlertaEntity>('/alertas', dto);
    }

    const list = getMockNotifications();
    const now = new Date();
    const newId = `notif-${Date.now()}`;
    const hora = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newNotif: NotificationAlert = {
      id: newId,
      tipo: (dto.tipo.toLowerCase() as any) || 'asistente',
      titulo: dto.titulo || 'Notificación MediCita',
      mensaje: dto.mensaje,
      fecha: 'Hoy',
      hora,
      leida: false,
      citaId: dto.citaId,
      urgencia: (dto.urgencia?.toLowerCase() as any) || 'baja',
    };

    saveMockNotifications([newNotif, ...list]);

    return {
      success: true,
      data: {
        id: newId,
        usuarioId: dto.usuarioId,
        mensaje: dto.mensaje,
        titulo: dto.titulo,
        tipo: dto.tipo,
        fecha: new Date().toISOString(),
        leida: false,
        citaId: dto.citaId,
      },
    };
  },

  /**
   * Marca una alerta individual como leída
   */
  async markAsRead(id: string): Promise<boolean> {
    if (apiConfig.useBackendApi) {
      const res = await HttpClient.patch<boolean>(`/alertas/${id}/leida`, {});
      return !!res.success;
    }

    const list = getMockNotifications();
    const updated = list.map((n) => (n.id === id ? { ...n, leida: true } : n));
    saveMockNotifications(updated);
    return true;
  },

  /**
   * Marca todas las alertas del usuario como leídas
   */
  async markAllAsRead(usuarioId?: string): Promise<boolean> {
    if (apiConfig.useBackendApi) {
      const res = await HttpClient.patch<boolean>('/alertas/marcar-todas-leidas', { usuarioId });
      return !!res.success;
    }

    const list = getMockNotifications();
    const updated = list.map((n) => ({ ...n, leida: true }));
    saveMockNotifications(updated);
    return true;
  },
};
