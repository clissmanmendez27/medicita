import { Specialty, Doctor, User, Appointment, NotificationAlert, DoctorAvailabilityDay } from '../types';

// Helper to generate dynamic dates around today
const getDatesAround = () => {
  const dates = [];
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];
  
  const today = new Date();
  // Start from tomorrow
  for (let i = 1; i <= 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    // Skip sundays
    if (d.getDay() === 0) continue;

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    dates.push({
      fecha: dateStr,
      diaNombre: dayNames[d.getDay()],
      diaNumero: String(d.getDate()),
      mesNombre: monthNames[d.getMonth()],
    });
  }
  return dates;
};

const generatedDays = getDatesAround();

const generateSlotsForDay = (baseDayIndex: number): DoctorAvailabilityDay['slots'] => {
  const morningTimes = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30'];
  const afternoonTimes = ['02:00', '02:30', '03:00', '03:30', '04:00', '04:30', '05:00', '05:30'];

  const slots = [
    ...morningTimes.map((hora, idx) => ({
      id: `m-${baseDayIndex}-${idx}`,
      hora,
      periodo: 'mañana' as const,
      // First slot or two might be occupied to demonstrate realistic availability
      estado: (idx === 1 || idx === 4) ? ('ocupado' as const) : ('disponible' as const),
    })),
    ...afternoonTimes.map((hora, idx) => ({
      id: `a-${baseDayIndex}-${idx}`,
      hora,
      periodo: 'tarde' as const,
      estado: (idx === 2) ? ('ocupado' as const) : ('disponible' as const),
    })),
  ];

  return slots;
};

const createDoctorAvailability = (): DoctorAvailabilityDay[] => {
  return generatedDays.map((day, index) => {
    const slots = generateSlotsForDay(index);
    const availableSlots = slots.filter(s => s.estado === 'disponible').length;
    let nivel: DoctorAvailabilityDay['disponibilidadNivel'] = 'alta';
    if (availableSlots <= 2) nivel = 'baja';
    else if (availableSlots <= 6) nivel = 'media';

    return {
      fecha: day.fecha,
      diaNombre: day.diaNombre,
      diaNumero: day.diaNumero,
      mesNombre: day.mesNombre,
      disponibilidadNivel: nivel,
      cuposDisponibles: availableSlots,
      slots,
    };
  });
};

export const INITIAL_SPECIALTIES: Specialty[] = [
  {
    id: 'esp-cardiologia',
    nombre: 'Cardiología',
    descripcion: 'Diagnóstico, tratamiento y prevención de patologías cardiovasculares y arritmias.',
    icono: 'HeartPulse',
    color: 'emerald',
    doctoresCount: 3,
    precioBase: 120,
    sintomasFrecuentes: ['Dolor de pecho', 'Palpitaciones', 'Hipertensión', 'Falta de aire', 'Mareos'],
  },
  {
    id: 'esp-pediatria',
    nombre: 'Pediatría',
    descripcion: 'Atención médica integral para recién nacidos, niños y adolescentes con enfoque preventivo.',
    icono: 'Baby',
    color: 'blue',
    doctoresCount: 4,
    precioBase: 95,
    sintomasFrecuentes: ['Fiebre infantil', 'Control de crecimiento', 'Vacunación', 'Tos persistente', 'Cólicos'],
  },
  {
    id: 'esp-medicina-general',
    nombre: 'Medicina General',
    descripcion: 'Evaluación clínica primaria, diagnóstico temprano y derivación especializada oportuna.',
    icono: 'Stethoscope',
    color: 'cyan',
    doctoresCount: 6,
    precioBase: 70,
    sintomasFrecuentes: ['Malestar general', 'Chequeo preventivo', 'Gripe', 'Dolor abdominal', 'Fatiga'],
  },
  {
    id: 'esp-dermatologia',
    nombre: 'Dermatología',
    descripcion: 'Cuidado especializado de la piel, cabello, uñas y tratamiento de lesiones cutáneas.',
    icono: 'Sparkles',
    color: 'violet',
    doctoresCount: 3,
    precioBase: 110,
    sintomasFrecuentes: ['Acné severo', 'Manchas en la piel', 'Eczema o alergia', 'Caída de cabello', 'Lunares sospechosos'],
  },
  {
    id: 'esp-odontologia',
    nombre: 'Odontología',
    descripcion: 'Salud bucal, profilaxis dental, endodoncia, ortodoncia y estética restaurativa.',
    icono: 'Smile',
    color: 'amber',
    doctoresCount: 3,
    precioBase: 85,
    sintomasFrecuentes: ['Dolor de muelas', 'Limpieza dental', 'Encías inflamadas', 'Caries', 'Sensibilidad'],
  },
  {
    id: 'esp-ginecologia',
    nombre: 'Ginecología',
    descripcion: 'Salud reproductiva femenina, control prenatal, citologías y chequeos hormonales.',
    icono: 'Activity',
    color: 'rose',
    doctoresCount: 2,
    precioBase: 115,
    sintomasFrecuentes: ['Control ginecológico anual', 'Papanicolau', 'Irregularidad menstrual', 'Planificación familiar'],
  },
];

