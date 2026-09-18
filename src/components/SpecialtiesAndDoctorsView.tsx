import React, { useState } from 'react';
import {
  Search,
  Star,
  MapPin,
  Calendar,
  ChevronRight,
  ArrowRight,
  HeartPulse,
  Baby,
  Stethoscope,
  Sparkles,
  Smile,
  Activity,
  Filter,
} from 'lucide-react';
import { Specialty, Doctor } from '../types';

interface SpecialtiesAndDoctorsViewProps {
  specialties: Specialty[];
  doctors: Doctor[];
  onSelectSpecialtyForBooking: (specialtyId: string) => void;
  onSelectDoctorForBooking: (doctor: Doctor) => void;
}

export const SpecialtiesAndDoctorsView: React.FC<SpecialtiesAndDoctorsViewProps> = ({
  specialties,
  doctors,
  onSelectSpecialtyForBooking,
  onSelectDoctorForBooking,
}) => {
  const [activeTab, setActiveTab] = useState<'especialidades' | 'medicos'>('especialidades');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSpecialtyFilter, setSelectedSpecialtyFilter] = useState<string>('todas');

  const getSpecialtyIcon = (iconName: string) => {
    switch (iconName) {
      case 'HeartPulse':
        return <HeartPulse className="w-5 h-5 text-rose-600" />;
      case 'Baby':
        return <Baby className="w-5 h-5 text-blue-600" />;
      case 'Stethoscope':
        return <Stethoscope className="w-5 h-5 text-cyan-600" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-violet-600" />;
      case 'Smile':
        return <Smile className="w-5 h-5 text-amber-600" />;
      default:
        return <Activity className="w-5 h-5 text-emerald-600" />;
    }
  };

  const filteredSpecialties = specialties.filter(
    (s) =>
      s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDoctors = doctors.filter((doc) => {
    const matchesSpecialty =
      selectedSpecialtyFilter === 'todas' || doc.especialidadId === selectedSpecialtyFilter;
    const matchesSearch =
      doc.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.especialidadNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.sede.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSpecialty && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-sans">
          Especialidades y Cuerpo Médico
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Consulta nuestro directorio de servicios médicos y especialistas de staff con disponibilidad en tiempo real
        </p>
      </div>

      {/* Tabs & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Main Mode Tabs */}
          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab('especialidades')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'especialidades'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Especialidades ({specialties.length})
            </button>
            <button
              onClick={() => setActiveTab('medicos')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'medicos'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Médicos Especialistas ({doctors.length})
            </button>
          </div>

          {/* Search input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={activeTab === 'especialidades' ? 'Buscar especialidad...' : 'Buscar médico o sede...'}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Sub-filter if doctors tab is active */}
        {activeTab === 'medicos' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100 scrollbar-none">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mr-1">Filtrar:</span>
            <button
              onClick={() => setSelectedSpecialtyFilter('todas')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${
                selectedSpecialtyFilter === 'todas'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todas las áreas
            </button>
            {specialties.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSpecialtyFilter(s.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${
                  selectedSpecialtyFilter === s.id
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s.nombre}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* View 1: Especialidades Grid */}
      {activeTab === 'especialidades' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSpecialties.map((esp) => (
            <div
              key={esp.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    {getSpecialtyIcon(esp.icono)}
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                    {esp.doctoresCount} médicos de staff
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-900">{esp.nombre}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {esp.descripcion}
                </p>

                {/* Symptoms chips */}
                <div className="mt-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Motivos y Síntomas Frecuentes:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {esp.sintomasFrecuentes.map((s) => (
                      <span
                        key={s}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">Tarifa particular</span>
                  <span className="text-xs font-bold text-slate-900">Desde S/. {esp.precioBase}</span>
                </div>

                <button
                  id={`book-specialty-btn-${esp.id}`}
                  onClick={() => onSelectSpecialtyForBooking(esp.id)}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <span>Ver médicos y agendar</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View 2: Médicos Grid */}
      {activeTab === 'medicos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDoctors.map((doc) => {
            const nextSlotDay = doc.disponibilidad[0];
            return (
              <div
                key={doc.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start gap-4">
                    <img
                      src={doc.fotoUrl}
                      alt={doc.nombre}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?auto=format&fit=crop&q=80&w=400';
                      }}
                      className="w-16 h-16 rounded-2xl object-cover ring-1 ring-slate-200 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-blue-600 uppercase tracking-wide truncate">
                          {doc.especialidadNombre}
                        </span>
                        <div className="flex items-center gap-1 text-xs font-bold text-slate-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100 shrink-0">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span>{doc.calificacion}</span>
                          <span className="text-[10px] text-slate-400 font-normal">({doc.opinionesCount})</span>
                        </div>
                      </div>
                      <h3 className="font-bold text-base text-slate-900 mt-0.5 truncate">{doc.nombre}</h3>
                      <p className="text-xs text-slate-500">{doc.colegiatura} • {doc.experiencia}</p>
                      <p className="text-xs text-slate-600 flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{doc.sede} ({doc.consultorio})</span>
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    "{doc.bio}"
                  </p>

                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                    <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>Días de atención: {doc.diasAtencion.join(', ')}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="text-xs">
                    <span className="text-slate-400 text-[10px] block">Próximo turno libre:</span>
                    <span className="font-bold text-emerald-700">
                      {nextSlotDay ? `${nextSlotDay.diaNombre} ${nextSlotDay.diaNumero} (${nextSlotDay.cuposDisponibles} cupos)` : 'Disponible'}
                    </span>
                  </div>

                  <button
                    id={`doc-book-cta-${doc.id}`}
                    onClick={() => onSelectDoctorForBooking(doc)}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <span>Agendar Cita</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
