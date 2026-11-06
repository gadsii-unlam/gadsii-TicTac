// label: nombre corto (títulos como "Eventos de …"); name: nombre oficial completo (selectores y barra lateral).
export const DEPARTMENTS = {
  diit: {
    label: 'Ingeniería e Investigaciones Tecnológicas', name: 'Departamento de Ingeniería e Investigaciones Tecnológicas',
    careers: ['Ingeniería en Informática', 'Ingeniería Mecánica', 'Ingeniería Civil', 'Ingeniería Electrónica', 'Ingeniería Industrial', 'Ingeniería en Energías Renovables']
  },
  salud: {
    label: 'Ciencias de la Salud', name: 'Departamento de Ciencias de la Salud',
    careers: ['Licenciatura en Nutrición', 'Odontología', 'Licenciatura en Kinesiología y Fisiatría', 'Medicina', 'Licenciatura en Enfermería']
  },
  humanidades: {
    label: 'Humanidades y Ciencias Sociales', name: 'Departamento de Humanidades y Ciencias Sociales',
    careers: ['Licenciatura en Relaciones Laborales', 'Licenciatura en Comunicación Social', 'Licenciatura en Relaciones Públicas', 'Licenciatura en Trabajo Social', 'Profesorado de Educación Física', 'Licenciatura en Educación Física']
  },
  economicas: {
    label: 'Ciencias Económicas', name: 'Departamento de Ciencias Económicas',
    careers: ['Licenciatura en Administración', 'Contador Público', 'Licenciatura en Comercio Internacional', 'Licenciatura en Economía']
  },
  derecho: {
    label: 'Derecho y Ciencia Política', name: 'Departamento de Derecho y Ciencia Política',
    careers: ['Abogacía', 'Licenciatura en Ciencia Política']
  },
  arquitectura: {
    label: 'Arquitectura, Urbanismo y Diseño', name: 'Escuela de Arquitectura, Urbanismo y Diseño',
    careers: ['Arquitectura']
  }
};
// Carreras que cambiaron de nombre: los perfiles y eventos guardados con el nombre anterior se actualizan al abrir la base.
export const CAREER_RENAMES = {
  'Comunicación Social': 'Licenciatura en Comunicación Social',
  'Trabajo Social': 'Licenciatura en Trabajo Social',
  'Administración': 'Licenciatura en Administración'
};
export const FREQUENCIES = ['instantanea', 'diaria', 'semanal'];
export function matches(event, profile) {
  return Boolean(profile?.department && event.department === profile.department &&
    (!event.career || event.career === profile.career));
}
export function validProfile(input) {
  if (!input || !DEPARTMENTS[input.department]?.careers.includes(input.career)) return false;
  return FREQUENCIES.includes(input.frequency) && typeof input.alerts === 'boolean' &&
    typeof input.explore === 'boolean';
}
export function dueBucket(now, frequency) {
  const d = new Date(now);
  // Agrupación UTC explícita para un scheduler estable en servidores con distinta TZ.
  if (frequency === 'diaria') {
    const deadline = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 19));
    return now >= deadline.getTime() ? deadline.toISOString().slice(0, 10) : null;
  }
  if (frequency === 'semanal') {
    const day = d.getUTCDay(); // lunes = 1
    const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - (day + 6) % 7, 19));
    return now >= monday.getTime() ? monday.toISOString().slice(0, 10) : null;
  }
  return null;
}
export function hoursBefore(startsAt, timeMs) {
  return (Date.parse(startsAt) - timeMs) / 3600000;
}
