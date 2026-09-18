import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { backendRouter } from './src/server/backendRoutes';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Mount Node.js Backend Services & Modules Router (Prisma ORM data structures)
app.use('/api', backendRouter);

// Lazy-loaded Gemini AI client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'MediCita Core API', version: '1.0.0' });
});

// Intelligent Assistant for Appointment Management endpoint
app.post('/api/ai/assistant', async (req, res) => {
  const { mensaje, historial = [], contexto = {} } = req.body;

  if (!mensaje || typeof mensaje !== 'string') {
    return res.status(400).json({ error: 'El mensaje del usuario es requerido.' });
  }

  const client = getGeminiClient();

  if (client) {
    try {
      const systemInstruction = `
Eres el "Asistente Automatizado de Citas MediCita".
Tu propósito exclusivo es ayudar a los pacientes a gestionar sus citas dentro de la plataforma MediCita.

REGLAS DE SEGURIDAD Y DOMINIO CRÍTICAS:
1. NO realizas diagnósticos médicos.
2. NO recomiendas tratamientos, medicamentos ni dosis.
3. NO interpretas síntomas como diagnósticos clínicos.
4. Su función está LIMITADA a la gestión y orientación dentro del sistema de citas.
5. Si el usuario describe síntomas de salud o pide una cura, responde con cortesía aclarando que como asistente automatizado no realizas diagnósticos ni recetas médicas, y oriéntalo hacia la especialidad médica más pertinente para agendar una cita.
6. Identifícate como asistencia automatizada cuando corresponda.
7. Utiliza ÚNICAMENTE los datos disponibles en el prototipo y NO inventes horarios ni médicos:
   - Cardiología: Dr. Alejandro Morales, Dr. Carlos Ramírez
   - Pediatría: Dra. María López
   - Medicina General: Dr. José Torres
   - Dermatología: Dra. Ana Martínez
   - Odontología: Dr. Ricardo Vargas
   - Ginecología: Dra. Sofía Alarcón
8. Si la información necesaria o el profesional/especialidad no existe, muestra un mensaje controlado amigable indicando las opciones existentes.
9. Si el usuario proporciona información insuficiente (por ejemplo, pide fecha pero no médico ni especialidad), solicita SOLAMENTE el dato necesario para avanzar.
10. Sigue el flujo natural de gestión de citas:
    - Ayudar a encontrar especialidad
    - Mostrar médicos disponibles
    - Consultar horarios reales
    - Guiar en la confirmación o cambio de horario
    - Mostrar próximas citas
    - Orientar para cancelar o reprogramar citas existentes.

Al final de tu respuesta, adjunta SIEMPRE el siguiente bloque JSON estructurado:
ASISTENTE_JSON: {
  "intencion": "buscar_especialidad" | "buscar_medico" | "consultar_horarios" | "seleccionar_horario" | "confirmar_cita" | "cambiar_horario" | "ver_citas" | "cancelar_cita" | "reprogramar_cita" | "informacion_insuficiente" | "no_encontrado" | "orientacion_general",
  "especialidad": string | null,
  "medicoNombre": string | null,
  "medicoId": string | null,
  "fecha": string | null,
  "hora": string | null,
  "datoFaltante": string | null
}
`;

      const prompt = `Contexto del sistema: ${JSON.stringify(contexto)}\nHistorial previo: ${JSON.stringify(historial.slice(-6))}\nMensaje del usuario: "${mensaje}"`;

      const response = await client.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.2,
        },
      });

      const responseText = response.text || '';
      let jsonMeta: any = null;
      let cleanText = responseText;

      const match = responseText.match(/ASISTENTE_JSON:\s*(\{[\s\S]*?\})/);
      if (match) {
        try {
          jsonMeta = JSON.parse(match[1]);
          cleanText = responseText.replace(/ASISTENTE_JSON:\s*\{[\s\S]*?\}/, '').trim();
        } catch (e) {
          console.error('Error parsing ASISTENTE_JSON', e);
        }
      }

      return res.json({
        respuesta: cleanText,
        meta: jsonMeta,
        fuente: 'gemini_asistente_automatizado',
      });
    } catch (err: any) {
      console.error('Error calling Gemini API for assistant:', err?.message || err);
    }
  }

  // Fallback Rule Engine (Reliable, fast, deterministic matching conforming strictly to user instructions)
  const lower = mensaje.toLowerCase().trim();
  let respuesta = '';
  let meta: any = {
    intencion: 'orientacion_general',
    especialidad: null,
    medicoNombre: null,
    medicoId: null,
    fecha: null,
    hora: null,
    datoFaltante: null,
  };

  // Symptom check warning
  const containsSymptoms = lower.includes('me duele') || lower.includes('tengo fiebre') || lower.includes('que tomo') || lower.includes('qué tomo') || lower.includes('pastilla') || lower.includes('tratamiento') || lower.includes('cura') || lower.includes('enfermedad');

  if (containsSymptoms) {
    let sugerida = 'Medicina General';
    if (lower.includes('pecho') || lower.includes('corazon') || lower.includes('corazón') || lower.includes('palpitacion')) sugerida = 'Cardiología';
    else if (lower.includes('piel') || lower.includes('mancha') || lower.includes('grano')) sugerida = 'Dermatología';
    else if (lower.includes('diente') || lower.includes('muela') || lower.includes('boca')) sugerida = 'Odontología';
    else if (lower.includes('hijo') || lower.includes('niño') || lower.includes('bebe') || lower.includes('bebé')) sugerida = 'Pediatría';

    respuesta = `Como asistente automatizado de MediCita, te informo que **no realizo diagnósticos médicos ni recomiendo tratamientos**.\n\nMi función es orientarte y ayudarte a coordinar una cita médica presencial. De acuerdo con lo que comentas, te sugiero agendar una cita con la especialidad de **${sugerida}** para que un médico colegiado te evalúe.`;
    meta.intencion = 'buscar_medico';
    meta.especialidad = sugerida;
  }
  // Intent: Mis citas
  else if (
    lower.includes('mis citas') ||
    lower.includes('proximas citas') ||
    lower.includes('próximas citas') ||
    lower.includes('ver citas') ||
    lower.includes('tengo citas') ||
    lower.includes('citas programadas')
  ) {
    respuesta = `He consultado tu expediente en MediCita. A continuación puedes revisar tus próximas citas programadas y gestionarlas si lo necesitas.`;
    meta.intencion = 'ver_citas';
  }
  // Intent: Cancelar cita
  else if (lower.includes('cancelar')) {
    respuesta = `Con gusto te asisto para cancelar tu cita. Selecciona a continuación la cita que deseas anular o indícame su código para procesar la liberación del horario.`;
    meta.intencion = 'cancelar_cita';
  }
  // Intent: Reprogramar cita
  else if (lower.includes('reprogramar') || lower.includes('cambiar fecha') || lower.includes('postergar')) {
    respuesta = `Entendido. Para reprogramar tu cita sin costo, selecciona la cita que deseas cambiar para mostrarte los nuevos turnos disponibles del médico.`;
    meta.intencion = 'reprogramar_cita';
  }
  // Intent: Confirmar cita
  else if (lower === 'confirmar' || lower.includes('confirmar cita') || lower === 'si' || lower === 'sí' || lower === 'confirmar!') {
    respuesta = `¡Excelente! Procedo a confirmar tu cita en el sistema MediCita.`;
    meta.intencion = 'confirmar_cita';
  }
  // Intent: Cambiar horario
  else if (lower.includes('cambiar horario') || lower.includes('otro horario') || lower.includes('otra hora') || lower.includes('otra fecha')) {
    respuesta = `De acuerdo, veamos otros horarios disponibles para tu cita:`;
    meta.intencion = 'cambiar_horario';
  }
  // Intent: Seleccionar hora específica
  else if (
    /(\d{1,2}:\d{2}\s*(am|pm)?|\b10:00\b|\b08:00\b|\b09:00\b|\b11:00\b|\b02:00\b|\b03:00\b|\b04:00\b|\b05:00\b)/i.test(lower)
  ) {
    const matchTime = lower.match(/\b(\d{1,2}:\d{2}(\s*(am|pm))?)\b/i);
    const horaDetectada = matchTime ? matchTime[1].toUpperCase() : '10:00 AM';
    respuesta = `Has seleccionado las ${horaDetectada}. ¿Deseas confirmar la cita?`;
    meta.intencion = 'seleccionar_horario';
    meta.hora = horaDetectada;
  }
  // Intent: Médico específico
  else if (lower.includes('carlos') || lower.includes('carlos ramirez') || lower.includes('ramírez')) {
    respuesta = `El Dr. Carlos Ramírez tiene estos horarios disponibles para consulta en Cardiología:`;
    meta.intencion = 'consultar_horarios';
    meta.medicoNombre = 'Dr. Carlos Ramírez';
    meta.medicoId = 'doc-carlos-ramirez';
    meta.especialidad = 'Cardiología';
  } else if (lower.includes('alejandro') || lower.includes('morales')) {
    respuesta = `El Dr. Alejandro Morales tiene estos horarios disponibles para consulta en Cardiología:`;
    meta.intencion = 'consultar_horarios';
    meta.medicoNombre = 'Dr. Alejandro Morales';
    meta.medicoId = 'doc-alejandro-morales';
    meta.especialidad = 'Cardiología';
  } else if (lower.includes('maria') || lower.includes('maría') || lower.includes('lopez') || lower.includes('lópez')) {
    respuesta = `La Dra. María López tiene estos horarios disponibles para consulta en Pediatría:`;
    meta.intencion = 'consultar_horarios';
    meta.medicoNombre = 'Dra. María López';
    meta.medicoId = 'doc-maria-lopez';
    meta.especialidad = 'Pediatría';
  } else if (lower.includes('jose') || lower.includes('josé') || lower.includes('torres')) {
    respuesta = `El Dr. José Torres tiene estos horarios disponibles para consulta en Medicina General:`;
    meta.intencion = 'consultar_horarios';
    meta.medicoNombre = 'Dr. José Torres';
    meta.medicoId = 'doc-jose-torres';
    meta.especialidad = 'Medicina General';
  } else if (lower.includes('ana') || lower.includes('martinez') || lower.includes('martínez')) {
    respuesta = `La Dra. Ana Martínez tiene estos horarios disponibles para consulta en Dermatología:`;
    meta.intencion = 'consultar_horarios';
    meta.medicoNombre = 'Dra. Ana Martínez';
    meta.medicoId = 'doc-ana-martinez';
    meta.especialidad = 'Dermatología';
  } else if (lower.includes('ricardo') || lower.includes('vargas')) {
    respuesta = `El Dr. Ricardo Vargas tiene estos horarios disponibles para consulta en Odontología:`;
    meta.intencion = 'consultar_horarios';
    meta.medicoNombre = 'Dr. Ricardo Vargas';
    meta.medicoId = 'doc-ricardo-vargas';
    meta.especialidad = 'Odontología';
  } else if (lower.includes('sofia') || lower.includes('sofía') || lower.includes('alarcon') || lower.includes('alarcón')) {
    respuesta = `La Dra. Sofía Alarcón tiene estos horarios disponibles para consulta en Ginecología:`;
    meta.intencion = 'consultar_horarios';
    meta.medicoNombre = 'Dra. Sofía Alarcón';
    meta.medicoId = 'doc-sofia-alarcon';
    meta.especialidad = 'Ginecología';
  }
  // Intent: Especialidad
  else if (lower.includes('cardio') || lower.includes('cardiologia') || lower.includes('cardiología')) {
    respuesta = `Claro. Estas son las opciones disponibles de Cardiología:`;
    meta.intencion = 'buscar_medico';
    meta.especialidad = 'Cardiología';
  } else if (lower.includes('pediat') || lower.includes('pediatria') || lower.includes('pediatría')) {
    respuesta = `Claro. Estas son las opciones disponibles de Pediatría:`;
    meta.intencion = 'buscar_medico';
    meta.especialidad = 'Pediatría';
  } else if (lower.includes('general') || lower.includes('medicina general')) {
    respuesta = `Claro. Estas son las opciones disponibles de Medicina General:`;
    meta.intencion = 'buscar_medico';
    meta.especialidad = 'Medicina General';
  } else if (lower.includes('derma') || lower.includes('dermatologia') || lower.includes('dermatología')) {
    respuesta = `Claro. Estas son las opciones disponibles de Dermatología:`;
    meta.intencion = 'buscar_medico';
    meta.especialidad = 'Dermatología';
  } else if (lower.includes('odonto') || lower.includes('odontologia') || lower.includes('odontología') || lower.includes('dental')) {
    respuesta = `Claro. Estas son las opciones disponibles de Odontología:`;
    meta.intencion = 'buscar_medico';
    meta.especialidad = 'Odontología';
  } else if (lower.includes('gineco') || lower.includes('ginecologia') || lower.includes('ginecología')) {
    respuesta = `Claro. Estas son las opciones disponibles de Ginecología:`;
    meta.intencion = 'buscar_medico';
    meta.especialidad = 'Ginecología';
  }
  // Intent: Ver especialidades generales
  else if (lower.includes('especialidad') || lower.includes('especialidades') || lower.includes('servicios') || lower.includes('catalogo') || lower.includes('catálogo')) {
    respuesta = `En MediCita contamos con las siguientes especialidades médicas disponibles. ¿En cuál de ellas te gustaría recibir atención?`;
    meta.intencion = 'buscar_especialidad';
  }
  // Intent: Iniciar cita general
  else if (lower.includes('cita') || lower.includes('turno') || lower.includes('agendar') || lower.includes('reservar')) {
    respuesta = `Con gusto te ayudo a agendar tu cita médica. ¿Para qué especialidad o con qué médico deseas la consulta?`;
    meta.intencion = 'informacion_insuficiente';
    meta.datoFaltante = 'especialidad_o_medico';
  }
  // Controlled message when specialty / doctor doesn't exist
  else if (
    lower.includes('neurolog') ||
    lower.includes('oftalmo') ||
    lower.includes('traumato') ||
    lower.includes('oncol') ||
    lower.includes('psiquiat') ||
    lower.includes('urolog')
  ) {
    respuesta = `Actualmente esa especialidad no se encuentra disponible en nuestro centro médico. En MediCita contamos con:\n\n• Cardiología\n• Pediatría\n• Medicina General\n• Dermatología\n• Odontología\n• Ginecología\n\n¿Deseas agendar con alguna de nuestras especialidades activas?`;
    meta.intencion = 'no_encontrado';
  }
  // Default greeting / welcome
  else {
    respuesta = `¡Hola! Soy tu asistente automatizado de MediCita. Te puedo ayudar a:\n\n1. Encontrar una especialidad médica\n2. Ver médicos disponibles y sus sedes\n3. Consultar horarios y agendar tu turno\n4. Ver tus próximas citas programadas\n5. Orientarte para reprogramar o cancelar una cita\n\n¿Cómo puedo asistirte hoy con tus citas?`;
    meta.intencion = 'orientacion_general';
  }

  return res.json({
    respuesta,
    meta,
    fuente: 'asistente_automatizado_local',
  });
});

