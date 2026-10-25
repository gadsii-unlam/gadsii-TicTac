import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Linking,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Crypto from 'expo-crypto';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router, useLocalSearchParams } from 'expo-router';

const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/$/, '');
const COLORS = {
  ink: '#18223A',
  muted: '#667085',
  blue: '#3E54D3',
  blueLight: '#EEF1FF',
  border: '#E4E7EC',
  background: '#F6F7FB',
  white: '#FFFFFF',
  green: '#147D59',
  greenLight: '#E8F6F0',
  amber: '#8A5A00',
  amberLight: '#FFF5DA',
  red: '#B42318',
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    });
  } catch {
    throw new Error(`No se pudo conectar con el servidor en ${API_URL}. Revisá la dirección y que Node esté iniciado.`);
  }
  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error('El servidor respondió con un formato inesperado.');
  }
  if (!response.ok) throw new Error(body.error || `Error del servidor (${response.status}).`);
  return body;
}

function formatDate(value, short = false) {
  return new Intl.DateTimeFormat('es-AR', {
    ...(short ? { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' } :
      { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }),
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(new Date(value));
}

function Button({ title, onPress, kind = 'primary', disabled = false, small = false }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles[`button_${kind}`],
        small && styles.buttonSmall,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={[styles.buttonText, styles[`buttonText_${kind}`], small && styles.buttonTextSmall]}>
        {title}
      </Text>
    </Pressable>
  );
}

function SelectField({ label, value, options, onChange }) {
  const [visible, setVisible] = useState(false);
  const selected = options.find(option => option.value === value)?.label || value || 'Elegir';
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.select} onPress={() => setVisible(true)} accessibilityRole="button">
        <Text style={styles.selectText}>{selected}</Text>
        <Text style={styles.selectArrow}>⌄</Text>
      </Pressable>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.modalShade} onPress={() => setVisible(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{label}</Text>
            <ScrollView>
              {options.map(option => (
                <Pressable
                  key={option.value}
                  style={styles.option}
                  onPress={() => { onChange(option.value); setVisible(false); }}
                >
                  <Text style={[styles.optionText, option.value === value && styles.optionSelected]}>
                    {option.label}
                  </Text>
                  {option.value === value ? <Text style={styles.optionCheck}>✓</Text> : null}
                </Pressable>
              ))}
            </ScrollView>
            <Button title="Cerrar" kind="ghost" onPress={() => setVisible(false)} />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function ToggleRow({ title, description, value, onValueChange }) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleCopy}>
        <Text style={styles.toggleTitle}>{title}</Text>
        <Text style={styles.helpText}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#D0D5DD', true: '#A7B2FF' }}
        thumbColor={value ? COLORS.blue : '#FFFFFF'}
      />
    </View>
  );
}