export const INITIAL_DOCTORS: Doctor[] = [
  {
    id: 'doc-alejandro-morales',
    nombre: 'Dr. Alejandro Morales',
    especialidadId: 'esp-cardiologia',
    especialidadNombre: 'Cardiología',
    colegiatura: 'CMP 45892 • RNE 21045',
    experiencia: '14 años de experiencia',
    calificacion: 4.9,
    opinionesCount: 142,
    sede: 'Torre Médica Central',
    consultorio: 'Cons. 402 - Piso 4',
    fotoUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
    bio: 'Especialista en cardiología clínica y ecocardiografía avanzada. Miembro titular de la Sociedad Interamericana de Cardiología.',
    diasAtencion: ['Lunes', 'Miércoles', 'Jueves', 'Viernes'],
    disponibilidad: createDoctorAvailability(),
    precioConsulta: 130,
  },
  {
    id: 'doc-carlos-ramirez',
    nombre: 'Dr. Carlos Ramírez',
    especialidadId: 'esp-cardiologia',
    especialidadNombre: 'Cardiología',
    colegiatura: 'CMP 48920 • RNE 23910',
    experiencia: '12 años de experiencia',
    calificacion: 4.8,
    opinionesCount: 98,
    sede: 'Torre Médica Central',
    consultorio: 'Cons. 405 - Piso 4',
    fotoUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400',
    bio: 'Especialista en prevención de infarto y manejo clínico de hipertensión arterial refractaria.',
    diasAtencion: ['Lunes', 'Martes', 'Jueves', 'Sábado'],
    disponibilidad: createDoctorAvailability(),
    precioConsulta: 120,
  },
  {
    id: 'doc-maria-lopez',
    nombre: 'Dra. María López',
    especialidadId: 'esp-pediatria',
    especialidadNombre: 'Pediatría',
    colegiatura: 'CMP 51240 • RNE 26180',
    experiencia: '9 años de experiencia',
    calificacion: 4.9,
    opinionesCount: 215,
    sede: 'Torre Médica Central',
    consultorio: 'Cons. 208 - Piso 2 (Área Infantil)',
    fotoUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400',
    bio: 'Pediatra certificada enfocada en desarrollo psicomotor infantil y nutrición balanceada.',
    diasAtencion: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
    disponibilidad: createDoctorAvailability(),
    precioConsulta: 95,
  },
  {
    id: 'doc-jose-torres',
    nombre: 'Dr. José Torres',
    especialidadId: 'esp-medicina-general',
    especialidadNombre: 'Medicina General',
    colegiatura: 'CMP 39182',
    experiencia: '16 años de experiencia',
    calificacion: 4.7,
    opinionesCount: 310,
    sede: 'Sede Norte - Av. Las Palmeras 104',
    consultorio: 'Cons. 104 - Piso 1',
    fotoUrl: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=400',
    bio: 'Médico internista y general con amplia trayectoria en manejo de patologías metabólicas y chequeos preventivos.',
    diasAtencion: ['Lunes', 'Miércoles', 'Viernes', 'Sábado'],
    disponibilidad: createDoctorAvailability(),
    precioConsulta: 70,
  },
  {
    id: 'doc-ana-martinez',
    nombre: 'Dra. Ana Martínez',
    especialidadId: 'esp-dermatologia',
    especialidadNombre: 'Dermatología',
    colegiatura: 'CMP 44810 • RNE 20119',
    experiencia: '11 años de experiencia',
    calificacion: 4.9,
    opinionesCount: 167,
    sede: 'Sede Norte - Av. Las Palmeras 104',
    consultorio: 'Cons. 105 - Piso 1',
    fotoUrl: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?auto=format&fit=crop&q=80&w=400',
    bio: 'Dermatóloga clínica y quirúrgica. Tratamiento de afecciones inflamatorias, acné y despigmentación.',
    diasAtencion: ['Martes', 'Jueves', 'Viernes'],
    disponibilidad: createDoctorAvailability(),
    precioConsulta: 110,
  },
  {
    id: 'doc-sofia-alarcon',
    nombre: 'Dra. Sofía Alarcón',
    especialidadId: 'esp-ginecologia',
    especialidadNombre: 'Ginecología y Obstetricia',
    colegiatura: 'CMP 46210 • RNE 22108',
    experiencia: '13 años de experiencia',
    calificacion: 4.8,
    opinionesCount: 130,
    sede: 'Torre Médica Central',
    consultorio: 'Cons. 312 - Piso 3',
    fotoUrl: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?auto=format&fit=crop&q=80&w=400',
    bio: 'Especialista en control del bienestar materno-fetal, ecografía obstétrica y endocrinología ginecológica.',
    diasAtencion: ['Lunes', 'Miércoles', 'Jueves'],
    disponibilidad: createDoctorAvailability(),
    precioConsulta: 115,
  },
  {
    id: 'doc-ricardo-vargas',
    nombre: 'Dr. Ricardo Vargas',
    especialidadId: 'esp-odontologia',
    especialidadNombre: 'Odontología Integral',
    colegiatura: 'COP 29014',
    experiencia: '10 años de experiencia',
    calificacion: 4.8,
    opinionesCount: 89,
    sede: 'Sede Norte - Av. Las Palmeras 104',
    consultorio: 'Box Odontológico 2',
    fotoUrl: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=400',
    bio: 'Odontólogo especialista en rehabilitación oral mínimamente invasiva y diseño de sonrisa funcional.',
    diasAtencion: ['Lunes', 'Martes', 'Miércoles', 'Viernes'],
    disponibilidad: createDoctorAvailability(),
    precioConsulta: 85,
  },
];