// Clinical AI Assistant Triage endpoint (Updated with strict non-diagnostic orientation)
app.post('/api/ai/triage', async (req, res) => {
  const { mensaje, historial = [] } = req.body;

  if (!mensaje || typeof mensaje !== 'string') {
    return res.status(400).json({ error: 'El mensaje del usuario es requerido.' });
  }

  const client = getGeminiClient();

  // If Gemini API Key is available, use Gemini 3.8 Flash with non-diagnostic system instruction
  if (client) {
    try {
      const systemInstruction = `
Eres el Asistente Automatizado de Orientación de Citas MediCita.
IMPORTANTE:
- NO realizas diagnósticos médicos.
- NO recomiendas tratamientos, fármacos ni recetas.
- NO interpretas síntomas como diagnósticos clínicos.
- Tu función está limitada a orientar al paciente hacia la especialidad médica más pertinente para agendar una cita.
- Identifícate como asistencia automatizada.
- Indica claramente la especialidad recomendada (Cardiología, Pediatría, Medicina General, Dermatología, Odontología o Ginecología).
- Si hay signos de emergencia crítica (dolor torácico opresivo agudo, pérdida de conciencia), indica que debe acudir de inmediato a Urgencias.
- Al final incluye:
RECOMENDACION_JSON: {"especialidad": "NombreEspecialidad", "urgente": boolean, "motivoSugerido": "Breve motivo para agendar"}
`;

      const prompt = `Historial reciente: ${JSON.stringify(historial)}\nConsulta actual del paciente: "${mensaje}"`;

      const response = await client.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.2,
        },
      });

      const responseText = response.text || '';
      let jsonMeta: any = null;
      let cleanText = responseText;

      const match = responseText.match(/RECOMENDACION_JSON:\s*(\{[\s\S]*?\})/);
      if (match) {
        try {
          jsonMeta = JSON.parse(match[1]);
          cleanText = responseText.replace(/RECOMENDACION_JSON:\s*\{[\s\S]*?\}/, '').trim();
        } catch (e) {
          console.error('Error parsing JSON from Gemini response', e);
        }
      }

      return res.json({
        respuesta: cleanText,
        meta: jsonMeta,
        fuente: 'gemini',
      });
    } catch (err: any) {
      console.error('Error calling Gemini API:', err?.message || err);
    }
  }

  // Clinical Rule-Based Fallback
  const lower = mensaje.toLowerCase();
  let especialidad = 'Medicina General';
  let doctorId = 'doc-jose-torres';
  let doctorNombre = 'Dr. José Torres';
  let motivoSugerido = 'Evaluación médica presencial';
  let texto = '';
  let urgente = false;

  if (
    lower.includes('pecho') ||
    lower.includes('corazon') ||
    lower.includes('corazón') ||
    lower.includes('presion') ||
    lower.includes('presión') ||
    lower.includes('palpitacion') ||
    lower.includes('palpitación') ||
    lower.includes('arritmia')
  ) {
    especialidad = 'Cardiología';
    doctorId = 'doc-carlos-ramirez';
    doctorNombre = 'Dr. Carlos Ramírez';
    motivoSugerido = 'Evaluación con especialista en cardiología';
    texto = `Como asistencia automatizada, te informo que no emito diagnósticos ni tratamientos médicos. Para tus molestias cardiovasculares te sugerimos agendar una cita con **Cardiología**. Contamos con el **Dr. Carlos Ramírez** y el **Dr. Alejandro Morales** con turnos disponibles en nuestro centro médico.`;
  } else if (
    lower.includes('piel') ||
    lower.includes('lunar') ||
    lower.includes('grano') ||
    lower.includes('acne') ||
    lower.includes('acné') ||
    lower.includes('mancha') ||
    lower.includes('alergia')
  ) {
    especialidad = 'Dermatología';
    doctorId = 'doc-ana-martinez';
    doctorNombre = 'Dra. Ana Martínez';
    motivoSugerido = 'Evaluación dermatológica';
    texto = `Para cualquier alteración de la piel, la especialidad indicada para tu evaluación médica es **Dermatología**. La **Dra. Ana Martínez** dispone de consultas presenciales esta semana.`;
  } else if (
    lower.includes('niño') ||
    lower.includes('niña') ||
    lower.includes('hijo') ||
    lower.includes('hija') ||
    lower.includes('bebe') ||
    lower.includes('bebé') ||
    lower.includes('pediatra')
  ) {
    especialidad = 'Pediatría';
    doctorId = 'doc-maria-lopez';
    doctorNombre = 'Dra. María López';
    motivoSugerido = 'Consulta pediátrica integral';
    texto = `Para la atención y evaluación integral de los más pequeños, la especialidad recomendada es **Pediatría**. La **Dra. María López** cuenta con cupos en el Área Infantil.`;
  } else if (
    lower.includes('diente') ||
    lower.includes('muela') ||
    lower.includes('boca') ||
    lower.includes('encias') ||
    lower.includes('encías')
  ) {
    especialidad = 'Odontología';
    doctorId = 'doc-ricardo-vargas';
    doctorNombre = 'Dr. Ricardo Vargas';
    motivoSugerido = 'Evaluación odontológica';
    texto = `Para molestias en dientes o encías, la especialidad correspondiente es **Odontología**. El **Dr. Ricardo Vargas** dispone de turnos disponibles.`;
  } else if (
    lower.includes('mujer') ||
    lower.includes('embarazo') ||
    lower.includes('ginec')
  ) {
    especialidad = 'Ginecología';
    doctorId = 'doc-sofia-alarcon';
    doctorNombre = 'Dra. Sofía Alarcón';
    motivoSugerido = 'Consulta ginecológica';
    texto = `Para consultas preventivas y de salud femenina, te orientamos hacia la especialidad de **Ginecología** con la **Dra. Sofía Alarcón**.`;
  } else {
    texto = `Como asistencia automatizada, te recuerdo que no realizo diagnósticos médicos. Para orientar tu caso te sugiero agendar una cita con **Medicina General** con el **Dr. José Torres**, quien podrá evaluarte presencialmente.`;
  }

  return res.json({
    respuesta: texto,
    meta: {
      especialidad,
      doctorId,
      doctorNombre,
      urgente,
      motivoSugerido,
    },
    fuente: 'asistencia_automatizada_medicina',
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MediCita Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