export default function App() {
  const routeParams = useLocalSearchParams();
  const routeScreen = Array.isArray(routeParams.screen) ? routeParams.screen[0] : routeParams.screen;
  const routeEventId = Array.isArray(routeParams.eventId) ? routeParams.eventId[0] : routeParams.eventId;
  const [deviceId, setDeviceId] = useState(null);
  const [config, setConfig] = useState(null);
  const [profile, setProfile] = useState(null);
  const [draft, setDraft] = useState(null);
  const [events, setEvents] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [pendingEvent, setPendingEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const openEventRef = useRef(null);
  const screen = !profile ? 'onboarding' : routeScreen === 'settings' ? 'settings' :
    routeScreen === 'detail' ? 'detail' : 'feed';

  const showNotice = useCallback(message => {
    setError('');
    setNotice(message);
    setTimeout(() => setNotice(current => current === message ? '' : current), 4200);
  }, []);

  const loadProfileAndEvents = useCallback(async id => {
    const [profileData, configData] = await Promise.all([
      request(`/api/profile?deviceId=${encodeURIComponent(id)}`),
      request('/api/config'),
    ]);
    setConfig(configData);
    setProfile(profileData.profile);
    if (!profileData.profile) {
      setDraft({
        department: configData.departments.diit ? 'diit' : Object.keys(configData.departments)[0],
        career: configData.departments.diit?.careers[0] || Object.values(configData.departments)[0].careers[0],
        frequency: 'instantanea',
        alerts: true,
        explore: false,
        exploreFrequency: 'semanal',
      });
        return;
    }
    const [eventData, reminderData] = await Promise.all([
      request(`/api/events?deviceId=${encodeURIComponent(id)}`),
      request(`/api/reminders?deviceId=${encodeURIComponent(id)}`),
    ]);
    setEvents(eventData.events);
    setReminders(reminderData.eventIds);
  }, []);

  const refreshData = useCallback(async () => {
    if (!deviceId) return;
    const query = `deviceId=${encodeURIComponent(deviceId)}`;
    const [eventData, reminderData] = await Promise.all([
      request(`/api/events?${query}`),
      request(`/api/reminders?${query}`),
    ]);
    setEvents(eventData.events);
    setReminders(reminderData.eventIds);
  }, [deviceId]);

  const openEvent = useCallback(async (id, source = 'feed') => {
    if (!id) return;
    let event = events.find(item => item.id === id);
    if (!event) {
      try {
        const query = `deviceId=${encodeURIComponent(deviceId)}`;
        const result = await request(`/api/events?${query}`);
        setEvents(result.events);
        event = result.events.find(item => item.id === id);
      } catch (loadError) {
        setError(loadError.message);
      }
    }
    if (!event) {
      router.setParams({ screen: 'feed', eventId: undefined, source: undefined });
      showNotice('Este evento no está disponible para tu carrera.');
      return;
    }
    router.setParams({ screen: 'detail', eventId: id, source });
    try {
      await request('/api/analytics/open', {
        method: 'POST',
        body: JSON.stringify({ deviceId, eventId: id, source }),
      });
    } catch (trackError) {
      setError(trackError.message);
    }
  }, [deviceId, events, showNotice]);

  openEventRef.current = openEvent;

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        let id = await AsyncStorage.getItem('nodo_device_id');
        if (!id) {
          id = Crypto.randomUUID();
          await AsyncStorage.setItem('nodo_device_id', id);
        }
        if (!active) return;
        setDeviceId(id);
        await loadProfileAndEvents(id);
      } catch (loadError) {
        if (active) setError(loadError.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [loadProfileAndEvents]);

  useEffect(() => {
    const responseToEvent = response => {
      const data = response?.notification?.request?.content?.data;
      if (data?.eventId) setPendingEvent({ id: data.eventId, source: 'push' });
    };
    const subscription = Notifications.addNotificationResponseReceivedListener(responseToEvent);
    Notifications.getLastNotificationResponseAsync().then(responseToEvent).catch(() => {});
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (screen === 'detail' || screen === 'settings') {
        router.setParams({ screen: 'feed', eventId: undefined, source: undefined });
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [screen]);

  useEffect(() => {
    if (!pendingEvent || !events.length || !deviceId) return;
    const { id, source } = pendingEvent;
    setPendingEvent(null);
    openEventRef.current?.(id, source);
  }, [deviceId, events, pendingEvent]);

  const departmentOptions = useMemo(() => Object.entries(config?.departments || {}).map(([value, item]) => ({
    value, label: item.label,
  })), [config]);
  const careerOptions = useMemo(() => (config?.departments?.[draft?.department]?.careers || []).map(value => ({
    value, label: value,
  })), [config, draft?.department]);
  const departmentLabel = config?.departments?.[profile?.department]?.label || '';
  const selectedEvent = events.find(event => event.id === routeEventId);

  async function saveProfile() {
    if (!draft || !deviceId || busy) return;
    setBusy(true);
    setError('');
    try {
      const saved = await request('/api/profile', {
        method: 'PUT',
        body: JSON.stringify({ ...draft, deviceId }),
      });
      setProfile(saved.profile);
      await refreshData();
      router.setParams({ screen: 'feed', eventId: undefined, source: undefined });
      showNotice('Tus preferencias quedaron guardadas.');
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setBusy(false);
    }
  }

  async function enableNotifications(allowBusy = false) {
    if ((busy && !allowBusy) || !deviceId) return false;
    if (!allowBusy) setBusy(true);
    setError('');
    try {
      if (!Device.isDevice) {
        throw new Error('Las notificaciones push necesitan un teléfono o tablet física.');
      }
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Avisos de Nodo UNLaM',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250, 250, 250],
        });
      }
      let permission = await Notifications.getPermissionsAsync();
      if (permission.status !== 'granted') permission = await Notifications.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        throw new Error('No se habilitaron las notificaciones. Podés activarlas desde la configuración del teléfono.');
      }
      const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
      if (!projectId) {
        throw new Error('Falta configurar el ID de proyecto de Expo. Seguí los pasos de configuración móvil del README.');
      }
      const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      await request('/api/subscribe', {
        method: 'POST',
        body: JSON.stringify({ deviceId, subscription: { provider: 'expo', token } }),
      });
      const result = await request(`/api/profile?deviceId=${encodeURIComponent(deviceId)}`);
      setProfile(result.profile);
      showNotice('Notificaciones activadas en este dispositivo.');
      return true;
    } catch (pushError) {
      setError(pushError.message);
      return false;
    } finally {
      if (!allowBusy) setBusy(false);
    }
  }

  async function toggleReminder(eventId) {
    if (busy || !deviceId) return;
    const enabled = !reminders.includes(eventId);
    setBusy(true);
    setError('');
    try {
      if (enabled && !profile?.subscribed) {
        const ready = await enableNotifications(true);
        if (!ready) return;
      }
      await request('/api/reminder', {
        method: 'POST',
        body: JSON.stringify({ deviceId, eventId, enabled }),
      });
      await refreshData();
      showNotice(enabled ? 'Te avisaremos dentro de las 24 horas anteriores al evento.' : 'Recordatorio desactivado.');
    } catch (reminderError) {
      setError(reminderError.message);
    } finally {
      setBusy(false);
    }
  }

  function editProfile() {
    setDraft({
      department: profile.department,
      career: profile.career,
      frequency: profile.frequency,
      alerts: profile.alerts,
      explore: profile.explore,
      exploreFrequency: profile.exploreFrequency || 'semanal',
    });
    router.setParams({ screen: 'settings', eventId: undefined, source: undefined });
  }

  async function openExternal(url) {
    try {
      await Linking.openURL(url);
    } catch {
      setError('No se pudo abrir el enlace en este dispositivo.');
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color={COLORS.blue} />
        <Text style={styles.loadingText}>Abriendo Nodo UNLaM…</Text>
      </SafeAreaView>
    );
  }

  if (!config) {
    return (
      <SafeAreaView style={styles.centered}>
        <StatusBar barStyle="dark-content" />
        <Text style={styles.brand}>Nodo <Text style={styles.brandAccent}>UNLaM</Text></Text>
        <Text style={styles.bodyText}>{error || 'No se pudo iniciar la aplicación.'}</Text>
        <Button title="Reintentar" onPress={() => {
          setLoading(true);
          setError('');
          AsyncStorage.getItem('nodo_device_id')
            .then(async id => {
              if (!id) throw new Error('No se pudo recuperar el identificador del dispositivo.');
              setDeviceId(id);
              await loadProfileAndEvents(id);
            })
            .catch(retryError => setError(retryError.message))
            .finally(() => setLoading(false));
        }} />
      </SafeAreaView>
    );
  }

  const patchDraft = values => setDraft(current => ({ ...current, ...values }));

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={styles.topbar}>
        <Pressable onPress={() => router.setParams({ screen: 'feed', eventId: undefined, source: undefined })} accessibilityRole="button">
          <Text style={styles.brand}>Nodo <Text style={styles.brandAccent}>UNLaM</Text></Text>
        </Pressable>
        {profile ? <Pressable onPress={editProfile} style={styles.topbarAction}><Text style={styles.topbarActionText}>⚙</Text></Pressable> : null}
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => setError('')}><Text style={styles.dismiss}>×</Text></Pressable>
        </View>
      ) : null}
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {screen === 'onboarding' ? (
          <View>
            <Text style={styles.eyebrow}>BIENVENIDO/A · UN SOLO PASO</Text>
            <Text style={styles.hero}>Las oportunidades de tu carrera, <Text style={styles.heroAccent}>sin tener que buscarlas.</Text></Text>
            <Text style={styles.lead}>Elegí qué estudiás y enterate de charlas, jornadas y talleres relevantes para vos.</Text>
            <View style={styles.panel}>
              <SelectField label="Tu departamento" value={draft?.department} options={departmentOptions} onChange={department => {
                const career = config.departments[department].careers[0];
                patchDraft({ department, career });
              }} />
              <SelectField label="Tu carrera" value={draft?.career} options={careerOptions} onChange={career => patchDraft({ career })} />
              <View style={styles.explainer}>
                <Text style={styles.explainerIcon}>♧</Text>
                <View style={styles.explainerCopy}>
                  <Text style={styles.explainerTitle}>Solo avisos de tu carrera</Text>
                  <Text style={styles.helpText}>Vas a poder elegir la frecuencia y cambiar estas preferencias cuando quieras.</Text>
                </View>
              </View>
              <Button title={busy ? 'Guardando…' : 'Ver eventos de mi carrera →'} onPress={saveProfile} disabled={busy || !draft?.career} />
              <Text style={styles.fine}>No necesitás crear una cuenta ni ingresar datos institucionales.</Text>
            </View>
          </View>
        ) : screen === 'settings' ? (
          <View>
            <Text style={styles.eyebrow}>TUS PREFERENCIAS</Text>
            <Text style={styles.heading}>Configuración<Text style={styles.blueDot}>.</Text></Text>
            <Text style={styles.lead}>Elegí qué eventos te interesan y cómo querés enterarte.</Text>
            <View style={styles.panel}>
              <Text style={styles.sectionTitle}>Mi carrera</Text>
              <Text style={styles.helpText}>Los eventos y alertas se actualizan según tu selección.</Text>
              <SelectField label="Departamento" value={draft?.department} options={departmentOptions} onChange={department => {
                patchDraft({ department, career: config.departments[department].careers[0] });
              }} />
              <SelectField label="Carrera" value={draft?.career} options={careerOptions} onChange={career => patchDraft({ career })} />
              <Text style={styles.sectionTitle}>Notificaciones</Text>
              <ToggleRow title="Avisarme de nuevos eventos" description="Solo recibís avisos que corresponden a tu departamento y carrera." value={Boolean(draft?.alerts)} onValueChange={alerts => patchDraft({ alerts })} />
              <SelectField label="Frecuencia de avisos" value={draft?.frequency} options={[
                { value: 'instantanea', label: 'Cada evento nuevo' },
                { value: 'diaria', label: 'Resumen diario' },
                { value: 'semanal', label: 'Resumen semanal' },
              ]} onChange={frequency => patchDraft({ frequency })} />
              <View style={styles.divider} />
              <ToggleRow title="Recordarme revisar la app" description="Un aviso periódico adicional para consultar eventos, aunque no haya novedades." value={Boolean(draft?.explore)} onValueChange={explore => patchDraft({ explore })} />
              <SelectField label="Frecuencia del aviso para revisar" value={draft?.exploreFrequency} options={[
                { value: 'diaria', label: 'Diaria' },
                { value: 'semanal', label: 'Semanal' },
              ]} onChange={exploreFrequency => patchDraft({ exploreFrequency })} />
              <View style={styles.permissionBox}>
                <Text style={styles.permissionIcon}>♧</Text>
                <View style={styles.explainerCopy}>
                  <Text style={styles.explainerTitle}>Estado del dispositivo</Text>
                  <Text style={styles.helpText}>{profile?.subscribed ? 'Notificaciones activas en este dispositivo.' : 'Todavía no activaste las notificaciones en este dispositivo.'}</Text>
                  {!profile?.subscribed ? <Button small title="Activar notificaciones" onPress={enableNotifications} disabled={busy} /> : null}
                </View>
              </View>
              <Button title={busy ? 'Guardando…' : 'Guardar cambios'} onPress={saveProfile} disabled={busy} />
            </View>
          </View>
        ) : screen === 'detail' && selectedEvent ? (
          <View>
            <Button title="← Volver a eventos" kind="ghost" small onPress={() => router.setParams({ screen: 'feed', eventId: undefined, source: undefined })} />
            <Text style={styles.eyebrow}>{config.departments[selectedEvent.department]?.label || ''}</Text>
            <Text style={styles.heading}>{selectedEvent.title}</Text>
            {selectedEvent.demo ? (
              <Text style={styles.demoWarning}>Este evento es un ejemplo del MVP; no existe una actividad oficial confirmada.</Text>
            ) : null}
            <View style={styles.panel}>
              <Text style={styles.detailLabel}>FECHA Y HORA</Text>
              <Text style={styles.detailValue}>{formatDate(selectedEvent.startsAt)}</Text>
              <Text style={styles.detailLabel}>LUGAR</Text>
              <Text style={styles.detailValue}>{selectedEvent.place}</Text>
            </View>
            <View style={styles.panel}>
              <Text style={styles.sectionTitle}>Acerca de este evento</Text>
              <Text style={styles.bodyText}>{selectedEvent.description}</Text>
              <Text style={styles.sectionTitle}>Información para participar</Text>
              <Text style={styles.bodyText}>{selectedEvent.registrationUrl ? 'Podés consultar el enlace de inscripción o información externa.' : 'Este evento no tiene un enlace de inscripción informado.'}</Text>
              {selectedEvent.sourceUrl ? <Button title="Ver publicación de origen ↗" kind="outlined" onPress={() => openExternal(selectedEvent.sourceUrl)} /> : null}
              {selectedEvent.registrationUrl ? <Button title={selectedEvent.demo ? 'Consultar sitio de ejemplo ↗' : 'Ir a inscripción externa ↗'} kind="outlined" onPress={() => openExternal(selectedEvent.registrationUrl)} /> : null}
            </View>
            <View style={styles.panel}>
              <Text style={styles.sectionTitle}>¿Te interesa participar?</Text>
              <Text style={styles.helpText}>Guardá un recordatorio y te avisamos dentro de las 24 horas anteriores al evento.</Text>
              <Button
                title={reminders.includes(selectedEvent.id) ? '✓ Recordatorio activado' : '♧ Recordarme'}
                kind={reminders.includes(selectedEvent.id) ? 'success' : 'primary'}
                onPress={() => toggleReminder(selectedEvent.id)}
                disabled={busy || new Date(selectedEvent.startsAt).getTime() <= Date.now()}
              />
            </View>
          </View>
        ) : (
          <View>
            <Text style={styles.eyebrow}>TU AGENDA ACADÉMICA</Text>
            <Text style={styles.heading}>Descubrí lo que viene<Text style={styles.blueDot}>.</Text></Text>
            <Text style={styles.lead}>Charlas, talleres y encuentros de {departmentLabel}.</Text>
            <View style={styles.feedHeading}>
              <Text style={styles.sectionTitle}>Próximos eventos</Text>
              <Text style={styles.softTag}>✓ Filtrados para vos</Text>
            </View>
            {events.length ? events.map((event, index) => (
              <Pressable key={event.id} style={({ pressed }) => [styles.eventCard, pressed && styles.pressed]} onPress={() => openEvent(event.id)}>
                <View style={[styles.eventBanner, styles[`eventBanner_${index % 4}`]]}>
                  <Text style={styles.eventBannerBrand}>UNLaM · {index % 2 ? 'CONOCIMIENTO' : 'EXPERIENCIAS'}</Text>
                  <Text style={styles.eventChip}>{event.demo ? 'DEMO · EVENTO FICTICIO' : 'EVENTO ACADÉMICO'}</Text>
                </View>
                <View style={styles.eventBody}>
                  <Text style={styles.eventDepartment}>{config.departments[event.department]?.label || ''}</Text>
                  <Text style={styles.cardTitle}>{event.title}</Text>
                  <Text numberOfLines={3} style={styles.helpText}>{event.description}</Text>
                  <Text style={styles.eventMeta}>▦  {formatDate(event.startsAt, true)}</Text>
                  <Text style={styles.eventMeta}>⌖  {event.place}</Text>
                  <Text style={styles.cardAction}>Ver ficha completa  →</Text>
                </View>
              </Pressable>
            )) : (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>▤</Text>
                <Text style={styles.sectionTitle}>Aún no hay eventos para tu carrera</Text>
                <Text style={styles.helpText}>Cuando se publique una actividad que te corresponda, aparecerá acá.</Text>
                <Button title="Revisar mis alertas" kind="outlined" onPress={editProfile} />
              </View>
            )}
            {!profile?.subscribed ? (
              <View style={styles.tipBox}>
                <Text style={styles.explainerTitle}>No te pierdas las novedades</Text>
                <Text style={styles.helpText}>Activá las notificaciones para recibir los avisos.</Text>
                <Button title="Activar notificaciones" onPress={enableNotifications} disabled={busy} />
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>

      {profile ? (
        <View style={styles.bottomNav}>
          <Pressable style={styles.navItem} onPress={() => router.setParams({ screen: 'feed', eventId: undefined, source: undefined })}>
            <Text style={[styles.navIcon, screen !== 'settings' && styles.navActive]}>▤</Text>
            <Text style={[styles.navText, screen !== 'settings' && styles.navActive]}>Eventos</Text>
          </Pressable>
          <Pressable style={styles.navItem} onPress={editProfile}>
            <Text style={[styles.navIcon, screen === 'settings' && styles.navActive]}>⚙</Text>
            <Text style={[styles.navText, screen === 'settings' && styles.navActive]}>Configuración</Text>
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, backgroundColor: COLORS.background },
  loadingText: { marginTop: 14, color: COLORS.muted, fontSize: 15 },
  topbar: { height: 58, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  brand: { color: COLORS.ink, fontSize: 21, fontWeight: '700', letterSpacing: -0.6 },
  brandAccent: { color: COLORS.blue },
  topbarAction: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.blueLight },
  content: { padding: 20, paddingBottom: 28 },
  eyebrow: { color: COLORS.blue, fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginBottom: 10, marginTop: 8 },
  hero: { color: COLORS.ink, fontSize: 34, lineHeight: 41, fontWeight: '800', letterSpacing: -1, marginBottom: 12 },
  heroAccent: { color: COLORS.blue },
  heading: { color: COLORS.ink, fontSize: 29, lineHeight: 36, fontWeight: '800', letterSpacing: -0.7, marginBottom: 8 },
  blueDot: { color: COLORS.blue },
  lead: { color: COLORS.muted, fontSize: 15, lineHeight: 23, marginBottom: 22 },
  panel: { backgroundColor: COLORS.white, borderRadius: 18, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: '#EEF0F4' },
  field: { marginBottom: 16 },
  label: { color: COLORS.ink, fontSize: 13, fontWeight: '700', marginBottom: 8 },
  select: { minHeight: 48, paddingHorizontal: 13, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.white },
  selectText: { flex: 1, color: COLORS.ink, fontSize: 14 },
  selectArrow: { color: COLORS.muted, fontSize: 20, marginLeft: 8 },
  modalShade: { flex: 1, justifyContent: 'center', padding: 22, backgroundColor: 'rgba(16,24,40,0.45)' },
  modalCard: { maxHeight: '82%', padding: 18, borderRadius: 18, backgroundColor: COLORS.white },
  modalTitle: { color: COLORS.ink, fontSize: 19, fontWeight: '800', marginBottom: 10 },
  option: { minHeight: 48, borderBottomWidth: 1, borderBottomColor: COLORS.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  optionText: { flex: 1, color: COLORS.ink, fontSize: 14, paddingVertical: 10 },
  optionSelected: { color: COLORS.blue, fontWeight: '700' },
  optionCheck: { color: COLORS.blue, fontWeight: '800', paddingLeft: 12 },
  button: { minHeight: 48, paddingHorizontal: 16, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  button_primary: { backgroundColor: COLORS.blue },
  button_outlined: { borderWidth: 1, borderColor: COLORS.blue, backgroundColor: COLORS.white },
  button_ghost: { backgroundColor: 'transparent' },
  button_success: { backgroundColor: COLORS.greenLight },
  buttonDisabled: { opacity: 0.55 },
  buttonSmall: { minHeight: 38, alignSelf: 'flex-start', paddingHorizontal: 12, marginTop: 12 },
  buttonText: { fontSize: 15, fontWeight: '700' },
  buttonText_primary: { color: COLORS.white },
  buttonText_outlined: { color: COLORS.blue },
  buttonText_ghost: { color: COLORS.muted },
  buttonText_success: { color: COLORS.green },
  buttonTextSmall: { fontSize: 13 },
  pressed: { opacity: 0.82 },
  fine: { color: COLORS.muted, fontSize: 12, textAlign: 'center', lineHeight: 18, marginTop: 14 },
  explainer: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: COLORS.blueLight, borderRadius: 12, padding: 13, marginVertical: 4, marginBottom: 12 },
  explainerIcon: { color: COLORS.blue, fontSize: 22, marginRight: 10 },
  explainerCopy: { flex: 1 },
  explainerTitle: { color: COLORS.ink, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  helpText: { color: COLORS.muted, fontSize: 13, lineHeight: 19 },
  sectionTitle: { color: COLORS.ink, fontSize: 17, fontWeight: '800', marginBottom: 8 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#F0F1F4', marginBottom: 14 },
  toggleCopy: { flex: 1 },
  toggleTitle: { color: COLORS.ink, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },
  permissionBox: { flexDirection: 'row', alignItems: 'flex-start', padding: 13, marginVertical: 10, borderRadius: 12, backgroundColor: COLORS.blueLight },
  permissionIcon: { fontSize: 22, color: COLORS.blue, marginRight: 10 },
  detailLabel: { color: COLORS.muted, fontSize: 10, letterSpacing: 1, fontWeight: '800', marginBottom: 4, marginTop: 5 },
  detailValue: { color: COLORS.ink, fontSize: 15, lineHeight: 22, fontWeight: '600', marginBottom: 13 },
  bodyText: { color: COLORS.ink, fontSize: 15, lineHeight: 23, marginBottom: 14 },
  demoWarning: { color: COLORS.amber, backgroundColor: COLORS.amberLight, padding: 12, borderRadius: 10, marginBottom: 14, fontSize: 13, lineHeight: 19 },
  feedHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  softTag: { color: COLORS.green, backgroundColor: COLORS.greenLight, overflow: 'hidden', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6, fontSize: 11, fontWeight: '700' },
  eventCard: { overflow: 'hidden', borderRadius: 17, marginBottom: 15, backgroundColor: COLORS.white, borderWidth: 1, borderColor: '#E9EBF0' },
  eventBanner: { height: 110, justifyContent: 'space-between', padding: 14 },
  eventBanner_0: { backgroundColor: '#DCE2FF' },
  eventBanner_1: { backgroundColor: '#DDF5EA' },
  eventBanner_2: { backgroundColor: '#FFF0CB' },
  eventBanner_3: { backgroundColor: '#FFE1E6' },
  eventBannerBrand: { color: COLORS.ink, fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  eventChip: { alignSelf: 'flex-start', overflow: 'hidden', color: COLORS.ink, backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 5, fontSize: 9, fontWeight: '800', letterSpacing: 0.4 },
  eventBody: { padding: 16 },
  eventDepartment: { color: COLORS.blue, fontSize: 11, fontWeight: '700', marginBottom: 7 },
  cardTitle: { color: COLORS.ink, fontSize: 18, lineHeight: 24, fontWeight: '800', marginBottom: 7 },
  eventMeta: { color: COLORS.muted, fontSize: 12, marginTop: 8 },
  cardAction: { color: COLORS.blue, fontSize: 13, fontWeight: '800', marginTop: 16 },
  empty: { alignItems: 'center', padding: 22, borderRadius: 16, backgroundColor: COLORS.white },
  emptyIcon: { color: COLORS.blue, fontSize: 30, marginBottom: 10 },
  tipBox: { padding: 16, borderRadius: 15, backgroundColor: COLORS.blueLight, marginTop: 4 },
  bottomNav: { minHeight: 62, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.white },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 7 },
  navIcon: { color: COLORS.muted, fontSize: 18, marginBottom: 2 },
  navText: { color: COLORS.muted, fontSize: 11, fontWeight: '600' },
  navActive: { color: COLORS.blue, fontWeight: '800' },
  errorBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FEE4E2', paddingHorizontal: 14, paddingVertical: 10 },
  errorText: { flex: 1, color: COLORS.red, fontSize: 13, lineHeight: 18 },
  dismiss: { color: COLORS.red, fontSize: 22, paddingLeft: 12 },
  notice: { color: COLORS.green, backgroundColor: COLORS.greenLight, paddingHorizontal: 14, paddingVertical: 9, fontSize: 13 },
  topbarActionText: { color: COLORS.blue, fontSize: 20 },
});
