import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Crypto from 'expo-crypto';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router, useLocalSearchParams } from 'expo-router';
import { CheckBadge, Icon, Logo, Trama } from './src/ui/brand';

const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/$/, '');
const FREQUENCY_OPTIONS = [
  { value: 'instantanea', label: 'Cada evento nuevo' },
  { value: 'diaria', label: 'Resumen diario' },
  { value: 'semanal', label: 'Resumen semanal' },
];
const EXPLORE_FREQUENCY_OPTIONS = [
  { value: 'diaria', label: 'Diario' },
  { value: 'semanal', label: 'Semanal' },
];
const THEME_KEY = 'nodo_theme';
const THEME_OPTIONS = [
  { value: 'system', label: 'Usar el del dispositivo' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
];
const WIDE_BREAKPOINT = 900;
const ENTRADA_UNLAM = require('./assets/design/Fotografia/unlam-entrada.png');
// Colores del design system Nodo UNLaM (tokens.json). El tema oscuro no está en el diseño: se deriva de la misma paleta.
const HEADER_TRAMA = { bg: '#0C7A55', line: '#1E8A63', node: '#33997A', ring: '#5DB394' };
const PALETTES = {
  light: {
    ink: '#18223A',
    muted: '#667085',
    textSecondary: '#475467',
    accent: '#128268',
    accentStrong: '#128268',
    accentDark: '#0C7A55',
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
    headerBg: '#0C7A55',
    headerBorder: '#0A6647',
    sidebarBg: '#E4F1E4',
    sidebarLinkBg: 'rgba(255,255,255,0.55)',
    sidebarBorder: '#C8E0C9',
    timeline: '#B9D9C2',
    logo: 'stacked',
    tramaGris: { bg: '#F6F7FB', line: '#DDE1E6', node: '#C7CDD5', ring: '#AAB2BD' },
    banners: ['#E9E3FF', '#DDEBFA', '#FFF0CB', '#FFE1E6'],
  },
  dark: {
    ink: '#E6EAF0',
    muted: '#98A2B3',
    textSecondary: '#B4BDC9',
    accent: '#4FC4A4',
    accentStrong: '#128268',
    accentDark: '#4FC4A4',
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
    headerBg: '#0C7A55',
    headerBorder: '#0A6647',
    sidebarBg: '#14231D',
    sidebarLinkBg: 'rgba(255,255,255,0.04)',
    sidebarBorder: '#24382F',
    timeline: '#2F5A49',
    logo: 'stackedDark',
    tramaGris: { bg: '#0E1319', line: '#1B232C', node: '#26303B', ring: '#34414F' },
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

// Fecha breve del diseño: "Jue 11/9 · 18:00".
function formatShort(value) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('es-AR', {
    weekday: 'short', day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).formatToParts(new Date(value)).map(part => [part.type, part.value]));
  const weekday = parts.weekday.replace('.', '');
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${parts.day}/${parts.month} · ${parts.hour}:${parts.minute}`;
}

function timeAgo(value) {
  const hours = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 3600000));
  if (hours < 1) return 'Publicado hace menos de una hora';
  if (hours < 24) return `Publicado hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `Publicado hace ${days} ${days === 1 ? 'día' : 'días'}`;
}

// Las imágenes de los eventos vienen como URL HTTPS o como ruta /media/... del propio servidor.
const imageUri = url => (url.startsWith('/') ? `${API_URL}${url}` : url);

function Button({ title, onPress, kind = 'primary', disabled = false, small = false, icon, trailingIcon, style }) {
  const { styles } = useTheme();
  const textStyle = [styles.buttonText, styles[`buttonText_${kind}`], small && styles.buttonTextSmall];
  const { color } = StyleSheet.flatten(textStyle);
  const iconSize = small ? 16 : 18;
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
        style,
      ]}
    >
      <View style={styles.buttonContent}>
        {icon ? <Icon name={icon} size={iconSize} color={color} filled={kind === 'success'} /> : null}
        <Text style={textStyle}>{title}</Text>
        {trailingIcon ? <Icon name={trailingIcon} size={iconSize} color={color} /> : null}
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
        <Text style={styles.selectText} numberOfLines={1}>{selected}</Text>
        <Icon name="chevronDown" size={18} color={colors.muted} style={styles.selectArrow} />
      </Pressable>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.modalShade} onPress={() => setVisible(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{label}</Text>
            <ScrollView>
              {options.map(option => {
                const active = option.value === value;
                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    style={[styles.option, active && styles.optionActive]}
                    onPress={() => { onChange(option.value); setVisible(false); }}
                  >
                    <Text style={[styles.optionText, active && styles.optionSelected]}>{option.label}</Text>
                    {active ? <Icon name="check" size={18} color={colors.accentDark} strokeWidth={2.2} style={styles.optionCheck} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
            <Button title="Cerrar" kind="ghost" onPress={() => setVisible(false)} />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

// Interruptor del diseño: pista de 48×24 y área táctil de 52×44.
function ToggleSwitch({ value, onValueChange, label }) {
  const { colors, styles } = useTheme();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      onPress={() => onValueChange(!value)}
      style={styles.switchHit}
    >
      <View style={[styles.switchTrack, { backgroundColor: value ? colors.accentStrong : colors.trackOff }]} />
      <View style={[styles.switchThumb, { left: value ? 26 : 4 }]} />
    </Pressable>
  );
}

function ToggleRow({ icon, title, description, value, onValueChange }) {
  const { colors, styles } = useTheme();
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleCopy}>
        <View style={styles.sectionHead}>
          <Icon name={icon} size={20} color={colors.accentDark} />
          <Text style={styles.sectionHeadText}>{title}</Text>
        </View>
        <Text style={styles.helpText}>{description}</Text>
      </View>
      <ToggleSwitch value={value} onValueChange={onValueChange} label={title} />
    </View>
  );
}

// Opciones excluyentes del diseño (frecuencia de avisos): botones con borde, la elegida con fondo tinte.
function RadioGroup({ label, options, value, onChange, columns = 1, disabled = false }) {
  const { styles } = useTheme();
  return (
    <View style={disabled && styles.fieldDisabled}>
      {label ? <Text style={styles.overline}>{label}</Text> : null}
      <View style={[styles.radioGroup, columns > 1 && styles.radioGroupRow]} accessibilityRole="radiogroup">
        {options.map(option => {
          const active = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected: active, disabled }}
              disabled={disabled}
              style={[styles.radio, columns > 1 && styles.radioFlex, active && styles.radioActive]}
              onPress={() => onChange(option.value)}
            >
              <Text style={[styles.radioText, active && styles.radioTextActive]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function BackPill({ label, onPress }) {
  const { styles } = useTheme();
  return (
    <Pressable onPress={onPress} style={styles.backPill} accessibilityRole="button" accessibilityLabel={`Volver a ${label}`}>
      <Icon name="arrowLeft" size={16} color={StyleSheet.flatten(styles.backPillText).color} />
      <Text style={styles.backPillText}>{label}</Text>
    </Pressable>
  );
}

function AppHeader({ onLogo, onMenu, menuOpen = false }) {
  const { styles } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.headerWrap, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Trama palette={HEADER_TRAMA} tile={140} />
        {onMenu ? (
          <Pressable
            onPress={onMenu}
            style={styles.menuButton}
            accessibilityRole="button"
            accessibilityLabel="Abrir menú de departamentos"
            accessibilityState={{ expanded: menuOpen }}
          >
            <Icon name="menu" size={22} color="#FFFFFF" />
          </Pressable>
        ) : null}
        <Pressable onPress={onLogo} accessibilityRole="button" accessibilityLabel="Nodo UNLaM, ir al inicio" hitSlop={8}>
          <Logo variant="header" height={30} />
        </Pressable>
      </View>
    </View>
  );
}

// Barra lateral (fija en escritorio, cajón en mobile): tu departamento y carrera, accesos directos y los otros departamentos.
function Sidebar({ department, career, selected, others, onSelect, onReminders, onSettings, style }) {
  const { colors, styles } = useTheme();
  const ownActive = !selected;
  return (
    <View style={[styles.sidebar, style]} accessibilityRole="navigation" accessibilityLabel="Departamentos">
      <ScrollView contentContainerStyle={styles.sidebarContent}>
        <Text style={styles.sidebarLabel}>TU DEPARTAMENTO Y CARRERA</Text>
        <Pressable
          onPress={() => onSelect(null)}
          style={ownActive ? styles.sidebarCurrent : styles.sidebarOwn}
          accessibilityRole="button"
          accessibilityState={{ selected: ownActive }}
        >
          <Text style={styles.sidebarDepartment}>{department}</Text>
          <Text style={styles.sidebarCareer}>{career}</Text>
        </Pressable>
        <Pressable onPress={onReminders} style={styles.sidebarLink} accessibilityRole="button">
          <Icon name="calendarCheck" size={20} color={colors.accentDark} />
          <Text style={styles.sidebarLinkText}>Mis recordatorios</Text>
        </Pressable>
        {others.length ? (
          <>
            <Text style={[styles.sidebarLabel, styles.sidebarLabelSpaced]}>OTROS DEPARTAMENTOS</Text>
            {others.map(option => {
              const active = option.value === selected;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => onSelect(option.value)}
                  style={active ? styles.sidebarCurrent : styles.sidebarOther}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={active ? styles.sidebarDepartment : styles.sidebarOtherText}>{option.label}</Text>
                </Pressable>
              );
            })}
          </>
        ) : null}
        <View style={styles.sidebarSpacer} />
        <View style={styles.sidebarFooter}>
          <Pressable onPress={onSettings} style={styles.sidebarLinkPlain} accessibilityRole="button">
            <Icon name="settings" size={20} color={colors.accentDark} />
            <Text style={styles.sidebarLinkText}>Configuración</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function PostCard({ event, index, department, flush, onPress }) {
  const { colors, styles } = useTheme();
  const [imageFailed, setImageFailed] = useState(false);
  const cover = event.images?.[0];
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.postCard, flush && styles.postCardFlush, pressed && styles.pressed]}
    >
      <View style={styles.postHead}>
        <View style={styles.postAvatar}><Text style={styles.postAvatarText}>{event.department.slice(0, 2).toUpperCase()}</Text></View>
        <View style={styles.postHeadCopy}>
          <Text style={styles.postPage} numberOfLines={1}>{department}</Text>
          {event.publishedAt ? <Text style={styles.postTime}>{timeAgo(event.publishedAt)}</Text> : null}
        </View>
      </View>
      <View style={styles.postBody}>
        <Text style={styles.postTitle}>{event.title}</Text>
        <Text style={styles.postSub}>{formatShort(event.startsAt)} · {event.place}</Text>
        <Text numberOfLines={2} style={styles.postDescription}>{event.description}</Text>
      </View>
      {cover && !imageFailed ? (
        <View>
          <Image
            source={{ uri: imageUri(cover) }}
            accessibilityLabel={`Flyer: ${event.title}`}
            resizeMode="cover"
            onError={() => setImageFailed(true)}
            style={[styles.postPhoto, { aspectRatio: flush ? 4 / 3 : 16 / 9 }]}
          />
          {event.demo ? <Text style={styles.postChip}>DEMO · EVENTO FICTICIO</Text> : null}
        </View>
      ) : (
        <View style={[styles.postImage, { backgroundColor: colors.banners[index % colors.banners.length] }]}>
          <Icon name="image" size={18} color={colors.textSecondary} />
          {event.demo ? <Text style={styles.postChip}>DEMO · EVENTO FICTICIO</Text> : null}
        </View>
      )}
      <View style={styles.postFooter}>
        <Text style={styles.postFooterText}>Ver ficha completa</Text>
        <Icon name="arrowRight" size={15} color={colors.accent} />
      </View>
    </Pressable>
  );
}

// Carrusel de flyers de la ficha: formato 4:5, contador, flechas y puntos.
function FlyerCarousel({ images, title, flush }) {
  const { colors, styles } = useTheme();
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const scroller = useRef(null);
  const total = images.length;
  const show = target => {
    const next = Math.max(0, Math.min(total - 1, target));
    setIndex(next);
    scroller.current?.scrollTo({ x: next * width, animated: true });
  };
  return (
    <View style={styles.carousel} accessibilityLabel="Flyers del evento">
      <View
        style={[styles.carouselFrame, flush && styles.carouselFrameFlush]}
        onLayout={event => setWidth(event.nativeEvent.layout.width)}
      >
        {width ? (
          <ScrollView
            ref={scroller}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={event => setIndex(Math.round(event.nativeEvent.contentOffset.x / width))}
          >
            {images.map((uri, position) => (
              <Image
                key={uri}
                source={{ uri: imageUri(uri) }}
                accessibilityLabel={`Flyer ${position + 1} de ${total}: ${title}`}
                resizeMode="cover"
                style={{ width, height: (width * 5) / 4 }}
              />
            ))}
          </ScrollView>
        ) : null}
        {total > 1 ? (
          <>
            <Text style={styles.carouselCounter}>{index + 1}/{total}</Text>
            {index > 0 ? (
              <Pressable style={[styles.carouselArrow, styles.carouselPrev]} onPress={() => show(index - 1)} accessibilityRole="button" accessibilityLabel="Flyer anterior">
                <Icon name="chevronLeft" size={20} color={colors.ink} strokeWidth={2.4} />
              </Pressable>
            ) : null}
            {index < total - 1 ? (
              <Pressable style={[styles.carouselArrow, styles.carouselNext]} onPress={() => show(index + 1)} accessibilityRole="button" accessibilityLabel="Flyer siguiente">
                <Icon name="chevronRight" size={20} color={colors.ink} strokeWidth={2.4} />
              </Pressable>
            ) : null}
          </>
        ) : null}
      </View>
      {total > 1 ? (
        <View style={styles.carouselDots}>
          {images.map((uri, position) => (
            <View key={uri} style={[styles.carouselDot, position === index && styles.carouselDotActive]} />
          ))}
        </View>
      ) : null}
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
  const { width } = useWindowDimensions();
  const wide = width >= WIDE_BREAKPOINT;
  const insets = useSafeAreaInsets();
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
  const [reminderList, setReminderList] = useState([]);
  const [browseDept, setBrowseDept] = useState(null);
  const [browseEvents, setBrowseEvents] = useState([]);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [extraEvents, setExtraEvents] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const browseRequest = useRef(null);
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
    setReminderList(reminderData.events || []);
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
    setReminderList(reminderData.events || []);
  }, [deviceId]);

  const openEvent = useCallback(async (id, source = 'feed', from = 'feed') => {
    if (!id) return;
    let event = [...events, ...browseEvents, ...reminderList, ...extraEvents].find(item => item.id === id);
    if (!event) {
      try {
        const query = `deviceId=${encodeURIComponent(deviceId)}`;
        const result = await request(`/api/events?${query}`);
        setEvents(result.events);
        event = result.events.find(item => item.id === id);
        if (!event) {
          // Puede ser de otro departamento (por ejemplo, un aviso de un recordatorio).
          event = (await request(`/api/events/${encodeURIComponent(id)}?${query}`)).event;
          setExtraEvents(current => [...current.filter(item => item.id !== id), event]);
        }
      } catch (loadError) {
        setError(loadError.message);
      }
    }
    if (!event) {
      goTo('feed');
      showNotice('Este evento ya no está disponible.');
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
  }, [deviceId, events, browseEvents, reminderList, extraEvents, showNotice]);

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
      if (drawerOpen) {
        setDrawerOpen(false);
        return true;
      }
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
  }, [screen, backTarget, drawerOpen]);

  useEffect(() => {
    if (!pendingEvent || !events.length || !deviceId) return;
    const { id, source } = pendingEvent;
    setPendingEvent(null);
    openEventRef.current?.(id, source);
  }, [deviceId, events, pendingEvent]);

  const departmentOptions = useMemo(() => Object.entries(config?.departments || {}).map(([value, item]) => ({
    value, label: `Departamento de ${item.label}`,
  })), [config]);
  const careerOptions = useMemo(() => (config?.departments?.[draft?.department]?.careers || []).map(value => ({
    value, label: value,
  })), [config, draft?.department]);
  const departmentLabel = config?.departments?.[profile?.department]?.label || '';
  const otherDepartments = departmentOptions.filter(option => option.value !== profile?.department);
  const feedDepartment = browseDept || profile?.department;
  const feedLabel = config?.departments?.[feedDepartment]?.label || '';
  const feedEvents = browseDept ? browseEvents : events;
  const selectedEvent = [...events, ...browseEvents, ...reminderList, ...extraEvents].find(event => event.id === routeEventId);
  const reminderEvents = reminderList;
  const settingsDirty = screen === 'settings' && Boolean(draft && profile) && (
    ['department', 'career', 'frequency', 'alerts', 'explore'].some(key => draft[key] !== profile[key]) ||
    draft.exploreFrequency !== (profile.exploreFrequency || 'semanal'));
  const shownScreen = screen === 'detail' && !selectedEvent ? 'feed' : screen;

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
      setBrowseDept(null);
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

  // Explorar otro departamento no cambia tu perfil: solo cambia la lista que ves en Inicio.
  async function selectDepartment(key) {
    setDrawerOpen(false);
    goTo('feed');
    if (!key || key === profile?.department) {
      browseRequest.current = null;
      setBrowseDept(null);
      return;
    }
    browseRequest.current = key;
    setBrowseDept(key);
    setBrowseEvents([]);
    setBrowseLoading(true);
    setError('');
    try {
      const result = await request(`/api/events?deviceId=${encodeURIComponent(deviceId)}&department=${encodeURIComponent(key)}`);
      if (browseRequest.current === key) setBrowseEvents(result.events);
    } catch (browseError) {
      if (browseRequest.current === key) setError(browseError.message);
    } finally {
      if (browseRequest.current === key) setBrowseLoading(false);
    }
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
      <View style={[styles.loading, { paddingTop: insets.top }]} accessibilityLiveRegion="polite">
        <StatusBar barStyle={statusBarStyle} />
        <Logo variant={colors.logo} height={116} />
        <ActivityIndicator size="large" color={colors.accent} style={styles.loadingSpinner} />
        <Text style={styles.loadingText}>Cargando eventos de tu carrera…</Text>
      </View>
    );
  }

  if (!config) {
    return (
      <View style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor={colors.headerBg} />
        <AppHeader />
        <View style={styles.offlineWrap}>
          <View style={styles.offlineCard}>
            <Icon name="wifiOff" size={40} color={colors.muted} strokeWidth={1.8} style={styles.offlineIcon} />
            <Text style={styles.offlineTitle} accessibilityRole="header">No pudimos conectarnos</Text>
            <Text style={styles.offlineText}>{error || 'No se pudo iniciar la aplicación.'}</Text>
            <Button title="Reintentar" style={styles.offlineButton} onPress={() => {
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
          </View>
        </View>
      </View>
    );
  }

  const patchDraft = values => setDraft(current => ({ ...current, ...values }));

  const banners = (
    <>
      {error ? (
        <View style={styles.errorBanner} accessibilityRole="alert">
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => setError('')} style={styles.bannerClose} accessibilityRole="button" accessibilityLabel="Cerrar aviso">
            <Icon name="close" size={20} color={colors.red} />
          </Pressable>
        </View>
      ) : null}
      {notice ? (
        <View style={styles.notice} accessibilityRole="alert">
          <Icon name="check" size={16} color={colors.green} strokeWidth={2.2} />
          <Text style={styles.noticeText}>{notice}</Text>
        </View>
      ) : null}
    </>
  );

  if (screen === 'onboarding') {
    return (
      <View style={styles.safe}>
        <StatusBar barStyle={statusBarStyle} />
        {banners}
        <View style={[styles.onboarding, wide && styles.onboardingWide]}>
          <View style={[styles.photo, wide && styles.photoWide]}>
            <Image source={ENTRADA_UNLAM} accessibilityLabel="Entrada de la Universidad Nacional de La Matanza" resizeMode="cover" style={styles.photoImage} />
          </View>
          <View style={[styles.onboardingForm, wide && styles.onboardingFormWide]}>
            <Trama palette={colors.tramaGris} tile={wide ? 180 : 150} />
            <ScrollView
              contentContainerStyle={[styles.onboardingScroll, wide && styles.onboardingScrollWide]}
              keyboardShouldPersistTaps="handled"
            >
              <View style={[styles.card, wide && styles.cardWide]}>
                <View style={styles.cardLogo} accessibilityRole="header">
                  <Logo variant={colors.logo} height={wide ? 129 : 103} />
                </View>
                <Text style={[styles.subtitle, wide && styles.subtitleWide]}>Elegí tu departamento y carrera</Text>
                <SelectField label="Departamento" value={draft?.department} options={departmentOptions} onChange={department => {
                  const career = config.departments[department].careers[0];
                  patchDraft({ department, career });
                }} />
                <SelectField label="Carrera" value={draft?.career} options={careerOptions} onChange={career => patchDraft({ career })} />
                <Button
                  title={busy ? 'Guardando…' : 'Continuar'}
                  trailingIcon={busy ? undefined : 'arrowRight'}
                  onPress={saveProfile}
                  disabled={busy || !draft?.career}
                  style={styles.buttonLarge}
                />
                <Text style={styles.fine}>Se guarda en este dispositivo. No pide cuenta ni contraseña.</Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </View>
    );
  }

  const sidebarProps = {
    department: `Departamento de ${departmentLabel}`,
    career: profile?.career,
    selected: browseDept,
    others: otherDepartments,
    onSelect: selectDepartment,
    onReminders: () => { setDrawerOpen(false); goTo('reminders'); },
    onSettings: () => { setDrawerOpen(false); editProfile(); },
  };
  const feed = shownScreen === 'feed';
  const columnWidth = feed ? 600 : shownScreen === 'detail' ? 900 : 784;
  const selectedReminded = selectedEvent ? reminders.includes(selectedEvent.id) : false;

  return (
    <View style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.headerBg} />
      <AppHeader
        onLogo={() => goTo('feed')}
        onMenu={!wide && feed ? () => setDrawerOpen(open => !open) : undefined}
        menuOpen={drawerOpen}
      />
      {banners}

      <View style={[styles.shell, wide && styles.shellRow]}>
        {wide && feed ? (
          <Sidebar {...sidebarProps} />
        ) : null}
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.content, wide && styles.contentWide, feed && !wide && styles.contentFeed]}
          keyboardShouldPersistTaps="handled"
        >
          {feed ? (
            <View style={styles.feedTrama} pointerEvents="none">
              <Trama palette={colors.tramaGris} tile={170} fade />
            </View>
          ) : null}
          <View style={[styles.column, { maxWidth: columnWidth }]}>
            {screen === 'settings' ? (
              <View>
                <BackPill label="Inicio" onPress={() => goTo('feed')} />
                <Text style={[styles.pageTitle, wide && styles.pageTitleWide]} accessibilityRole="header">Configuración</Text>
                <View style={[styles.section, wide && styles.sectionWide]}>
                  <View style={styles.sectionHead}>
                    <Icon name="gradCap" size={20} color={colors.accentDark} />
                    <Text style={styles.sectionHeadText}>Mi carrera</Text>
                  </View>
                  <Text style={[styles.helpText, styles.panelIntro]}>Los eventos y las alertas se actualizan según lo que elijas.</Text>
                  <View style={wide && styles.fieldsRow}>
                    <View style={wide && styles.flex}>
                      <SelectField label="Departamento" value={draft?.department} options={departmentOptions} onChange={department => {
                        patchDraft({ department, career: config.departments[department].careers[0] });
                      }} />
                    </View>
                    <View style={wide && styles.flex}>
                      <SelectField label="Carrera" value={draft?.career} options={careerOptions} onChange={career => patchDraft({ career })} />
                    </View>
                  </View>
                </View>
                <View style={[styles.section, wide && styles.sectionWide]}>
                  <ToggleRow
                    icon="bell"
                    title="Alertas de eventos nuevos"
                    description="Solo de tu departamento y tu carrera."
                    value={Boolean(draft?.alerts)}
                    onValueChange={alerts => patchDraft({ alerts })}
                  />
                  <RadioGroup
                    label="FRECUENCIA"
                    options={FREQUENCY_OPTIONS}
                    value={draft?.frequency}
                    onChange={frequency => patchDraft({ frequency })}
                    columns={wide ? 3 : 1}
                    disabled={!draft?.alerts}
                  />
                  <View style={styles.permissionBox}>
                    <Icon name={profile?.subscribed ? 'bell' : 'bellOff'} size={22} color={colors.accentDark} style={styles.permissionIcon} />
                    <View style={styles.flex}>
                      <Text style={styles.explainerTitle}>Estado del dispositivo</Text>
                      <Text style={styles.helpText}>{profile?.subscribed ? 'Notificaciones activas en este dispositivo.' : 'Todavía no activaste las notificaciones en este dispositivo.'}</Text>
                      {!profile?.subscribed ? <Button small title="Activar notificaciones" onPress={() => enableNotifications()} disabled={busy} /> : null}
                    </View>
                  </View>
                </View>
                <View style={[styles.section, wide && styles.sectionWide]}>
                  <ToggleRow
                    icon="clock"
                    title="Recordarme revisar la app"
                    description="Un aviso para entrar a ver eventos, aunque no haya novedades."
                    value={Boolean(draft?.explore)}
                    onValueChange={explore => patchDraft({ explore })}
                  />
                  <View style={wide && styles.radioNarrow}>
                    <RadioGroup
                      label="FRECUENCIA"
                      options={EXPLORE_FREQUENCY_OPTIONS}
                      value={draft?.exploreFrequency}
                      onChange={exploreFrequency => patchDraft({ exploreFrequency })}
                      columns={2}
                      disabled={!draft?.explore}
                    />
                  </View>
                </View>
                <View style={[styles.section, wide && styles.sectionWide]}>
                  <Text style={styles.sectionHeadText}>Apariencia</Text>
                  <Text style={[styles.helpText, styles.panelIntro, styles.sectionIntroGap]}>El tema se aplica al instante y se guarda en este dispositivo.</Text>
                  <SelectField label="Tema" value={preference} options={THEME_OPTIONS} onChange={setPreference} />
                </View>
              </View>
            ) : screen === 'reminders' ? (
              <View>
                <BackPill label="Inicio" onPress={() => goTo('feed')} />
                <Text style={[styles.pageTitle, wide && styles.pageTitleWide]} accessibilityRole="header">Mis recordatorios</Text>
                <Text style={[styles.lead, wide && styles.leadWide]}>Te avisamos 1 día antes de cada evento que marcaste.</Text>
                {!profile?.subscribed ? (
                  <View style={styles.warningBox}>
                    <Icon name="bellOff" size={22} color={colors.amber} style={styles.permissionIcon} />
                    <View style={styles.flex}>
                      <Text style={styles.explainerTitle}>Las notificaciones están desactivadas</Text>
                      <Text style={styles.helpText}>Sin ellas, los recordatorios no te van a llegar a este dispositivo.</Text>
                      <Button small title="Activar notificaciones" onPress={() => enableNotifications()} disabled={busy} />
                    </View>
                  </View>
                ) : null}
                {reminderEvents.length ? (
                  <View style={styles.timeline}>
                    <View style={styles.timelineLine} />
                    {reminderEvents.map(event => (
                      <View key={event.id} style={styles.reminderCard}>
                        <View style={styles.timelineDot} />
                        <Text style={styles.cardTitle}>{event.title}</Text>
                        <Text style={styles.reminderSub}>{formatShort(event.startsAt)} · {event.place}</Text>
                        <View style={styles.reminderFooter}>
                          <View style={styles.reminderWhen}>
                            <Icon name="bell" size={14} color={colors.green} filled />
                            <Text style={styles.reminderWhenText}>Recordatorio activado</Text>
                          </View>
                          <View style={styles.reminderActions}>
                            <Pressable style={styles.reminderAction} onPress={() => openEvent(event.id, 'feed', 'reminders')} accessibilityRole="button">
                              <Text style={styles.reminderActionPrimary}>Ver ficha</Text>
                            </Pressable>
                            <Pressable style={styles.reminderAction} onPress={() => toggleReminder(event.id)} disabled={busy} accessibilityRole="button">
                              <Text style={styles.reminderActionMuted}>Quitar</Text>
                            </Pressable>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptyCard}>
                    <Icon name="bell" size={34} color={colors.accent} strokeWidth={1.8} style={styles.emptyIcon} />
                    <Text style={styles.emptyTitle}>Todavía no marcaste eventos</Text>
                    <Text style={styles.emptyText}>Tocá “Recordarme” en la ficha de un evento para que te avisemos 1 día antes.</Text>
                    <Button title="Ir a Inicio" kind="neutral" onPress={() => goTo('feed')} />
                  </View>
                )}
              </View>
            ) : screen === 'detail' && selectedEvent ? (
              <View>
                <BackPill label={backTarget === 'reminders' ? 'Mis recordatorios' : 'Inicio'} onPress={() => goTo(backTarget)} />
                <Text style={[styles.detailTitle, wide && styles.detailTitleWide]} accessibilityRole="header">{selectedEvent.title}</Text>
                {selectedEvent.demo ? (
                  <Text style={styles.demoWarning}>Este evento es un ejemplo del MVP; no existe una actividad oficial confirmada.</Text>
                ) : null}
                <View style={styles.metaRow}>
                  <View>
                    <Text style={styles.overline}>FECHA Y HORA</Text>
                    <View style={styles.metaValueRow}>
                      <Icon name="calendar" size={18} color={colors.accentDark} />
                      <Text style={[styles.detailValue, wide && styles.detailValueWide]}>{formatShort(selectedEvent.startsAt)}</Text>
                    </View>
                  </View>
                  <View style={styles.metaPlace}>
                    <Text style={styles.overline}>LUGAR</Text>
                    <View style={styles.metaValueRow}>
                      <Icon name="pin" size={18} color={colors.accentDark} />
                      <Text style={[styles.detailValue, styles.detailValueFlex, wide && styles.detailValueWide]}>{selectedEvent.place}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.divider} />
                <View style={styles.actions}>
                  <Button
                    title={selectedReminded ? 'Recordatorio activado' : 'Recordarme'}
                    icon="bell"
                    kind={selectedReminded ? 'success' : 'primary'}
                    style={[styles.actionButton, wide && styles.actionButtonWide]}
                    onPress={() => toggleReminder(selectedEvent.id)}
                    disabled={busy || new Date(selectedEvent.startsAt).getTime() <= Date.now()}
                  />
                  {selectedEvent.registrationUrl ? (
                    <Button
                      title={selectedEvent.demo ? 'Consultar sitio de ejemplo' : 'Inscribirme'}
                      trailingIcon="externalLink"
                      kind="outlined"
                      style={[styles.actionButton, wide && styles.actionButtonWide]}
                      onPress={() => openExternal(selectedEvent.registrationUrl)}
                    />
                  ) : null}
                  <Text style={styles.actionNote}>
                    {selectedEvent.registrationUrl ? 'Al inscribirte, se abre una página externa.' : 'Este evento no tiene un enlace de inscripción informado.'}
                  </Text>
                </View>
                {selectedEvent.images?.length ? (
                  <View style={wide ? styles.carouselWrap : styles.carouselBleed}>
                    <FlyerCarousel images={selectedEvent.images} title={selectedEvent.title} flush={!wide} />
                  </View>
                ) : null}
                <Text style={styles.overline}>DESCRIPCIÓN</Text>
                <Text style={[styles.bodyText, wide && styles.bodyTextWide]}>{selectedEvent.description}</Text>
                {selectedEvent.sourceUrl ? <Button title="Ver publicación de origen" trailingIcon="externalLink" kind="outlined" small onPress={() => openExternal(selectedEvent.sourceUrl)} /> : null}
              </View>
            ) : (
              <View>
                <Text style={[styles.feedTitle, wide && styles.feedTitleWide, !wide && styles.feedInset]} accessibilityRole="header">
                  Eventos de {feedLabel}
                </Text>
                {browseDept ? (
                  <Pressable
                    style={({ pressed }) => [styles.filterRow, !wide && styles.feedInset, pressed && styles.pressed]}
                    onPress={() => selectDepartment(null)}
                    accessibilityRole="button"
                    accessibilityHint="Vuelve a los eventos de tu carrera"
                  >
                    <Icon name="filter" size={16} color={colors.green} />
                    <Text style={styles.filterText}>Estás viendo otro departamento. Tus avisos siguen siendo de tu carrera.</Text>
                    <Text style={styles.filterAction}>Volver</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    style={({ pressed }) => [styles.filterRow, !wide && styles.feedInset, pressed && styles.pressed]}
                    onPress={editProfile}
                    accessibilityRole="button"
                    accessibilityHint="Abre Configuración para cambiar tu carrera"
                  >
                    <Icon name="filter" size={16} color={colors.green} />
                    <Text style={styles.filterText}>
                      Solo eventos de <Text style={styles.filterStrong}>{profile?.career}</Text> y del departamento en general.
                    </Text>
                    <Text style={styles.filterAction}>Cambiar</Text>
                  </Pressable>
                )}
                {browseLoading ? (
                  <ActivityIndicator size="large" color={colors.accent} style={styles.browseSpinner} />
                ) : feedEvents.length ? (
                  <View style={styles.postList}>
                    {feedEvents.map((event, index) => (
                      <PostCard
                        key={event.id}
                        event={event}
                        index={index}
                        flush={!wide}
                        department={config.departments[event.department]?.label || ''}
                        onPress={() => openEvent(event.id)}
                      />
                    ))}
                  </View>
                ) : (
                  <View style={[styles.emptyCard, !wide && styles.feedInset]}>
                    <Icon name="calendar" size={36} color={colors.accent} strokeWidth={1.8} style={styles.emptyIcon} />
                    <Text style={styles.emptyTitle}>{browseDept ? 'Aún no hay eventos en este departamento' : 'Aún no hay eventos para tu carrera'}</Text>
                    <Text style={styles.emptyText}>{browseDept ? 'Cuando se publique una actividad, aparece acá.' : 'Cuando se publique una actividad de tu departamento, te avisamos y aparece acá.'}</Text>
                    {browseDept ? (
                      <Button title="Volver a mi carrera" kind="outlined" onPress={() => selectDepartment(null)} />
                    ) : (
                      <Button title="Configuración" kind="outlined" onPress={editProfile} />
                    )}
                  </View>
                )}
                {!profile?.subscribed ? (
                  <View style={[styles.tipBox, !wide && styles.feedInset]}>
                    <Text style={styles.explainerTitle}>No te pierdas las novedades</Text>
                    <Text style={styles.helpText}>Activá las notificaciones para recibir los avisos.</Text>
                    <Button title="Activar notificaciones" onPress={enableNotifications} disabled={busy} />
                  </View>
                ) : null}
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      {settingsDirty ? (
        <View style={[styles.saveBar, { paddingBottom: 10 + (wide ? insets.bottom : 0) }]}>
          <Button title={busy ? 'Guardando…' : 'Guardar cambios'} icon="check" onPress={saveProfile} disabled={busy || !draft?.career} />
        </View>
      ) : null}

      {drawerOpen && !wide ? (
        <View style={[styles.drawerLayer, { top: insets.top + 56 }]}>
          <Pressable style={styles.drawerScrim} onPress={() => setDrawerOpen(false)} accessibilityRole="button" accessibilityLabel="Cerrar menú" />
          <View style={styles.drawerPanel}>
            <Sidebar {...sidebarProps} style={styles.sidebarFill} />
          </View>
        </View>
      ) : null}

      <Modal visible={welcomeVisible} transparent animationType="fade" onRequestClose={() => finishWelcome(false)}>
        <View style={styles.modalShade}>
          <View style={[styles.modalCard, styles.welcomeCard]}>
            <ScrollView>
              <View style={styles.welcomeBadge}>
                <CheckBadge size={28} color={colors.accentStrong} />
              </View>
              <Text style={styles.welcomeTitle} accessibilityRole="header">¡Último paso!</Text>
              <Text style={styles.welcomeText}>
                Te avisamos de los eventos nuevos de <Text style={styles.welcomeStrong}>{departmentLabel}{profile?.career ? ` · ${profile.career}` : ''}</Text>.
              </Text>
              <View style={styles.welcomeLabelRow}>
                <Icon name="bell" size={18} color={colors.accentDark} />
                <Text style={styles.welcomeLabel}>¿Cada cuánto querés recibir avisos?</Text>
              </View>
              <View style={styles.welcomeOptions}>
                <RadioGroup
                  options={FREQUENCY_OPTIONS}
                  value={welcomeFrequency}
                  onChange={setWelcomeFrequency}
                  columns={wide ? 3 : 1}
                />
              </View>
              <Button title="Activar notificaciones" icon="bell" onPress={() => finishWelcome(true)} disabled={busy} />
              <Button title="Ahora no" kind="ghost" onPress={() => finishWelcome(false)} disabled={busy} />
              <Text style={styles.fine}>Podés cambiarlo cuando quieras en Configuración.</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    flex: { flex: 1 },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, backgroundColor: colors.surface },
    loadingSpinner: { marginTop: 36 },
    loadingText: { marginTop: 12, color: colors.muted, fontSize: 14 },

    // Encabezado: verde oscuro con trama, logo reverso.
    headerWrap: { backgroundColor: colors.headerBg },
    header: { height: 56, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', overflow: 'hidden', backgroundColor: colors.headerBg, borderBottomWidth: 1, borderBottomColor: colors.headerBorder },
    menuButton: { width: 44, height: 44, marginLeft: -12, marginRight: 6, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

    // Estructura de pantallas.
    shell: { flex: 1 },
    shellRow: { flexDirection: 'row' },
    content: { paddingTop: 16, paddingHorizontal: 16, paddingBottom: 48 },
    contentFeed: { paddingTop: 20, paddingHorizontal: 0 },
    contentWide: { paddingTop: 32, paddingHorizontal: 32, paddingBottom: 64 },
    column: { width: '100%', alignSelf: 'center' },
    feedTrama: { position: 'absolute', top: 0, left: 0, right: 0, height: 320 },
    feedInset: { marginHorizontal: 16 },

    // Aviso de error y de confirmación.
    errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, paddingLeft: 16, paddingRight: 6, backgroundColor: colors.redLight },
    errorText: { flex: 1, color: colors.red, fontSize: 13, lineHeight: 18 },
    bannerClose: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    notice: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 16, backgroundColor: colors.greenLight },
    noticeText: { flex: 1, color: colors.green, fontSize: 13, lineHeight: 18, fontWeight: '600' },

    // Sin conexión.
    offlineWrap: { flex: 1, padding: 16, alignItems: 'center', justifyContent: 'center' },
    offlineCard: { width: '100%', maxWidth: 440, alignItems: 'center', padding: 28, borderRadius: 16, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: colors.surface },
    offlineIcon: { marginBottom: 12 },
    offlineTitle: { color: colors.ink, fontSize: 19, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
    offlineText: { color: colors.muted, fontSize: 14, lineHeight: 21, marginBottom: 18, textAlign: 'center' },
    offlineButton: { alignSelf: 'stretch', marginTop: 0 },

    // Onboarding.
    onboarding: { flex: 1 },
    onboardingWide: { flexDirection: 'row' },
    photo: { height: 160, overflow: 'hidden', backgroundColor: colors.border },
    photoWide: { height: 'auto', flex: 45 },
    photoImage: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
    onboardingForm: { flex: 1 },
    onboardingFormWide: { flex: 55 },
    onboardingScroll: { padding: 20, paddingHorizontal: 16 },
    onboardingScrollWide: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 },
    card: { width: '100%', padding: 22, paddingHorizontal: 20, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
    cardWide: { maxWidth: 420, paddingVertical: 36, paddingHorizontal: 32, shadowColor: '#101828', shadowOpacity: 0.06, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 2 },
    cardLogo: { alignItems: 'center', marginBottom: 16 },
    subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22, textAlign: 'center', marginBottom: 20 },
    subtitleWide: { marginBottom: 28 },
    buttonLarge: { minHeight: 50, marginTop: 4 },

    // Campos y selectores.
    field: { marginBottom: 16 },
    fieldDisabled: { opacity: 0.45 },
    panelIntro: { marginBottom: 14 },
    label: { color: colors.ink, fontSize: 13, fontWeight: '700', marginBottom: 8 },
    select: { minHeight: 48, paddingHorizontal: 13, borderRadius: 10, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface },
    selectText: { flex: 1, color: colors.ink, fontSize: 14 },
    selectArrow: { marginLeft: 8 },
    modalShade: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: colors.shade },
    modalCard: { width: '100%', maxWidth: 440, maxHeight: '82%', padding: 20, borderRadius: 20, backgroundColor: colors.surface },
    modalTitle: { color: colors.ink, fontSize: 20, fontWeight: '800', marginBottom: 10 },
    option: { minHeight: 48, paddingHorizontal: 10, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    optionActive: { backgroundColor: colors.accentSoft },
    optionText: { flex: 1, color: colors.ink, fontSize: 14, paddingVertical: 10 },
    optionSelected: { color: colors.accentDark, fontWeight: '700' },
    optionCheck: { paddingLeft: 12 },

    // Botones.
    button: { minHeight: 48, paddingHorizontal: 16, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
    button_primary: { backgroundColor: colors.accentStrong },
    button_outlined: { borderWidth: 1, borderColor: colors.accent, backgroundColor: colors.surface },
    button_neutral: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
    button_ghost: { backgroundColor: 'transparent' },
    button_success: { backgroundColor: colors.greenLight },
    buttonDisabled: { opacity: 0.55 },
    buttonSmall: { minHeight: 44, alignSelf: 'flex-start', paddingHorizontal: 14, marginTop: 10 },
    buttonContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    buttonText: { fontSize: 15, fontWeight: '700' },
    buttonText_primary: { color: colors.onAccent },
    buttonText_outlined: { color: colors.accent },
    buttonText_neutral: { color: colors.ink },
    buttonText_ghost: { color: colors.muted },
    buttonText_success: { color: colors.green },
    buttonTextSmall: { fontSize: 13 },
    pressed: { opacity: 0.82 },
    fine: { color: colors.muted, fontSize: 12, textAlign: 'center', lineHeight: 18, marginTop: 14 },

    // Textos comunes.
    helpText: { color: colors.muted, fontSize: 13, lineHeight: 19 },
    explainerTitle: { color: colors.ink, fontSize: 14, fontWeight: '700', marginBottom: 4 },
    overline: { color: colors.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
    pageTitle: { color: colors.ink, fontSize: 24, lineHeight: 30, fontWeight: '800', letterSpacing: -0.5, marginBottom: 6 },
    pageTitleWide: { fontSize: 30, lineHeight: 38, letterSpacing: -0.7 },
    lead: { color: colors.muted, fontSize: 14, lineHeight: 21, marginBottom: 18 },
    leadWide: { fontSize: 15, lineHeight: 22, marginBottom: 22 },
    bodyText: { color: colors.ink, fontSize: 15, lineHeight: 23, marginBottom: 14 },
    bodyTextWide: { fontSize: 16, lineHeight: 26 },
    divider: { height: 1, backgroundColor: colors.border, marginVertical: 18 },

    // Volver.
    backPill: { alignSelf: 'flex-start', minHeight: 36, paddingHorizontal: 14, marginBottom: 16, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: 6 },
    backPillText: { color: colors.textSecondary, fontSize: 13, fontWeight: '700' },

    // Inicio.
    feedTitle: { color: colors.ink, fontSize: 20, lineHeight: 26, fontWeight: '800', letterSpacing: -0.3, marginBottom: 16 },
    feedTitleWide: { fontSize: 22, lineHeight: 28, marginBottom: 18 },
    filterRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, marginBottom: 16, borderRadius: 12, backgroundColor: colors.greenLight },
    filterText: { flex: 1, color: colors.ink, fontSize: 13, lineHeight: 19 },
    filterStrong: { fontWeight: '700' },
    filterAction: { color: colors.green, fontSize: 13, fontWeight: '800' },
    postList: { gap: 16 },
    postCard: { overflow: 'hidden', borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
    postCardFlush: { borderRadius: 0, borderLeftWidth: 0, borderRightWidth: 0 },
    postHead: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 14, paddingHorizontal: 16 },
    postAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft },
    postAvatarText: { color: colors.accent, fontSize: 13, fontWeight: '800' },
    postHeadCopy: { flex: 1 },
    postPage: { color: colors.ink, fontSize: 14, fontWeight: '700' },
    postTime: { color: colors.muted, fontSize: 12, marginTop: 2 },
    postBody: { paddingTop: 12, paddingHorizontal: 16 },
    postTitle: { color: colors.ink, fontSize: 17, lineHeight: 23, fontWeight: '800', marginBottom: 4 },
    postSub: { color: colors.accent, fontSize: 13, lineHeight: 19, fontWeight: '700', marginBottom: 8 },
    postDescription: { color: colors.muted, fontSize: 14, lineHeight: 21, marginBottom: 12 },
    postImage: { height: 150, alignItems: 'center', justifyContent: 'center' },
    postChip: { position: 'absolute', top: 10, left: 10, overflow: 'hidden', color: colors.ink, backgroundColor: colors.chip, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 5, fontSize: 9, fontWeight: '800', letterSpacing: 0.4 },
    postFooter: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderTopWidth: 1, borderTopColor: colors.borderSoft },
    postFooterText: { color: colors.accent, fontSize: 14, fontWeight: '800' },
    emptyCard: { alignItems: 'center', padding: 28, paddingHorizontal: 20, borderRadius: 16, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: colors.surface },
    emptyIcon: { marginBottom: 12 },
    emptyTitle: { color: colors.ink, fontSize: 17, fontWeight: '800', marginBottom: 6, textAlign: 'center' },
    emptyText: { color: colors.muted, fontSize: 13, lineHeight: 19, marginBottom: 8, textAlign: 'center' },
    tipBox: { padding: 16, borderRadius: 15, backgroundColor: colors.accentSoft, marginTop: 16 },

    // Barra lateral (escritorio).
    sidebar: { width: 300, backgroundColor: colors.sidebarBg, borderRightWidth: 1, borderRightColor: colors.sidebarBorder },
    sidebarFill: { width: '100%', borderRightWidth: 0 },
    sidebarContent: { flexGrow: 1, paddingTop: 18, paddingBottom: 12 },
    sidebarLabelSpaced: { marginTop: 22, marginBottom: 6 },
    sidebarOwn: { marginHorizontal: 10, padding: 12, paddingLeft: 14, gap: 3, borderRadius: 10, borderWidth: 1, borderColor: colors.sidebarBorder, backgroundColor: colors.sidebarLinkBg },
    sidebarOther: { minHeight: 44, marginHorizontal: 10, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, justifyContent: 'center' },
    sidebarOtherText: { color: colors.ink, fontSize: 13, lineHeight: 18 },
    sidebarLabel: { paddingHorizontal: 18, marginBottom: 8, color: colors.accentDark, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
    sidebarCurrent: { marginHorizontal: 10, padding: 12, paddingLeft: 11, gap: 3, borderLeftWidth: 3, borderLeftColor: colors.accentDark, borderTopRightRadius: 10, borderBottomRightRadius: 10, backgroundColor: colors.surface, shadowColor: '#101828', shadowOpacity: 0.06, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
    sidebarDepartment: { color: colors.ink, fontSize: 13, lineHeight: 18, fontWeight: '800' },
    sidebarCareer: { color: colors.accentDark, fontSize: 13, lineHeight: 18, fontWeight: '700' },
    sidebarLink: { minHeight: 48, marginHorizontal: 10, marginTop: 8, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: colors.sidebarBorder, backgroundColor: colors.sidebarLinkBg, flexDirection: 'row', alignItems: 'center', gap: 10 },
    sidebarLinkPlain: { minHeight: 48, marginHorizontal: 10, paddingHorizontal: 14, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
    sidebarLinkText: { color: colors.ink, fontSize: 14, fontWeight: '700' },
    sidebarSpacer: { flex: 1, minHeight: 16 },
    sidebarFooter: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.sidebarBorder },

    // Ficha del evento.
    detailTitle: { color: colors.ink, fontSize: 27, lineHeight: 34, fontWeight: '800', letterSpacing: -0.6, marginBottom: 16 },
    detailTitleWide: { fontSize: 34, lineHeight: 42, letterSpacing: -0.8, marginBottom: 18 },
    demoWarning: { color: colors.amber, backgroundColor: colors.amberLight, padding: 12, borderRadius: 10, marginBottom: 16, fontSize: 13, lineHeight: 19 },
    metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 24 },
    metaPlace: { flexShrink: 1 },
    metaValueRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    detailValue: { color: colors.ink, fontSize: 15, lineHeight: 22, fontWeight: '600' },
    detailValueWide: { fontSize: 16 },
    detailValueFlex: { flexShrink: 1 },
    actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18 },
    actionButton: { flex: 1, marginTop: 0, paddingHorizontal: 12 },
    actionButtonWide: { flexGrow: 0, flexShrink: 0, flexBasis: 'auto', paddingHorizontal: 20 },
    actionNote: { width: '100%', color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center' },

    // Mis recordatorios.
    warningBox: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, marginBottom: 14, borderRadius: 14, backgroundColor: colors.amberLight },
    permissionIcon: { marginRight: 10 },
    timeline: { paddingLeft: 36, gap: 16 },
    timelineLine: { position: 'absolute', left: 10, top: 20, bottom: 20, width: 2, borderRadius: 1, backgroundColor: colors.timeline },
    reminderCard: { paddingTop: 16, paddingHorizontal: 16, paddingBottom: 6, borderRadius: 16, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: colors.surface },
    timelineDot: { position: 'absolute', left: -36, top: 18, width: 22, height: 22, borderRadius: 11, borderWidth: 4, borderColor: colors.accentDark, backgroundColor: colors.surface },
    cardTitle: { color: colors.ink, fontSize: 17, lineHeight: 23, fontWeight: '800', marginBottom: 4 },
    reminderSub: { color: colors.accent, fontSize: 13, lineHeight: 19, fontWeight: '700', marginBottom: 10 },
    reminderFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingTop: 4, borderTopWidth: 1, borderTopColor: colors.borderSoft },
    reminderWhen: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
    reminderWhenText: { color: colors.green, fontSize: 13, fontWeight: '700' },
    reminderActions: { flexDirection: 'row' },
    reminderAction: { minHeight: 44, paddingHorizontal: 10, justifyContent: 'center' },
    reminderActionPrimary: { color: colors.accent, fontSize: 13, fontWeight: '800' },
    reminderActionMuted: { color: colors.muted, fontSize: 13, fontWeight: '700' },

    // Configuración.
    section: { padding: 18, paddingTop: 12, marginBottom: 14, borderRadius: 16, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: colors.surface },
    sectionWide: { paddingHorizontal: 28, paddingBottom: 24, marginBottom: 16, borderRadius: 18 },
    sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    sectionHeadText: { color: colors.ink, fontSize: 16, fontWeight: '800', flexShrink: 1 },
    sectionIntroGap: { marginTop: 4 },
    fieldsRow: { flexDirection: 'row', gap: 16 },
    radioNarrow: { maxWidth: 320 },
    toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 12 },
    toggleCopy: { flex: 1 },
    switchHit: { width: 52, height: 44 },
    switchTrack: { position: 'absolute', left: 2, top: 10, width: 48, height: 24, borderRadius: 12 },
    switchThumb: { position: 'absolute', top: 12, width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFFFFF', shadowColor: '#101828', shadowOpacity: 0.3, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
    radioGroup: { gap: 8 },
    radioGroupRow: { flexDirection: 'row' },
    radio: { minHeight: 44, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, justifyContent: 'center' },
    radioFlex: { flex: 1, alignItems: 'center', paddingHorizontal: 10 },
    radioActive: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
    radioText: { color: colors.ink, fontSize: 14 },
    radioTextActive: { color: colors.accentDark, fontWeight: '700' },
    permissionBox: { flexDirection: 'row', alignItems: 'flex-start', padding: 13, marginTop: 14, borderRadius: 12, backgroundColor: colors.accentSoft },
    saveBar: { paddingHorizontal: 16, paddingTop: 2, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.background },

    // Bienvenida.
    welcomeCard: { paddingTop: 24, paddingHorizontal: 22, paddingBottom: 16 },
    welcomeBadge: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft, marginBottom: 14 },
    welcomeTitle: { color: colors.ink, fontSize: 20, fontWeight: '800', marginBottom: 6 },
    welcomeText: { color: colors.textSecondary, fontSize: 15, lineHeight: 22, marginBottom: 18 },
    welcomeStrong: { color: colors.ink, fontWeight: '700' },
    welcomeLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    welcomeLabel: { color: colors.ink, fontSize: 13, fontWeight: '700', flexShrink: 1 },
    welcomeOptions: { marginBottom: 10 },

    // Cajón de departamentos (mobile).
    drawerLayer: { position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 20, elevation: 20 },
    drawerScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.shade },
    drawerPanel: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 300, maxWidth: '88%', backgroundColor: colors.sidebarBg, shadowColor: '#101828', shadowOpacity: 0.2, shadowRadius: 18, shadowOffset: { width: 4, height: 0 }, elevation: 24 },

    // Imágenes del evento.
    postPhoto: { width: '100%', backgroundColor: colors.border },
    browseSpinner: { marginVertical: 40 },
    carouselWrap: { alignSelf: 'center', width: '100%', maxWidth: 560, marginBottom: 28 },
    carouselBleed: { marginHorizontal: -16, marginBottom: 20 },
    carousel: { gap: 10 },
    carouselFrame: { width: '100%', aspectRatio: 4 / 5, overflow: 'hidden', borderRadius: 14, backgroundColor: colors.border },
    carouselFrameFlush: { borderRadius: 0 },
    carouselCounter: { position: 'absolute', top: 12, right: 12, overflow: 'hidden', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, backgroundColor: 'rgba(16,24,40,0.7)', color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
    carouselArrow: { position: 'absolute', top: '50%', marginTop: -20, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.92)', shadowColor: '#101828', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
    carouselPrev: { left: 10 },
    carouselNext: { right: 10 },
    carouselDots: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
    carouselDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.trackOff },
    carouselDotActive: { backgroundColor: colors.accentDark },
  });
}

