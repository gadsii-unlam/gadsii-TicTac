const root = document.getElementById('root');
const toastEl = document.getElementById('toast');
const state = {
  config: null, profile: null, events: [], reminders: [], screen: 'onboarding',
  currentId: null, pending: new URLSearchParams(location.search).get('evento'),
  pendingSource: new URLSearchParams(location.search).get('origen') === 'push' ? 'push' : 'feed',
  permissionModal: false, busy: false, error: '',
  deviceId: localStorage.getItem('nodo_device_id') || crypto.randomUUID()
};
localStorage.setItem('nodo_device_id',state.deviceId);
const q = obj => new URLSearchParams(obj).toString();
const request = async (path, opts={}) => {
  const res = await fetch(path, { ...opts, headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) } });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
};
const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtDate = iso => new Intl.DateTimeFormat('es-AR',{weekday:'long',day:'numeric',month:'long',hour:'2-digit',minute:'2-digit',timeZone:'America/Argentina/Buenos_Aires'}).format(new Date(iso));
const fmtShort = iso => new Intl.DateTimeFormat('es-AR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',timeZone:'America/Argentina/Buenos_Aires'}).format(new Date(iso));
const upcoming = iso => new Date(iso).getTime() > Date.now();
const icon = name => ({ calendar:'▦', place:'⌖', bell:'♧', arrow:'↗', back:'←', adjust:'⚙', check:'✓', book:'▤' }[name] || '•');
const category = p => state.config?.departments[p.department]?.label || '';
function flash(message) { toastEl.textContent = message; toastEl.hidden = false; setTimeout(()=>toastEl.hidden=true,4200); }
const pushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
function render() {
  if (!state.config) return;
  root.innerHTML = state.screen === 'onboarding' ? onboarding() : shell();
  if (state.permissionModal && state.profile) root.insertAdjacentHTML('beforeend', notificationModal());
}
function optionsDepartments(selected) {
  return Object.entries(state.config.departments).map(([key,dept]) => `<option value="${esc(key)}" ${key===selected?'selected':''}>${esc(dept.label)}</option>`).join('');
}
function optionsCareers(department,selected) {
  return (state.config.departments[department]?.careers || []).map(c=>`<option value="${esc(c)}" ${c===selected?'selected':''}>${esc(c)}</option>`).join('');
}
function onboarding() {
  const defaultDept = state.config.departments.diit ? 'diit' : Object.keys(state.config.departments)[0];
  return `<div class="onboarding-layout"><section class="onboarding-panel">
    <div class="brand large"><img src="/logo.svg" width="50" height="50" alt=""><span>Nodo <strong>UNLaM</strong></span></div>
    <div class="step-label">Bienvenido/a · Paso único</div>
    <h1>Las oportunidades de tu carrera, <span>sin tener que buscarlas.</span></h1>
    <p class="lead">Elegí qué estudiás y enterate de charlas, jornadas y talleres relevantes para vos.</p>
    <form id="onboarding-form" class="form-box">
      <label for="department">Tu departamento</label>
      <select required id="department" name="department">${optionsDepartments(defaultDept)}</select>
      <label for="career">Tu carrera</label>
      <select required id="career" name="career">${optionsCareers(defaultDept)}</select>
      <div class="explainer"><span class="symbol">${icon('bell')}</span><div><strong>Solo avisos de tu carrera</strong><p>Vas a poder elegir la frecuencia y cambiar estas preferencias cuando quieras.</p></div></div>
      <button class="btn primary full" type="submit">Ver eventos de mi carrera <span>→</span></button>
      <p class="fine">No necesitás crear una cuenta ni ingresar datos institucionales.</p>
    </form>
  </section><aside class="welcome-art"><div class="orbit orbit-one"></div><div class="orbit orbit-two"></div>
    <div class="quote-card"><span>PRÓXIMAMENTE</span><strong>Tu próxima gran idea puede empezar en una charla.</strong><small>Eventos, fechas y oportunidades en un solo lugar.</small></div>
    <div class="big-circle">N<span>·</span></div></aside></div>`;
}
function shell() {
  const p=state.profile;
  return `<div class="app-shell"><aside class="sidebar">
    <a href="/" class="brand brand-side" data-action="home"><img src="/logo.svg" alt="" width="36" height="36"><span>Nodo <strong>UNLaM</strong></span></a>
    <div class="side-caption">MI ESPACIO</div>
    <button class="nav-link ${state.screen==='feed'?'active':''}" data-action="home"><span>${icon('book')}</span> Descubrir eventos</button>
    <button class="nav-link ${state.screen==='settings'?'active':''}" data-action="settings"><span>${icon('adjust')}</span> Configuración</button>
    <div class="sidebar-bottom"><small>MI CARRERA</small><strong>${esc(p.career)}</strong><span>${esc(category(p))}</span></div>
    <p class="demo-note">MVP · Datos iniciales de demostración. Verificá en canales oficiales.</p>
  </aside>
  <div class="main-col"><header class="topbar"><button class="mobile-brand brand" data-action="home"><img src="/logo.svg" width="31" alt=""><span>Nodo <strong>UNLaM</strong></span></button>
    <div class="topbar-label">${esc(p.career)}</div><button class="pill-control" data-action="settings" title="Configurar alertas">${icon('adjust')} <span>Mis alertas</span></button></header>
    <main class="page">${state.screen==='detail'?detail():state.screen==='settings'?settings():feed()}</main>
    <nav class="bottom-nav" aria-label="Navegación"><button class="${state.screen==='feed'||state.screen==='detail'?'active':''}" data-action="home"><span>${icon('book')}</span>Eventos</button><button class="${state.screen==='settings'?'active':''}" data-action="settings"><span>${icon('adjust')}</span>Configuración</button></nav>
  </div></div>`;
}
function feed() {
  const p=state.profile;
  return `<div class="eyebrow">TU AGENDA ACADÉMICA</div><div class="head-flex"><div><h1>Descubrí lo que viene<span class="period">.</span></h1><p class="lead small">Charlas, talleres y encuentros de ${esc(category(p))}.</p></div><div class="count"><strong>${state.events.length}</strong><span>eventos</span></div></div>
    <div class="section-head"><h2>Próximos eventos</h2><span class="soft-tag">${icon('check')} Filtrados para vos</span></div>
    <div class="cards">${state.events.length ? state.events.map((e,i)=>card(e,i)).join('') : `<div class="empty"><div>▤</div><h3>Aún no hay eventos para tu carrera</h3><p>Cuando se publique uno que te corresponda, aparecerá acá y podrás recibir un aviso según tus preferencias.</p><button class="btn outlined" data-action="settings">Revisar mis alertas</button></div>`}</div>
    <div class="tipbar"><span>✦</span><div><strong>No te pierdas las novedades</strong><p>Activá las notificaciones para que los eventos lleguen a vos.</p></div><button data-action="activate">Activar avisos →</button></div>`;
}
function card(e,i) {
  const palette=['indigo','mint','gold','rose'];
  const klass=palette[i%palette.length];
  return `<article class="event-card" data-action="event" data-id="${esc(e.id)}" tabindex="0" role="link" aria-label="Abrir ficha de ${esc(e.title)}">
    <div class="event-cover ${klass}"><div class="cover-design"><span>UNLaM</span><b>${i%2?'CONOCIMIENTO':'EXPERIENCIAS'}</b></div><span class="event-chip">${e.demo?'DEMO · EVENTO FICTICIO':'EVENTO ACADÉMICO'}</span><span class="cover-spark">✳</span></div>
    <div class="event-content"><span class="event-dept">${esc(category({department:e.department}))}</span>
      <h3>${esc(e.title)}</h3><p class="event-summary">${esc(e.description)}</p>
      <div class="event-meta"><span>${icon('calendar')} ${esc(fmtShort(e.startsAt))}</span><span>${icon('place')} ${esc(e.place)}</span></div>
      <div class="event-foot"><span>Ver ficha completa</span><span class="arrow-circle">→</span></div>
    </div></article>`;
}
function detail() {
  const e=state.events.find(x=>x.id===state.currentId);
  if (!e) return `<button class="back-link" data-action="home">← Volver</button><div class="empty"><h2>Este evento no está disponible</h2><p>Puede no pertenecer a tu carrera actual.</p></div>`;
  const remembered = state.reminders.includes(e.id);
  const remaining=(new Date(e.startsAt).getTime()-Date.now())/3600000;
  return `<button class="back-link" data-action="home">← Volver a Inicio</button>
    <div class="detail-grid"><section class="detail-main"><span class="eyebrow">${esc(category({department:e.department}))}</span>
    <h1>${esc(e.title)}</h1>
    ${e.demo?'<p class="demo-alert">Este evento es un ejemplo del MVP; no existe una actividad oficial confirmada.</p>':''}
    <div class="detail-meta"><div><span class="meta-icon">${icon('calendar')}</span><div><small>FECHA Y HORA</small><strong>${esc(fmtDate(e.startsAt))}</strong></div></div>
    <div><span class="meta-icon">${icon('place')}</span><div><small>LUGAR</small><strong>${esc(e.place)}</strong></div></div></div>
    <div class="detail-visual"><span>NODO UNLaM</span><b>Aprender también pasa fuera del aula.</b><div>✳</div></div>
    <h2>Acerca de este evento</h2><p class="description">${esc(e.description)}</p>
    <h3>Información para participar</h3><p class="description">${e.registrationUrl?'Podés consultar el enlace de inscripción o información externa.':'Este evento no tiene un enlace de inscripción informado.'}</p>
    ${e.sourceUrl?`<p class="source-link">Fuente: <a href="${esc(e.sourceUrl)}" target="_blank" rel="noopener noreferrer">Ver publicación de origen ${icon('arrow')}</a></p>`:''}
    </section><aside class="action-panel"><h3>¿Te interesa participar?</h3><p>Guardá un recordatorio o consultá el enlace externo si el evento lo requiere.</p>
      <button class="btn ${remembered?'success':'primary'} full" data-action="reminder" data-id="${esc(e.id)}" ${remaining<=0?'disabled':''}>${remembered?'✓ Recordatorio activado':'♧ Recordarme'}</button>
      <p class="action-explain">${remembered?'Te enviaremos un aviso dentro de las 24 h anteriores al evento.':remaining > 0?'Te avisamos 1 día antes del evento.':'Este evento ya comenzó.'}</p>
      ${e.registrationUrl?`<a class="btn outlined full" href="${esc(e.registrationUrl)}" target="_blank" rel="noopener noreferrer">${e.demo?'Consultar sitio de ejemplo':'Ir a inscripción externa'} ↗</a>`:''}
      <p class="external-note">${e.registrationUrl?'La inscripción se realiza fuera de Nodo UNLaM.':'Por ahora no se indicó inscripción.'}</p>
    </aside></div>`;
}
function settings() {
  const p = state.profile;
  const permission = !pushSupported() ? 'No compatible en este navegador' : Notification.permission==='granted' && p.subscribed ? 'Permiso concedido y suscripción activa' :
    Notification.permission==='denied'?'Permiso bloqueado en el navegador':'Notificaciones sin activar';
  return `<div class="eyebrow">TUS PREFERENCIAS</div><h1>Configuración<span class="period">.</span></h1>
    <p class="lead small">Elegí qué eventos te interesan y cómo querés enterarte.</p><div class="settings-panel">
    <h2>Mi carrera</h2><p>Podés cambiar tu carrera cuando quieras. Los eventos y alertas se actualizan según tu selección.</p>
    <form id="profile-form"><div class="form-columns"><div><label for="department">Departamento</label><select id="department" name="department">${optionsDepartments(p.department)}</select></div>
    <div><label for="career">Carrera</label><select id="career" name="career">${optionsCareers(p.department,p.career)}</select></div></div>
    <h2>Notificaciones</h2><label class="toggle-row"><span><strong>Notificarme nuevos eventos</strong><small>Solo recibís avisos que correspondan a tu departamento y carrera.</small></span><input type="checkbox" name="alerts" ${p.alerts?'checked':''}></label>
    <label for="frequency">¿Con qué frecuencia?</label><select id="frequency" name="frequency">
      <option value="instantanea" ${p.frequency==='instantanea'?'selected':''}>Cada evento nuevo</option><option value="diaria" ${p.frequency==='diaria'?'selected':''}>Resumen diario</option>
      <option value="semanal" ${p.frequency==='semanal'?'selected':''}>Resumen semanal</option></select>
    <div class="remind-separator"></div><label class="toggle-row"><span><strong>Recordarme revisar la app</strong><small>Un aviso adicional para explorar eventos, aunque no haya novedades. Independiente de los recordatorios marcados en cada ficha.</small></span><input type="checkbox" name="explore" ${p.explore?'checked':''}></label>
    <label for="exploreFrequency">Frecuencia del aviso para revisar</label><select id="exploreFrequency" name="exploreFrequency">
      <option value="semanal" ${p.exploreFrequency==='semanal'?'selected':''}>Semanal</option><option value="diaria" ${p.exploreFrequency==='diaria'?'selected':''}>Diaria</option></select>
    <div class="permission-info"><span>♧</span><div><strong>Estado del dispositivo</strong><p>${esc(permission)}. Para que lleguen avisos con la aplicación cerrada, necesitás habilitar los permisos y mantener el servidor activo.</p><button type="button" class="text-link" data-action="activate">Comprobar / activar notificaciones →</button></div></div>
    <button class="btn primary" type="submit">Guardar cambios</button></form></div>`;
}
function notificationModal() {
  return `<div class="modal-layer"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div class="modal-icon">♧</div><h2 id="modal-title">Que los eventos lleguen a vos</h2>
      <p>Podés recibir alertas sobre nuevos eventos de <strong>${esc(state.profile.career)}</strong>, sin tener que entrar a buscarlos.</p>
      <p class="fine">Te avisaremos según la frecuencia que elijas en Configuración. El navegador te pedirá permiso.</p>
      <button class="btn primary full" data-action="permission">Activar notificaciones</button>
      <button class="btn ghost full" data-action="later">Ahora no</button>
    </div></div>`;
}
async function loadProfile() {
  const data = await request(`/api/profile?${q({deviceId:state.deviceId})}`);
  state.profile=data.profile;
  if (!state.profile) { state.screen='onboarding'; return; }
  await refreshData();
  if (state.pending) await openEvent(state.pending, state.pendingSource,false);
  else state.screen='feed';
}
async function refreshData() {
  if (!state.profile) return;
  const [events,reminders] = await Promise.all([
    request(`/api/events?${q({deviceId:state.deviceId})}`),request(`/api/reminders?${q({deviceId:state.deviceId})}`)
  ]);
  state.events=events.events; state.reminders=reminders.eventIds;
}
async function saveProfile(form) {
  const data=Object.fromEntries(new FormData(form));
  const existing=state.profile || {};
  const body={ deviceId:state.deviceId,department:data.department,career:data.career,
    frequency:data.frequency || existing.frequency || 'instantanea',alerts:!state.profile || Boolean(form.elements.alerts?.checked),
    explore:Boolean(form.elements.explore?.checked),exploreFrequency:data.exploreFrequency || existing.exploreFrequency || 'semanal' };
  const result=await request('/api/profile',{method:'PUT',body:JSON.stringify(body)});
  state.profile=result.profile;
  await refreshData();
  state.screen=state.screen==='onboarding'?'feed':'settings';
  if (!existing.deviceId) state.permissionModal=true;
  flash('Tus preferencias quedaron guardadas');render();
}
async function openEvent(id,source='feed',updateUrl=true) {
  const found=state.events.find(e=>e.id===id);
  if (!found) { state.screen='feed'; state.currentId=null; flash('Este evento no está disponible para tu carrera.');return; }
  state.currentId=id;state.screen='detail';state.pending=null;
  if (updateUrl) history.pushState({eventId:id},'',`/?evento=${encodeURIComponent(id)}${source==='push'?'&origen=push':''}`);
  await request('/api/analytics/open',{method:'POST',body:JSON.stringify({deviceId:state.deviceId,eventId:id,source})});
}
async function subscribePush() {
  if (!pushSupported()) throw new Error('Este navegador no permite notificaciones push. Usá Chrome/Edge en Android o instalá la app en la pantalla de inicio en iOS 16.4+.');
  const reg = await navigator.serviceWorker.ready;
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('No se habilitaron las notificaciones. Podés activarlas luego desde el navegador.');
  const bytes=Uint8Array.from(atob(state.config.vapidPublicKey.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
  let subscription = await reg.pushManager.getSubscription();
  if (!subscription) subscription = await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:bytes});
  await request('/api/subscribe',{method:'POST',body:JSON.stringify({deviceId:state.deviceId,subscription:subscription.toJSON()})});
  state.profile.subscribed=true;state.permissionModal=false;
  flash('Avisos activados. ¡Vas a enterarte de los nuevos eventos!');render();
}
async function action(node) {
  if (state.busy) return;
  const op=node?.dataset?.action;
  if (!op) return;
  try {
    state.busy=true;
    if (op==='home') { state.screen='feed'; state.currentId=null; history.pushState({},'','/');render(); }
    if (op==='settings') { state.screen='settings';state.currentId=null;history.pushState({},'','/');render(); }
    if (op==='event') {await openEvent(node.dataset.id);render();scrollTo({top:0,behavior:'instant'});}
    if (op==='later') {state.permissionModal=false;render();}
    if (op==='activate') {state.permissionModal=true;render();}
    if (op==='permission') await subscribePush();
    if (op==='reminder') {
      const enabled=!state.reminders.includes(node.dataset.id);
      if (enabled && !state.profile.subscribed) {state.permissionModal=true;render();flash('Para recibir el recordatorio, primero activá los avisos.');return;}
      await request('/api/reminder',{method:'POST',body:JSON.stringify({deviceId:state.deviceId,eventId:node.dataset.id,enabled})});
      await refreshData();render();flash(enabled?'Te avisaremos un día antes':'Recordatorio desactivado');
    }
  } catch(err){flash(err.message);} finally {state.busy=false;}
}
document.addEventListener('click', e => {
  const target=e.target.closest('[data-action]');
  if (target) { e.preventDefault();action(target); }
});
document.addEventListener('keydown',e=>{
  if ((e.key==='Enter'||e.key===' ') && e.target.matches('[role="link"][data-action]')) {e.preventDefault();action(e.target);}
});
document.addEventListener('change',e=>{
  if(e.target.id==='department') {
    const careers=e.target.form.querySelector('#career');
    if(careers) careers.innerHTML=optionsCareers(e.target.value);
  }
});
document.addEventListener('submit',async e=>{
  if(!['onboarding-form','profile-form'].includes(e.target.id))return;
  e.preventDefault();if(state.busy)return;
  try {state.busy=true;await saveProfile(e.target);}catch(err){flash(err.message);}finally{state.busy=false;}
});
window.addEventListener('popstate',async()=>{
  if (!state.profile) return;
  const id = new URLSearchParams(location.search).get('evento');
  if (id) await openEvent(id,'feed',false);
  else {state.screen='feed';state.currentId=null;}
  render();
});
window.addEventListener('focus',async()=>{if(state.profile){try{await refreshData();render();}catch{}}});
if('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message',async e=>{
  if(e.data?.type==='REFRESH') {await refreshData();render();}
});
(async()=>{
  try {
    state.config=await request('/api/config');
    if('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(console.warn);
    await loadProfile();render();
  }catch(err){root.innerHTML=`<div class="boot"><h1>No se pudo iniciar Nodo UNLaM</h1><p>${esc(err.message)}</p><button class="btn primary" onclick="location.reload()">Reintentar</button></div>`;}
})();