export const INITIAL_USERS: User[] = [
  {
    id: 'user-carlos-mendoza',
    nombre: 'Carlos',
    apellidos: 'Mendoza Ruiz',
    email: 'carlos.mendoza@email.com',
    rol: 'paciente',
    dni: '1024982110',
    telefono: '+51 984 210 442',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
    seguroEps: 'EPS Sura - Plan Integral',
    planSalud: 'Cobertura al 80%',
    numeroAfiliacion: 'SUR-842099',
    fechaNacimiento: '1988-06-14',
    genero: 'Masculino',
  },
  {
    id: 'user-doc-carlos',
    nombre: 'Carlos',
    apellidos: 'Ramírez',
    email: 'dr.ramirez@medigita.com',
    rol: 'medico',
    dni: '09842104',
    telefono: '+51 977 123 456',
    avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200',
    doctorProfileId: 'doc-carlos-ramirez',
  },
  {
    id: 'user-doc-morales',
    nombre: 'Alejandro',
    apellidos: 'Morales',
    email: 'dr.morales@medicita.com',
    rol: 'medico',
    dni: '08124982',
    telefono: '+51 988 654 321',
    avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200',
    doctorProfileId: 'doc-alejandro-morales',
  },
  {
    id: 'user-admin',
    nombre: 'Clisman',
    apellidos: 'Mendez',
    email: 'clisman.mendez@medicita.com',
    rol: 'admin',
    dni: '72842910',
    telefono: '+51 999 888 777',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
  },
];

