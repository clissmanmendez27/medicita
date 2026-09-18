/**
 * Central Export for MediCita Data Access Layer & Services
 * Exposes both modular services corresponding to the Node.js backend:
 * - usuarioService
 * - pacienteService
 * - medicoService
 * - especialidadService
 * - citaService
 * - alertaService
 * - authService
 *
 * As well as the unified façade `MedicitaService` for existing UI components.
 */

export * from './api/apiConfig';
export * from './api/httpClient';
export * from './modules/usuarioService';
export * from './modules/pacienteService';
export * from './modules/medicoService';
export * from './modules/especialidadService';
export * from './modules/citaService';
export * from './modules/alertaService';
export * from './modules/authService';

export { MedicitaService, subscribeToStore } from './medicitaService';
