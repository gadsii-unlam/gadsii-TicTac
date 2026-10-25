export const DEPARTMENTS = {
  diit: { label: 'Ingeniería e Investigaciones Tecnológicas', careers: ['Ingeniería en Informática', 'Ingeniería Electrónica', 'Ingeniería Industrial'] },
  humanidades: { label: 'Humanidades y Ciencias Sociales', careers: ['Comunicación Social', 'Trabajo Social'] },
  economicas: { label: 'Ciencias Económicas', careers: ['Contador Público', 'Administración'] },
  derecho: { label: 'Derecho y Ciencia Política', careers: ['Abogacía'] }
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