// Calculate target date for initial appointment (e.g. day 1 from generated days)
const firstDay = generatedDays[0] || { fecha: '2026-03-24', diaNombre: 'Jueves', diaNumero: '24', mesNombre: 'Oct' };

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-001',
    codigo: '#MED-84920',
    pacienteId: 'user-carlos-mendoza',
    pacienteNombre: 'Carlos Mendoza Ruiz',
    pacienteDni: '1024982110',
    pacienteTelefono: '+51 984 210 442',
    pacienteEmail: 'carlos.mendoza@email.com',
    medicoId: 'doc-alejandro-morales',
    medicoNombre: 'Dr. Alejandro Morales',
    medicoFoto: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200',
    medicoColegiatura: 'CMP 45892',
    especialidadId: 'esp-cardiologia',
    especialidadNombre: 'Cardiología',
    sede: 'Torre Médica Central',
    consultorio: 'Cons. 402 - Piso 4',
    fecha: firstDay.fecha,
    fechaFormateada: `${firstDay.diaNombre}, ${firstDay.diaNumero} de ${firstDay.mesNombre}`,
    hora: '09:30 AM',
    motivo: 'Evaluación cardiovascular preventiva y control de presión arterial periódica.',
    sintomasPrevios: ['Dolor torácico leve ocasional', 'Palpitaciones al hacer ejercicio'],
    estado: 'confirmada',
    fechaCreacion: '2026-03-15',
    costoTotal: 130,
    coberturaEps: 104,
    copago: 26,
    indicacionesClinicas: [
      'Ayuno estricto de 4 horas previas a la evaluación ecocardiográfica.',
      'Presentarse 15 minutos antes en recepción del 4to piso.',
      'Traer documento de identidad y resultados de perfil lipídico si los tiene.',
    ],
  },
  {
    id: 'apt-002',
    codigo: '#MED-77104',
    pacienteId: 'user-carlos-mendoza',
    pacienteNombre: 'Carlos Mendoza Ruiz',
    pacienteDni: '1024982110',
    pacienteTelefono: '+51 984 210 442',
    pacienteEmail: 'carlos.mendoza@email.com',
    medicoId: 'doc-ana-martinez',
    medicoNombre: 'Dra. Ana Martínez',
    medicoFoto: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?auto=format&fit=crop&q=80&w=200',
    medicoColegiatura: 'CMP 44810',
    especialidadId: 'esp-dermatologia',
    especialidadNombre: 'Dermatología',
    sede: 'Sede Norte - Av. Las Palmeras 104',
    consultorio: 'Cons. 105 - Piso 1',
    fecha: generatedDays[2]?.fecha || '2026-03-27',
    fechaFormateada: `${generatedDays[2]?.diaNombre || 'Sábado'}, ${generatedDays[2]?.diaNumero || '26'} de ${generatedDays[2]?.mesNombre || 'Oct'}`,
    hora: '03:30 PM',
    motivo: 'Revisión preventiva de lesiones pigmentadas en extremidad superior derecha.',
    sintomasPrevios: ['Aparición de nuevo lunar irregular'],
    estado: 'pendiente',
    fechaCreacion: '2026-03-18',
    costoTotal: 110,
    coberturaEps: 88,
    copago: 22,
    indicacionesClinicas: [
      'No aplicar cremas cosméticas ni autobronceadores el día de la cita.',
    ],
  },
  {
    id: 'apt-003',
    codigo: '#MED-61029',
    pacienteId: 'user-carlos-mendoza',
    pacienteNombre: 'Carlos Mendoza Ruiz',
    pacienteDni: '1024982110',
    pacienteTelefono: '+51 984 210 442',
    pacienteEmail: 'carlos.mendoza@email.com',
    medicoId: 'doc-jose-torres',
    medicoNombre: 'Dr. José Torres',
    medicoFoto: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=200',
    medicoColegiatura: 'CMP 39182',
    especialidadId: 'esp-medicina-general',
    especialidadNombre: 'Medicina General',
    sede: 'Sede Norte - Av. Las Palmeras 104',
    consultorio: 'Cons. 104 - Piso 1',
    fecha: '2026-02-10',
    fechaFormateada: 'Martes, 10 de Febrero',
    hora: '10:00 AM',
    motivo: 'Chequeo médico anual laboral y evaluación de cuadro respiratorio.',
    estado: 'atendida',
    fechaCreacion: '2026-02-01',
    costoTotal: 70,
    coberturaEps: 56,
    copago: 14,
    notasMedicas: 'Paciente en buen estado general. Murmullo vesicular normal. Se solicita perfil lipídico de control y se prescribe hidratación y descanso.',
    recetaMedica: 'Paracetamol 500mg cada 8 horas por 3 días si hay cefalea. Hidratación constante.',
  },
];

export const INITIAL_NOTIFICATIONS: NotificationAlert[] = [
  {
    id: 'notif-001',
    tipo: 'recordatorio',
    titulo: 'Recordatorio clínico importante',
    mensaje: 'Recuerda cumplir el ayuno de 4 horas previas a tu cita con el Dr. Alejandro Morales (#MED-84920).',
    fecha: 'Hoy',
    hora: 'Hace 35 min',
    leida: false,
    citaId: 'apt-001',
    urgencia: 'alta',
  },
  {
    id: 'notif-002',
    tipo: 'cita_confirmada',
    titulo: 'Cita médica confirmada',
    mensaje: 'Tu cita #MED-84920 con Cardiología en Torre Médica Central ha sido confirmada por el centro médico.',
    fecha: 'Ayer',
    hora: '14:20',
    leida: true,
    citaId: 'apt-001',
    urgencia: 'media',
  },
  {
    id: 'notif-003',
    tipo: 'laboratorio',
    titulo: 'Resultados de laboratorio disponibles',
    mensaje: 'Los resultados de tu hemograma completo y perfil glucémico ya están anexados a tu expediente.',
    fecha: '18 Mar',
    hora: '09:15',
    leida: true,
    urgencia: 'baja',
  },
];
