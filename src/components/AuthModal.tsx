import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, User, Phone, CreditCard, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { User as UserType } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  initialMode: 'login' | 'register';
  onClose: () => void;
  onLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  onRegister: (data: Omit<UserType, 'id'>) => Promise<{ success: boolean; error?: string }>;
  onQuickLoginAs: (user: UserType) => void;
  allUsers: UserType[];
}

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode,
  onClose,
  onLogin,
  onRegister,
  onQuickLoginAs,
  allUsers,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  // Sync mode when initialMode changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrorMsg('');
    }
  }, [isOpen, initialMode]);

  // Keyboard accessibility: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Login form state
  const [loginEmail, setLoginEmail] = useState<string>('carlos.mendoza@email.com');
  const [loginPassword, setLoginPassword] = useState<string>('123456');

  // Register form state
  const [regNombre, setRegNombre] = useState<string>('');
  const [regApellidos, setRegApellidos] = useState<string>('');
  const [regDni, setRegDni] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regTelefono, setRegTelefono] = useState<string>('');
  const [regSeguro, setRegSeguro] = useState<string>('EPS Sura - Plan Integral');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>('');

  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setErrorMsg('Por favor ingresa tu correo y contraseña.');
      return;
    }
    if (!EMAIL_REGEX.test(loginEmail.trim())) {
      setErrorMsg('Ingresa un formato de correo electrónico válido (ejemplo: usuario@correo.com).');
      return;
    }
    if (loginPassword.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setErrorMsg('');
    setIsLoading(true);

    try {
      const res = await onLogin(loginEmail, loginPassword);
      if (res.success) {
        onClose();
      } else {
        setErrorMsg(res.error || 'Credenciales inválidas.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regNombre.trim() || !regApellidos.trim()) {
      setErrorMsg('El nombre y los apellidos son obligatorios.');
      return;
    }
    const cleanDni = regDni.replace(/\D/g, '');
    if (cleanDni.length < 8) {
      setErrorMsg('Ingresa un número de documento DNI válido (mínimo 8 dígitos numéricos).');
      return;
    }
    if (!EMAIL_REGEX.test(regEmail.trim())) {
      setErrorMsg('Ingresa un correo electrónico con formato válido (ejemplo: usuario@dominio.com).');
      return;
    }
    const cleanPhone = regTelefono.replace(/\D/g, '');
    if (cleanPhone.length < 9) {
      setErrorMsg('Ingresa un teléfono de contacto válido (mínimo 9 dígitos).');
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }

    setErrorMsg('');
    setIsLoading(true);

    try {
      const res = await onRegister({
        nombre: regNombre.trim(),
        apellidos: regApellidos.trim(),
        dni: cleanDni,
        email: regEmail.trim().toLowerCase(),
        telefono: regTelefono.trim(),
        seguroEps: regSeguro,
        planSalud: 'Cobertura al 80%',
        numeroAfiliacion: `SUR-${Math.floor(100000 + Math.random() * 900000)}`,
        rol: 'paciente',
      });

      if (res.success) {
        onClose();
      } else {
        setErrorMsg(res.error || 'Error al registrar la cuenta.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-5 animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 id="auth-modal-title" className="font-extrabold text-lg text-slate-900 font-sans">
              {mode === 'login' ? 'Iniciar Sesión en MediCita' : 'Registro de Nuevo Paciente'}
            </h3>
            <p className="text-xs text-slate-500">
              {mode === 'login'
                ? 'Accede a tus citas médicas y gestión clínica'
                : 'Crea tu expediente digital en pocos pasos'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg('');
            }}
            className={`py-2 rounded-lg transition-all ${
              mode === 'login' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMsg('');
            }}
            className={`py-2 rounded-lg transition-all ${
              mode === 'register' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Crear Cuenta
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Correo Electrónico:</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Contraseña:</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              id="auth-submit-login-btn"
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all"
            >
              {isLoading ? 'Verificando...' : 'Entrar a mi Cuenta'}
            </button>

            {/* Quick test role switcher pills */}
            <div className="pt-3 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Acceso Rápido para Pruebas (1 Clic):
              </span>
              <div className="space-y-1.5">
                {allUsers.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      onQuickLoginAs(u);
                      onClose();
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 text-left text-xs font-medium flex items-center justify-between transition-colors"
                  >
                    <span>
                      {u.nombre} {u.apellidos} (
                      <strong className="capitalize">{u.rol}</strong>)
                    </span>
                    <span className="text-[10px] text-blue-600 font-bold">Ingresar →</span>
                  </button>
                ))}
              </div>
            </div>
          </form>
        ) : (
          /* REGISTER FORM */
          <form onSubmit={handleRegisterSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Nombre(s):</label>
                <input
                  type="text"
                  value={regNombre}
                  onChange={(e) => setRegNombre(e.target.value)}
                  placeholder="Juan"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Apellidos:</label>
                <input
                  type="text"
                  value={regApellidos}
                  onChange={(e) => setRegApellidos(e.target.value)}
                  placeholder="Pérez Gómez"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">DNI:</label>
                <input
                  type="text"
                  maxLength={10}
                  value={regDni}
                  onChange={(e) => setRegDni(e.target.value.replace(/\D/g, ''))}
                  placeholder="10842910"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Teléfono:</label>
                <input
                  type="text"
                  value={regTelefono}
                  onChange={(e) => setRegTelefono(e.target.value)}
                  placeholder="+51 984 112 334"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Correo Electrónico:</label>
              <input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="juan.perez@email.com"
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Seguro de Salud / EPS:</label>
              <select
                value={regSeguro}
                onChange={(e) => setRegSeguro(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="EPS Sura - Plan Integral">EPS Sura - Plan Integral (Cobertura 80%)</option>
                <option value="Rímac Seguros Preferencial">Rímac Seguros Preferencial (Cobertura 80%)</option>
                <option value="Pacífico Salud Total">Pacífico Salud Total (Cobertura 85%)</option>
                <option value="EsSalud">EsSalud (Acreditación institucional)</option>
                <option value="Particular sin EPS">Particular (Tarifa privada sin seguro)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Contraseña:</label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Confirmar:</label>
                <input
                  type="password"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="Repetir clave"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              id="auth-submit-register-btn"
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all mt-2"
            >
              {isLoading ? 'Registrando paciente...' : 'Completar Registro'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
