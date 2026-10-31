import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
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
  useColorScheme,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Crypto from 'expo-crypto';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router, useLocalSearchParams } from 'expo-router';

const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/$/, '');
const FREQUENCY_OPTIONS = [
  { value: 'instantanea', label: 'Cada evento nuevo' },
  { value: 'diaria', label: 'Resumen diario' },
  { value: 'semanal', label: 'Resumen semanal' },
];
const THEME_KEY = 'nodo_theme';
const THEME_OPTIONS = [
  { value: 'system', label: 'Usar el del dispositivo' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
];
// Verde institucional UNLaM: rgb(18, 130, 104).
const PALETTES = {
  light: {
    ink: '#18223A',
    muted: '#667085',
    accent: '#128268',
    accentStrong: '#128268',
    onAccent: '#FFFFFF',
    accentSoft: '#E7F3F0',
    border: '#E4E7EC',
    borderSoft: '#EEF0F4',
    background: '#F6F7FB',
    surface: '#FFFFFF',
    green: '#147D59',
    greenLight: '#E8F6F0',
    amber: '#8A5A00',
    amberLight: '#FFF5DA',
    red: '#B42318',
    redLight: '#FEE4E2',
    shade: 'rgba(16,24,40,0.45)',
    chip: 'rgba(255,255,255,0.8)',
    trackOff: '#D0D5DD',
    trackOn: '#93CDBF',
    thumbOff: '#FFFFFF',
    banners: ['#E9E3FF', '#DDEBFA', '#FFF0CB', '#FFE1E6'],
  },
  dark: {
    ink: '#E6EAF0',
    muted: '#98A2B3',
    accent: '#4FC4A4',
    accentStrong: '#128268',
    onAccent: '#FFFFFF',
    accentSoft: '#14302A',
    border: '#2B3540',
    borderSoft: '#232C36',
    background: '#0E1319',
    surface: '#161D25',
    green: '#5CCFA0',
    greenLight: '#13312A',
    amber: '#F2C46D',
    amberLight: '#3A2F15',
    red: '#F97066',
    redLight: '#3E1D1B',
    shade: 'rgba(0,0,0,0.6)',
    chip: 'rgba(14,19,25,0.72)',
    trackOff: '#3A4552',
    trackOn: '#1D6B59',
    thumbOff: '#D0D5DD',
    banners: ['#2D2747', '#1B2E44', '#3A3119', '#40242B'],
  },
};
const THEMES = Object.fromEntries(Object.entries(PALETTES).map(([scheme, colors]) => [
  scheme, { scheme, colors, styles: createStyles(colors) },
]));
const ThemeContext = createContext({ ...THEMES.light, preference: 'system', setPreference: () => {} });
const useTheme = () => useContext(ThemeContext);

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

function Button({ title, onPress, kind = 'primary', disabled = false, small = false, icon, trailingIcon }) {
  const { styles } = useTheme();
  const textStyle = [styles.buttonText, styles[`buttonText_${kind}`], small && styles.buttonTextSmall];
  const { color, fontSize } = StyleSheet.flatten(textStyle);
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
      <View style={styles.buttonContent}>
        {icon ? <Ionicons name={icon} size={fontSize + 3} color={color} /> : null}
        <Text style={textStyle}>{title}</Text>
        {trailingIcon ? <Ionicons name={trailingIcon} size={fontSize + 3} color={color} /> : null}
      </View>
    </Pressable>
  );
}

function SelectField({ label, value, options, onChange, disabled = false }) {
  const { colors, styles } = useTheme();
  const [visible, setVisible] = useState(false);
  const selected = options.find(option => option.value === value)?.label || value || 'Elegir';
  return (
    <View style={[styles.field, disabled && styles.fieldDisabled]}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.select} onPress={() => setVisible(true)} disabled={disabled} accessibilityRole="button" accessibilityState={{ disabled }}>
        <Text style={styles.selectText}>{selected}</Text>
        <Ionicons name="chevron-down" size={18} color={colors.muted} style={styles.selectArrow} />
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
                  {option.value === value ? <Ionicons name="checkmark" size={20} color={colors.accent} style={styles.optionCheck} /> : null}
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
  const { colors, styles } = useTheme();
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleCopy}>
        <Text style={styles.toggleTitle}>{title}</Text>
        <Text style={styles.helpText}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.trackOff, true: colors.trackOn }}
        thumbColor={value ? colors.accentStrong : colors.thumbOff}
      />
    </View>
  );
}

