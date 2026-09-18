import React, { useState, useEffect } from 'react';
import {
  Server,
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Code2,
  Layers,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Lock,
} from 'lucide-react';
import { apiConfig, ApiConfigManager } from '../services/api/apiConfig';
import { HttpClient } from '../services/api/httpClient';

export const BackendDataLayerPanel: React.FC = () => {
  const [isBackendMode, setIsBackendMode] = useState<boolean>(ApiConfigManager.isUsingBackendApi());
  const [healthStatus, setHealthStatus] = useState<{
    tested: boolean;
    ok: boolean;
    message: string;
    version?: string;
  }>({
    tested: false,
    ok: false,
    message: 'Sin verificar',
  });
  const [isTesting, setIsTesting] = useState(false);
  const [activeTab, setActiveTab] = useState<'servicios' | 'prisma' | 'entidades'>('servicios');
  const [backendMeta, setBackendMeta] = useState<any>(null);

  const testConnection = async () => {
    setIsTesting(true);
    try {
      const result = await ApiConfigManager.testBackendHealth();
      setHealthStatus({
        tested: true,
        ok: result.ok,
        message: result.message,
        version: result.version,
      });

      if (result.ok) {
        const statusRes = await HttpClient.get<any>('/backend/status');
        if (statusRes.success && statusRes.data) {
          setBackendMeta(statusRes.data);
        }
      }
    } catch {
      setHealthStatus({
        tested: true,
        ok: false,
        message: 'No se pudo conectar con el servidor backend.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  const handleToggleMode = (enableBackend: boolean) => {
    setIsBackendMode(enableBackend);
    ApiConfigManager.setUseBackendApi(enableBackend);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-6">
      {/* Top Banner & Mode Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 text-indigo-600">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base text-slate-900 font-sans">
                Capa de Acceso a Datos y Backend Node.js
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800">
                Prisma ORM Ready
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Arquitectura modular desacoplada: interfaz separada de la capa de servicios y acceso a datos.
            </p>
          </div>
        </div>

        {/* Mode Toggle Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl self-start sm:self-auto text-xs">
          <button
            id="toggle-mock-mode-btn"
            onClick={() => handleToggleMode(false)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              !isBackendMode
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Datos Ficticios (Simulación)</span>
          </button>
          <button
            id="toggle-backend-api-btn"
            onClick={() => handleToggleMode(true)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              isBackendMode
                ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>API Backend Node.js</span>
          </button>
        </div>
      </div>

      {/* Connection Status & Security Notice */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {healthStatus.ok ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            )}
            <div className="text-xs">
              <span className="font-semibold text-slate-800 block">
                {healthStatus.ok ? 'Servidor Node.js Online' : 'Servidor Local'}
              </span>
              <span className="text-[11px] text-slate-500">
                {healthStatus.ok ? `Versión API: ${healthStatus.version || '1.0.0'}` : healthStatus.message}
              </span>
            </div>
          </div>
          <button
            onClick={testConnection}
            disabled={isTesting}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-all"
            title="Re-probar conexión"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
          <Database className="w-4 h-4 text-indigo-600 shrink-0" />
          <div className="text-xs">
            <span className="font-semibold text-slate-800 block">Prisma ORM Schema</span>
            <span className="text-[11px] text-slate-500 font-mono">prisma/schema.prisma</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <div className="text-xs">
            <span className="font-semibold text-slate-800 block">Seguridad del Cliente</span>
            <span className="text-[11px] text-emerald-700 font-medium">
              Sin credenciales ni secretos expuestos
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('servicios')}
          className={`px-3 py-1.5 rounded-xl transition-all ${
            activeTab === 'servicios'
              ? 'bg-blue-50 text-blue-700 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Servicios y Módulos de Backend
        </button>
        <button
          onClick={() => setActiveTab('entidades')}
          className={`px-3 py-1.5 rounded-xl transition-all ${
            activeTab === 'entidades'
              ? 'bg-blue-50 text-blue-700 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Entidades del Sistema (6)
        </button>
        <button
          onClick={() => setActiveTab('prisma')}
          className={`px-3 py-1.5 rounded-xl transition-all ${
            activeTab === 'prisma'
              ? 'bg-blue-50 text-blue-700 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Esquema Prisma (schema.prisma)
        </button>
      </div>

      {/* Tab: Servicios */}
      {activeTab === 'servicios' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            {
              name: 'usuarioService',
              module: 'autenticación / usuarios',
              endpoint: '/api/usuarios',
              entity: 'Usuario',
              methods: ['getAll()', 'getById(id)', 'getByEmail(correo)', 'create(dto)'],
              desc: 'Gestión de cuentas, roles de acceso y credenciales con hash en servidor.',
            },
            {
              name: 'pacienteService',
              module: 'pacientes',
              endpoint: '/api/pacientes',
              entity: 'Paciente',
              methods: ['getAll()', 'getById(id)', 'getByUsuarioId(uid)', 'getByDni(dni)', 'create(dto)'],
              desc: 'Datos demográficos, DNI único, teléfono y vinculación con la cuenta de usuario.',
            },
            {
              name: 'medicoService',
              module: 'médicos',
              endpoint: '/api/medicos',
              entity: 'Médico',
              methods: ['getAll(espId)', 'getById(id)', 'updateSlotStatus()', 'getUiDoctors()'],
              desc: 'Colegiatura, experiencia, información profesional y matriz de turnos/cupos.',
            },
            {
              name: 'especialidadService',
              module: 'especialidades',
              endpoint: '/api/especialidades',
              entity: 'Especialidad',
              methods: ['getAll()', 'getById(id)', 'getUiSpecialties()'],
              desc: 'Catálogo de especialidades clínicas, descripciones y precios referenciales.',
            },
            {
              name: 'citaService',
              module: 'citas',
              endpoint: '/api/citas',
              entity: 'Cita',
              methods: ['getAll(filtro)', 'create(dto)', 'cancel(id)', 'reschedule(id)', 'updateNotes()'],
              desc: 'Reserva con validación de colisiones, reprogramación, notas y recetas médicas.',
            },
            {
              name: 'alertaService',
              module: 'alertas',
              endpoint: '/api/alertas',
              entity: 'Alerta',
              methods: ['getAll(uid)', 'create(dto)', 'markAsRead(id)', 'markAllAsRead()'],
              desc: 'Notificaciones de confirmación, cancelación y avisos clínicos en tiempo real.',
            },
          ].map((svc) => (
            <div
              key={svc.name}
              className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-2 hover:border-blue-200 transition-all text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                  {svc.name}
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  {svc.module}
                </span>
              </div>
              <p className="text-[11px] text-slate-600">{svc.desc}</p>
              <div className="pt-1 border-t border-slate-200/50 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>Ruta: {svc.endpoint}</span>
                <span className="text-indigo-600 font-semibold">{svc.entity}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Entidades */}
      {activeTab === 'entidades' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {[
              {
                entity: 'Usuario',
                fields: ['id (String / UUID)', 'correo (String único)', 'contraseña/hash (String en servidor)', 'rol (PACIENTE | MEDICO | ADMIN)'],
                role: 'Núcleo de identidad y permisos del sistema.',
              },
              {
                entity: 'Paciente',
                fields: ['id (String / UUID)', 'usuarioId (FK Usuario)', 'nombres (String)', 'apellidos (String)', 'DNI (String único)', 'teléfono (String)'],
                role: 'Perfil clínico y personal del asegurado o particular.',
              },
              {
                entity: 'Médico',
                fields: ['id (String / UUID)', 'nombres (String)', 'apellidos (String)', 'especialidadId (FK Especialidad)', 'información profesional (CMP, RNE, sede, exp)', 'disponibilidad (Matriz de días y slots)'],
                role: 'Especialista clínico con agenda y consultorio.',
              },
              {
                entity: 'Especialidad',
                fields: ['id (String / UUID)', 'nombre (String único)', 'descripción (String)', 'precioBase (Decimal)', 'sintomasFrecuentes (Array)'],
                role: 'Categorización clínica médica de los consultorios.',
              },
              {
                entity: 'Cita',
                fields: ['id (String / UUID)', 'pacienteId (FK Paciente)', 'medicoId (FK Médico)', 'fecha (String ISO)', 'hora (String)', 'motivo (String)', 'estado (PENDIENTE | CONFIRMADA | ATENDIDA | CANCELADA)'],
                role: 'Registro transaccional de atención y turnos médicos.',
              },
              {
                entity: 'Alerta',
                fields: ['id (String / UUID)', 'usuarioId (FK Usuario)', 'mensaje (String)', 'tipo (CITA_CONFIRMADA | RECORDATORIO | etc.)', 'fecha (DateTime)', 'leída (Boolean)'],
                role: 'Notificaciones y avisos automáticos para el usuario.',
              },
            ].map((e) => (
              <div key={e.entity} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm font-sans">{e.entity}</span>
                  <span className="text-[10px] text-slate-500 font-mono">Entidad Prisma</span>
                </div>
                <p className="text-[11px] text-slate-500">{e.role}</p>
                <div className="space-y-0.5 pt-1">
                  {e.fields.map((f, i) => (
                    <div key={i} className="text-[11px] font-mono text-slate-700 flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-blue-500" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Prisma Schema Preview */}
      {activeTab === 'prisma' && (
        <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl font-mono text-xs overflow-x-auto space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-[11px] pb-2 border-b border-slate-800">
            <span>prisma/schema.prisma</span>
            <span className="text-emerald-400">Valido para PostgreSQL / SQLite / MySQL</span>
          </div>
          <pre className="text-[11px] leading-relaxed text-slate-300">
{`datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Usuario {
  id              String      @id @default(uuid())
  correo          String      @unique
  contrasenaHash  String
  rol             RolUsuario  @default(PACIENTE)
  paciente        Paciente?
  medico          Medico?
  alertas         Alerta[]
}

model Paciente {
  id        String   @id @default(uuid())
  usuarioId String   @unique
  nombres   String
  apellidos String
  dni       String   @unique
  telefono  String
  usuario   Usuario  @relation(fields: [usuarioId], references: [id])
  citas     Cita[]
}

model Medico {
  id                     String       @id @default(uuid())
  nombres                String
  apellidos              String
  especialidadId         String
  colegiatura            String
  bio                    String
  disponibilidad         Json
  especialidad           Especialidad @relation(fields: [especialidadId], references: [id])
  citas                  Cita[]
}

model Especialidad {
  id          String   @id @default(uuid())
  nombre      String   @unique
  descripcion String
  medicos     Medico[]
  citas       Cita[]
}

model Cita {
  id          String     @id @default(uuid())
  pacienteId  String
  medicoId    String
  fecha       String
  hora        String
  motivo      String
  estado      EstadoCita @default(CONFIRMADA)
  paciente    Paciente   @relation(fields: [pacienteId], references: [id])
  medico      Medico     @relation(fields: [medicoId], references: [id])
}

model Alerta {
  id        String     @id @default(uuid())
  usuarioId String
  mensaje   String
  tipo      TipoAlerta
  fecha     DateTime   @default(now())
  leida     Boolean    @default(false)
  usuario   Usuario    @relation(fields: [usuarioId], references: [id])
}`}
          </pre>
        </div>
      )}
    </div>
  );
};