export default function App() {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState('system');

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY)
      .then(saved => { if (THEME_OPTIONS.some(option => option.value === saved)) setPreferenceState(saved); })
      .catch(() => {});
  }, []);

  const setPreference = useCallback(value => {
    setPreferenceState(value);
    AsyncStorage.setItem(THEME_KEY, value).catch(() => {});
  }, []);

  const scheme = preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;
  const theme = useMemo(() => ({ ...THEMES[scheme], preference, setPreference }), [scheme, preference, setPreference]);

  return (
    <ThemeContext.Provider value={theme}>
      <NodoApp />
    </ThemeContext.Provider>
  );
}

function userError(message) {
  return Object.assign(new Error(message), { forUser: true });
}

async function subscribeExpoPush() {
  if (!Device.isDevice) {
    throw userError('Las notificaciones necesitan un teléfono o tablet física.');
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
    throw userError('No se habilitaron las notificaciones. Podés activarlas desde la configuración del teléfono.');
  }
  const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
  if (!projectId) {
    throw new Error('Falta configurar el ID de proyecto de Expo. Seguí los pasos de configuración móvil del README.');
  }
  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  return { provider: 'expo', token };
}

function base64UrlToBytes(value) {
  const base64 = (value + '='.repeat((4 - value.length % 4) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(base64), char => char.charCodeAt(0));
}

function sameKey(buffer, bytes) {
  if (!buffer) return false;
  const current = new Uint8Array(buffer);
  return current.length === bytes.length && current.every((byte, index) => byte === bytes[index]);
}

async function subscribeWebPush(vapidKey) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    throw userError('Este navegador no permite notificaciones de escritorio.');
  }
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw userError('No se habilitaron las notificaciones. Podés activarlas desde la configuración del navegador.');
  }
  if (!vapidKey) throw new Error('El servidor no informó la clave pública VAPID.');
  const key = base64UrlToBytes(vapidKey);
  const registration = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  // Una suscripción creada con otra clave (por ejemplo, otro servidor) no recibiría los avisos.
  if (subscription && !sameKey(subscription.options?.applicationServerKey, key)) {
    await subscription.unsubscribe();
    subscription = null;
  }
  subscription ||= await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
  const { endpoint, keys } = subscription.toJSON();
  return { endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } };
}

function goTo(screen) {
  router.setParams({ screen, eventId: undefined, source: undefined, from: undefined });
}

function NodoApp() {
  const { scheme, colors, styles, preference, setPreference } = useTheme();
  const statusBarStyle = scheme === 'dark' ? 'light-content' : 'dark-content';
  const routeParams = useLocalSearchParams();
  const routeScreen = Array.isArray(routeParams.screen) ? routeParams.screen[0] : routeParams.screen;
  const routeEventId = Array.isArray(routeParams.eventId) ? routeParams.eventId[0] : routeParams.eventId;
  const routeFrom = Array.isArray(routeParams.from) ? routeParams.from[0] : routeParams.from;
  const backTarget = routeFrom === 'reminders' ? 'reminders' : 'feed';
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
  const [welcomeVisible, setWelcomeVisible] = useState(false);
  const [welcomeFrequency, setWelcomeFrequency] = useState('instantanea');
  const openEventRef = useRef(null);
  const screen = !profile ? 'onboarding' : ['settings', 'detail', 'reminders'].includes(routeScreen) ? routeScreen : 'feed';

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

  const openEvent = useCallback(async (id, source = 'feed', from = 'feed') => {
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
      goTo('feed');
      showNotice('Este evento no está disponible para tu carrera.');
      return;
    }
    router.setParams({ screen: 'detail', eventId: id, source, from });
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

  // Notificaciones de escritorio: el service worker avisa al hacer clic, o abre la app con ?evento=.
  const routePushEvent = Array.isArray(routeParams.evento) ? routeParams.evento[0] : routeParams.evento;
  useEffect(() => {
    if (!routePushEvent) return;
    setPendingEvent({ id: routePushEvent, source: 'push' });
    router.setParams({ evento: undefined });
  }, [routePushEvent]);

  useEffect(() => {
    if (Platform.OS !== 'web' || !('serviceWorker' in navigator)) return undefined;
    const onMessage = message => {
      if (message.data?.type === 'open-event' && message.data.eventId) {
        setPendingEvent({ id: message.data.eventId, source: 'push' });
      }
    };
    navigator.serviceWorker.addEventListener('message', onMessage);
    return () => navigator.serviceWorker.removeEventListener('message', onMessage);
  }, []);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (screen === 'detail') {
        goTo(backTarget);
        return true;
      }
      if (screen === 'settings' || screen === 'reminders') {
        goTo('feed');
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [screen, backTarget]);

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
  const reminderEvents = events.filter(event => reminders.includes(event.id));
  const settingsDirty = screen === 'settings' && Boolean(draft && profile) && (
    ['department', 'career', 'frequency', 'alerts', 'explore'].some(key => draft[key] !== profile[key]) ||
    draft.exploreFrequency !== (profile.exploreFrequency || 'semanal'));
  const shownScreen = screen === 'detail' && !selectedEvent ? 'feed' : screen;
  const headerTitle = { settings: 'Configuración', reminders: 'Recordatorios', detail: 'Evento' }[shownScreen];
  const remindersTab = screen === 'reminders' || (screen === 'detail' && backTarget === 'reminders');
  const homeTab = screen === 'feed' || (screen === 'detail' && !remindersTab);

  async function saveProfile() {
    if (!draft || !deviceId || busy) return;
    const firstTime = !profile;
    setBusy(true);
    setError('');
    try {
      const saved = await request('/api/profile', {
        method: 'PUT',
        body: JSON.stringify({ ...draft, deviceId }),
      });
      setProfile(saved.profile);
      await refreshData();
      if (firstTime) {
        goTo('feed');
        setWelcomeFrequency(saved.profile.frequency);
        setWelcomeVisible(true);
      } else {
        showNotice('Tus preferencias quedaron guardadas.');
      }
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setBusy(false);
    }
  }

  async function finishWelcome(activate) {
    setWelcomeVisible(false);
    if (welcomeFrequency !== profile.frequency) {
      setBusy(true);
      try {
        const saved = await request('/api/profile', {
          method: 'PUT',
          body: JSON.stringify({
            deviceId,
            department: profile.department,
            career: profile.career,
            frequency: welcomeFrequency,
            alerts: profile.alerts,
            explore: profile.explore,
            exploreFrequency: profile.exploreFrequency || 'semanal',
          }),
        });
        setProfile(saved.profile);
      } catch (saveError) {
        setError(saveError.message);
        return;
      } finally {
        setBusy(false);
      }
    }
    if (activate) await enableNotifications();
    else showNotice('Podés activar las notificaciones cuando quieras desde Configuración.');
  }

  async function enableNotifications(allowBusy = false) {
    if ((busy && !allowBusy) || !deviceId) return false;
    if (!allowBusy) setBusy(true);
    setError('');
    try {
      const subscription = Platform.OS === 'web'
        ? await subscribeWebPush(config?.vapidPublicKey)
        : await subscribeExpoPush();
      await request('/api/subscribe', {
        method: 'POST',
        body: JSON.stringify({ deviceId, subscription }),
      });
      const result = await request(`/api/profile?deviceId=${encodeURIComponent(deviceId)}`);
      setProfile(result.profile);
      showNotice('Notificaciones activadas en este dispositivo.');
      return true;
    } catch (pushError) {
      if (!pushError.forUser) console.warn('[notificaciones]', pushError);
      setError(pushError.forUser ? pushError.message : 'No pudimos activar las notificaciones en este momento. Probá de nuevo más tarde.');
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
    goTo('settings');
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
        <StatusBar barStyle={statusBarStyle} />
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Abriendo Nodo UNLaM…</Text>
      </SafeAreaView>
    );
  }

  if (!config) {
    return (
      <SafeAreaView style={styles.centered}>
        <StatusBar barStyle={statusBarStyle} />
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
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.background} />
      <View style={styles.topbar}>
        <View style={styles.topbarStart}>
          {shownScreen === 'detail' ? (
            <Pressable
              onPress={() => goTo(backTarget)}
              style={styles.topbarBack}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={backTarget === 'reminders' ? 'Volver a recordatorios' : 'Volver al inicio'}
            >
              <Ionicons name="arrow-back" size={22} color={colors.ink} />
            </Pressable>
          ) : null}
          {headerTitle ? (
            <Text style={styles.topbarTitle} numberOfLines={1} accessibilityRole="header">{headerTitle}</Text>
          ) : (
            <Pressable onPress={() => goTo('feed')} accessibilityRole="button">
              <Text style={styles.brand}>Nodo <Text style={styles.brandAccent}>UNLaM</Text></Text>
            </Pressable>
          )}
        </View>
        {profile ? (
          <Pressable
            onPress={editProfile}
            style={styles.topbarAction}
            accessibilityRole="button"
            accessibilityLabel="Configuración"
            accessibilityState={{ selected: screen === 'settings' }}
          >
            <Ionicons
              name={screen === 'settings' ? 'settings' : 'settings-outline'}
              size={22}
              color={screen === 'settings' ? colors.accent : colors.ink}
            />
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => setError('')} accessibilityRole="button" accessibilityLabel="Cerrar aviso"><Ionicons name="close" size={20} color={colors.red} style={styles.dismiss} /></Pressable>
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
                <Ionicons name="notifications-outline" size={22} color={colors.accent} style={styles.explainerIcon} />
                <View style={styles.explainerCopy}>
                  <Text style={styles.explainerTitle}>Solo avisos de tu carrera</Text>
                  <Text style={styles.helpText}>Vas a poder elegir la frecuencia y cambiar estas preferencias cuando quieras.</Text>
                </View>
              </View>
              <Button title={busy ? 'Guardando…' : 'Ver eventos de mi carrera'} trailingIcon={busy ? undefined : 'arrow-forward'} onPress={saveProfile} disabled={busy || !draft?.career} />
              <Text style={styles.fine}>No necesitás crear una cuenta ni ingresar datos institucionales.</Text>
            </View>
          </View>
        ) : screen === 'settings' ? (
          <View>
            <Text style={styles.lead}>Elegí qué eventos te interesan y cómo querés enterarte.</Text>
            <View style={styles.panel}>
              <Text style={styles.sectionTitle}>Mi carrera</Text>
              <Text style={[styles.helpText, styles.panelIntro]}>Los eventos y alertas se actualizan según tu selección.</Text>
              <SelectField label="Departamento" value={draft?.department} options={departmentOptions} onChange={department => {
                patchDraft({ department, career: config.departments[department].careers[0] });
              }} />
              <SelectField label="Carrera" value={draft?.career} options={careerOptions} onChange={career => patchDraft({ career })} />
            </View>
            <View style={styles.panel}>
              <Text style={styles.sectionTitle}>Notificaciones</Text>
              <ToggleRow title="Avisarme de nuevos eventos" description="Solo recibís avisos que corresponden a tu departamento y carrera." value={Boolean(draft?.alerts)} onValueChange={alerts => patchDraft({ alerts })} />
              <SelectField label="Frecuencia de avisos" value={draft?.frequency} options={FREQUENCY_OPTIONS} onChange={frequency => patchDraft({ frequency })} disabled={!draft?.alerts} />
              <View style={styles.divider} />
              <ToggleRow title="Recordarme revisar la app" description="Un aviso periódico adicional para consultar eventos, aunque no haya novedades." value={Boolean(draft?.explore)} onValueChange={explore => patchDraft({ explore })} />
              <SelectField label="Frecuencia del aviso para revisar" value={draft?.exploreFrequency} options={[
                { value: 'diaria', label: 'Diaria' },
                { value: 'semanal', label: 'Semanal' },
              ]} onChange={exploreFrequency => patchDraft({ exploreFrequency })} disabled={!draft?.explore} />
              <View style={styles.permissionBox}>
                <Ionicons name={profile?.subscribed ? 'notifications' : 'notifications-off-outline'} size={22} color={colors.accent} style={styles.permissionIcon} />
                <View style={styles.explainerCopy}>
                  <Text style={styles.explainerTitle}>Estado del dispositivo</Text>
                  <Text style={styles.helpText}>{profile?.subscribed ? 'Notificaciones activas en este dispositivo.' : 'Todavía no activaste las notificaciones en este dispositivo.'}</Text>
                  {!profile?.subscribed ? <Button small title="Activar notificaciones" onPress={() => enableNotifications()} disabled={busy} /> : null}
                </View>
              </View>
            </View>
            <View style={styles.panel}>
              <Text style={styles.sectionTitle}>Apariencia</Text>
              <Text style={[styles.helpText, styles.panelIntro]}>El tema se aplica al instante y se guarda en este dispositivo.</Text>
              <SelectField label="Tema" value={preference} options={THEME_OPTIONS} onChange={setPreference} />
            </View>
          </View>
        ) : screen === 'reminders' ? (
          <View>
            <Text style={styles.lead}>Te avisamos 1 día antes de cada evento que marcaste.</Text>
            {!profile?.subscribed ? (
              <View style={styles.warningBox}>
                <Ionicons name="notifications-off-outline" size={22} color={colors.amber} style={styles.permissionIcon} />
                <View style={styles.explainerCopy}>
                  <Text style={styles.explainerTitle}>Las notificaciones están desactivadas</Text>
                  <Text style={styles.helpText}>Sin ellas, los recordatorios no te van a llegar a este dispositivo.</Text>
                  <Button small title="Activar notificaciones" onPress={() => enableNotifications()} disabled={busy} />
                </View>
              </View>
            ) : null}
            {reminderEvents.length ? reminderEvents.map(event => (
              <Pressable key={event.id} style={({ pressed }) => [styles.panel, pressed && styles.pressed]} onPress={() => openEvent(event.id, 'feed', 'reminders')}>
                <Text style={styles.eventDepartment}>{config.departments[event.department]?.label || ''}</Text>
                <Text style={styles.cardTitle}>{event.title}</Text>
                <View style={styles.eventMeta}>
                  <Ionicons name="calendar-outline" size={14} color={colors.muted} />
                  <Text style={styles.eventMetaText}>{formatDate(event.startsAt, true)}</Text>
                </View>
                <View style={styles.eventMeta}>
                  <Ionicons name="location-outline" size={14} color={colors.muted} />
                  <Text style={styles.eventMetaText}>{event.place}</Text>
                </View>
                <View style={styles.reminderFooter}>
                  <View style={styles.reminderWhen}>
                    <Ionicons name="notifications" size={14} color={colors.green} />
                    <Text style={styles.reminderWhenText}>Te avisamos 1 día antes</Text>
                  </View>
                  <Button small kind="ghost" title="Quitar" onPress={() => toggleReminder(event.id)} disabled={busy} />
                </View>
              </Pressable>
            )) : (
              <View style={styles.empty}>
                <Ionicons name="notifications-outline" size={32} color={colors.accent} style={styles.emptyIcon} />
                <Text style={[styles.sectionTitle, styles.centerText]}>Todavía no hay eventos a notificar</Text>
                <Text style={[styles.helpText, styles.centerText]}>Tocá “Recordarme” en la ficha de un evento para que te avisemos 1 día antes.</Text>
              </View>
            )}
          </View>
        ) : screen === 'detail' && selectedEvent ? (
          <View>
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
              {selectedEvent.sourceUrl ? <Button title="Ver publicación de origen" trailingIcon="open-outline" kind="outlined" onPress={() => openExternal(selectedEvent.sourceUrl)} /> : null}
              {selectedEvent.registrationUrl ? <Button title={selectedEvent.demo ? 'Consultar sitio de ejemplo' : 'Ir a inscripción externa'} trailingIcon="open-outline" kind="outlined" onPress={() => openExternal(selectedEvent.registrationUrl)} /> : null}
            </View>
            <View style={styles.panel}>
              <Text style={styles.sectionTitle}>¿Te interesa participar?</Text>
              <Text style={styles.helpText}>Guardá un recordatorio y te avisamos dentro de las 24 horas anteriores al evento.</Text>
              <Button
                title={reminders.includes(selectedEvent.id) ? 'Recordatorio activado' : 'Recordarme'}
                icon={reminders.includes(selectedEvent.id) ? 'notifications' : 'notifications-outline'}
                kind={reminders.includes(selectedEvent.id) ? 'success' : 'primary'}
                onPress={() => toggleReminder(selectedEvent.id)}
                disabled={busy || new Date(selectedEvent.startsAt).getTime() <= Date.now()}
              />
            </View>
          </View>
        ) : (
          <View>
            <Text style={styles.eyebrow}>TU AGENDA ACADÉMICA</Text>
            <Text style={styles.heading}>Descubrí lo que viene<Text style={styles.accentDot}>.</Text></Text>
            <Text style={styles.lead}>Charlas, talleres y encuentros de {departmentLabel}.</Text>
            <Pressable
              style={({ pressed }) => [styles.filterRow, pressed && styles.pressed]}
              onPress={editProfile}
              accessibilityRole="button"
              accessibilityHint="Abre Configuración para cambiar tu carrera"
            >
              <Ionicons name="funnel-outline" size={16} color={colors.green} />
              <Text style={styles.filterText}>
                Solo eventos de <Text style={styles.filterStrong}>{profile?.career}</Text> y del departamento en general.
              </Text>
              <Text style={styles.filterAction}>Cambiar</Text>
            </Pressable>
            <Text style={[styles.sectionTitle, styles.feedHeading]}>Próximos eventos</Text>
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
                  <View style={styles.eventMeta}>
                    <Ionicons name="calendar-outline" size={14} color={colors.muted} />
                    <Text style={styles.eventMetaText}>{formatDate(event.startsAt, true)}</Text>
                  </View>
                  <View style={styles.eventMeta}>
                    <Ionicons name="location-outline" size={14} color={colors.muted} />
                    <Text style={styles.eventMetaText}>{event.place}</Text>
                  </View>
                  <View style={styles.cardAction}>
                    <Text style={styles.cardActionText}>Ver ficha completa</Text>
                    <Ionicons name="arrow-forward" size={15} color={colors.accent} />
                  </View>
                </View>
              </Pressable>
            )) : (
              <View style={styles.empty}>
                <Ionicons name="calendar-clear-outline" size={32} color={colors.accent} style={styles.emptyIcon} />
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

      {settingsDirty ? (
        <View style={styles.saveBar}>
          <Button title={busy ? 'Guardando…' : 'Guardar cambios'} icon="checkmark" onPress={saveProfile} disabled={busy || !draft?.career} />
        </View>
      ) : null}

      {profile ? (
        <View style={styles.bottomNav}>
          <Pressable style={styles.navItem} onPress={() => goTo('feed')}>
            <Ionicons
              name={homeTab ? 'home' : 'home-outline'}
              size={20}
              color={homeTab ? colors.accent : colors.muted}
              style={styles.navIcon}
            />
            <Text style={[styles.navText, homeTab && styles.navActive]}>Inicio</Text>
          </Pressable>
          <Pressable style={styles.navItem} onPress={() => goTo('reminders')}>
            <Ionicons
              name={remindersTab ? 'notifications' : 'notifications-outline'}
              size={20}
              color={remindersTab ? colors.accent : colors.muted}
              style={styles.navIcon}
            />
            <Text style={[styles.navText, remindersTab && styles.navActive]}>Recordatorios</Text>
          </Pressable>
        </View>
      ) : null}

      <Modal visible={welcomeVisible} transparent animationType="fade" onRequestClose={() => finishWelcome(false)}>
        <View style={styles.modalShade}>
          <View style={styles.modalCard}>
            <ScrollView>
              <View style={styles.welcomeBadge}>
                <Ionicons name="checkmark-circle" size={30} color={colors.accent} />
              </View>
              <Text style={styles.modalTitle}>¡Listo! Ya quedó configurado</Text>
              <Text style={styles.bodyText}>
                Te vamos a avisar de los eventos de <Text style={styles.welcomeStrong}>{departmentLabel}{profile?.career ? ` · ${profile.career}` : ''}</Text>.
              </Text>
              {[
                { icon: 'time-outline', text: 'Enterate de los eventos nuevos con tiempo para inscribirte.' },
                { icon: 'school-outline', text: 'Solo avisos de tu carrera, nada de otros departamentos.' },
                { icon: 'notifications-outline', text: 'Recordatorios antes de los eventos que marques.' },
              ].map(item => (
                <View key={item.icon} style={styles.welcomeBenefit}>
                  <Ionicons name={item.icon} size={18} color={colors.accent} />
                  <Text style={styles.welcomeBenefitText}>{item.text}</Text>
                </View>
              ))}
              <Text style={[styles.label, styles.welcomeLabel]}>¿Cada cuánto querés recibir avisos?</Text>
              <View style={styles.welcomeOptions}>
                {FREQUENCY_OPTIONS.map(option => {
                  const active = option.value === welcomeFrequency;
                  return (
                    <Pressable
                      key={option.value}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active }}
                      style={[styles.welcomeOption, active && styles.welcomeOptionActive]}
                      onPress={() => setWelcomeFrequency(option.value)}
                    >
                      <Text style={[styles.welcomeOptionText, active && styles.welcomeOptionTextActive]}>{option.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={styles.fine}>Podés cambiar esto cuando quieras desde Configuración.</Text>
              <Button title="Activar notificaciones" icon="notifications-outline" onPress={() => finishWelcome(true)} disabled={busy} />
              <Button title="Ahora no" kind="ghost" onPress={() => finishWelcome(false)} disabled={busy} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, backgroundColor: colors.background },
    loadingText: { marginTop: 14, color: colors.muted, fontSize: 15 },
    topbar: { height: 58, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
    brand: { color: colors.ink, fontSize: 21, fontWeight: '700', letterSpacing: -0.6 },
    brandAccent: { color: colors.accent },
    topbarStart: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
    topbarBack: { width: 36, height: 36, marginLeft: -8, alignItems: 'center', justifyContent: 'center' },
    topbarTitle: { flex: 1, color: colors.ink, fontSize: 19, fontWeight: '800', letterSpacing: -0.4 },
    topbarAction: { width: 40, height: 40, marginRight: -8, alignItems: 'center', justifyContent: 'center' },
    content: { padding: 20, paddingBottom: 28 },
    eyebrow: { color: colors.accent, fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginBottom: 10, marginTop: 8 },
    hero: { color: colors.ink, fontSize: 34, lineHeight: 41, fontWeight: '800', letterSpacing: -1, marginBottom: 12 },
    heroAccent: { color: colors.accent },
    heading: { color: colors.ink, fontSize: 29, lineHeight: 36, fontWeight: '800', letterSpacing: -0.7, marginBottom: 8 },
    accentDot: { color: colors.accent },
    lead: { color: colors.muted, fontSize: 15, lineHeight: 23, marginBottom: 22 },
    panel: { backgroundColor: colors.surface, borderRadius: 18, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: colors.borderSoft },
    field: { marginBottom: 16 },
    fieldDisabled: { opacity: 0.45 },
    panelIntro: { marginBottom: 14 },
    saveBar: { paddingHorizontal: 20, paddingBottom: 10, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.background },
    label: { color: colors.ink, fontSize: 13, fontWeight: '700', marginBottom: 8 },
    select: { minHeight: 48, paddingHorizontal: 13, borderRadius: 10, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface },
    selectText: { flex: 1, color: colors.ink, fontSize: 14 },
    selectArrow: { marginLeft: 8 },
    modalShade: { flex: 1, justifyContent: 'center', padding: 22, backgroundColor: colors.shade },
    modalCard: { maxHeight: '82%', padding: 18, borderRadius: 18, backgroundColor: colors.surface },
    modalTitle: { color: colors.ink, fontSize: 19, fontWeight: '800', marginBottom: 10 },
    option: { minHeight: 48, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    optionText: { flex: 1, color: colors.ink, fontSize: 14, paddingVertical: 10 },
    optionSelected: { color: colors.accent, fontWeight: '700' },
    optionCheck: { paddingLeft: 12 },
    button: { minHeight: 48, paddingHorizontal: 16, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
    button_primary: { backgroundColor: colors.accentStrong },
    button_outlined: { borderWidth: 1, borderColor: colors.accent, backgroundColor: colors.surface },
    button_ghost: { backgroundColor: 'transparent' },
    button_success: { backgroundColor: colors.greenLight },
    buttonDisabled: { opacity: 0.55 },
    buttonSmall: { minHeight: 38, alignSelf: 'flex-start', paddingHorizontal: 12, marginTop: 12 },
    buttonContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    buttonText: { fontSize: 15, fontWeight: '700' },
    buttonText_primary: { color: colors.onAccent },
    buttonText_outlined: { color: colors.accent },
    buttonText_ghost: { color: colors.muted },
    buttonText_success: { color: colors.green },
    buttonTextSmall: { fontSize: 13 },
    pressed: { opacity: 0.82 },
    fine: { color: colors.muted, fontSize: 12, textAlign: 'center', lineHeight: 18, marginTop: 14 },
    explainer: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.accentSoft, borderRadius: 12, padding: 13, marginVertical: 4, marginBottom: 12 },
    explainerIcon: { marginRight: 10 },
    explainerCopy: { flex: 1 },
    explainerTitle: { color: colors.ink, fontSize: 14, fontWeight: '700', marginBottom: 4 },
    helpText: { color: colors.muted, fontSize: 13, lineHeight: 19 },
    sectionTitle: { color: colors.ink, fontSize: 17, fontWeight: '800', marginBottom: 8 },
    toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.borderSoft, marginBottom: 14 },
    toggleCopy: { flex: 1 },
    toggleTitle: { color: colors.ink, fontSize: 14, fontWeight: '700', marginBottom: 4 },
    divider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
    permissionBox: { flexDirection: 'row', alignItems: 'flex-start', padding: 13, marginVertical: 10, borderRadius: 12, backgroundColor: colors.accentSoft },
    permissionIcon: { marginRight: 10 },
    detailLabel: { color: colors.muted, fontSize: 10, letterSpacing: 1, fontWeight: '800', marginBottom: 4, marginTop: 5 },
    detailValue: { color: colors.ink, fontSize: 15, lineHeight: 22, fontWeight: '600', marginBottom: 13 },
    bodyText: { color: colors.ink, fontSize: 15, lineHeight: 23, marginBottom: 14 },
    demoWarning: { color: colors.amber, backgroundColor: colors.amberLight, padding: 12, borderRadius: 10, marginBottom: 14, fontSize: 13, lineHeight: 19 },
    feedHeading: { marginBottom: 12 },
    filterRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, marginBottom: 20, borderRadius: 12, backgroundColor: colors.greenLight },
    filterText: { flex: 1, color: colors.ink, fontSize: 13, lineHeight: 19 },
    filterStrong: { fontWeight: '700' },
    filterAction: { color: colors.green, fontSize: 13, fontWeight: '800' },
    eventCard: { overflow: 'hidden', borderRadius: 17, marginBottom: 15, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSoft },
    eventBanner: { height: 110, justifyContent: 'space-between', padding: 14 },
    eventBanner_0: { backgroundColor: colors.banners[0] },
    eventBanner_1: { backgroundColor: colors.banners[1] },
    eventBanner_2: { backgroundColor: colors.banners[2] },
    eventBanner_3: { backgroundColor: colors.banners[3] },
    eventBannerBrand: { color: colors.ink, fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
    eventChip: { alignSelf: 'flex-start', overflow: 'hidden', color: colors.ink, backgroundColor: colors.chip, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 5, fontSize: 9, fontWeight: '800', letterSpacing: 0.4 },
    eventBody: { padding: 16 },
    eventDepartment: { color: colors.accent, fontSize: 11, fontWeight: '700', marginBottom: 7 },
    cardTitle: { color: colors.ink, fontSize: 18, lineHeight: 24, fontWeight: '800', marginBottom: 7 },
    eventMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
    eventMetaText: { flex: 1, color: colors.muted, fontSize: 12 },
    cardAction: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16 },
    cardActionText: { color: colors.accent, fontSize: 13, fontWeight: '800' },
    empty: { alignItems: 'center', padding: 22, borderRadius: 16, backgroundColor: colors.surface },
    emptyIcon: { marginBottom: 10 },
    warningBox: { flexDirection: 'row', alignItems: 'flex-start', padding: 13, marginBottom: 16, borderRadius: 12, backgroundColor: colors.amberLight },
    reminderFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 2, borderTopWidth: 1, borderTopColor: colors.borderSoft },
    reminderWhen: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
    reminderWhenText: { color: colors.green, fontSize: 12, fontWeight: '700' },
    centerText: { textAlign: 'center' },
    tipBox: { padding: 16, borderRadius: 15, backgroundColor: colors.accentSoft, marginTop: 4 },
    welcomeBadge: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft, marginBottom: 12 },
    welcomeStrong: { fontWeight: '700' },
    welcomeBenefit: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
    welcomeBenefitText: { flex: 1, color: colors.ink, fontSize: 14, lineHeight: 20 },
    welcomeLabel: { marginTop: 8 },
    welcomeOptions: { gap: 8 },
    welcomeOption: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: colors.border },
    welcomeOptionActive: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
    welcomeOptionText: { color: colors.ink, fontSize: 14 },
    welcomeOptionTextActive: { color: colors.accent, fontWeight: '700' },
    bottomNav: { minHeight: 62, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },
    navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 7 },
    navIcon: { marginBottom: 2 },
    navText: { color: colors.muted, fontSize: 11, fontWeight: '600' },
    navActive: { color: colors.accent, fontWeight: '800' },
    errorBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.redLight, paddingHorizontal: 14, paddingVertical: 10 },
    errorText: { flex: 1, color: colors.red, fontSize: 13, lineHeight: 18 },
    dismiss: { paddingLeft: 12 },
    notice: { color: colors.green, backgroundColor: colors.greenLight, paddingHorizontal: 14, paddingVertical: 9, fontSize: 13 },
  });
}
