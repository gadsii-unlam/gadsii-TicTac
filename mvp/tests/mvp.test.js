import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { createStore } from '../src/server/store.js';
import { matches, dueBucket, hoursBefore } from '../src/server/catalog.js';
import { encryptPayload, loadVapid, sendPush } from '../src/server/push.js';
import { makeScheduler } from '../src/server/scheduler.js';

function tempStore() {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'nodo-test-'));
  return { dir, store:createStore({file:path.join(dir,'db.json'),fresh:true}) };
}
const profile = { department:'diit',career:'Ingeniería en Informática', frequency:'instantanea',alerts:true,explore:false,exploreFrequency:'semanal' };
const device='dispositivo_test_0001';
const subscription={endpoint:'https://fcm.googleapis.com/fcm/send/fake',keys:{p256dh:'test',auth:'test'}};

test('perfil, filtro por carrera y cambios de preferencia',()=>{
  const {store}=tempStore();
  assert.equal(store.eventsFor(device).length,0);
  store.updateProfile(device,profile);
  const original=store.eventsFor(device);
  assert.equal(original.length,3);
  assert.ok(original.every(e=>e.department==='diit'));
  store.updateProfile(device,{...profile,department:'humanidades',career:'Comunicación Social'});
  assert.equal(store.eventsFor(device).length,1);
  assert.ok(store.eventsFor(device).every(e=>e.department==='humanidades'));
  assert.throws(()=>store.updateProfile(device,{...profile,career:'Carrera inventada'}),/inválida/);
  assert.ok(!matches(original[0],store.profileFor(device)));
});

test('ingesta manual validada publica, segmenta y guarda ficha completa',()=>{
  const {store,dir}=tempStore();
  store.updateProfile(device,profile);
  store.attachSubscription(device,subscription);
  const other='dispositivo_test_0002';
  store.updateProfile(other,{...profile,department:'economicas',career:'Administración'});
  store.attachSubscription(other,subscription);
  const data={title:'Nueva charla de redes',department:'diit',career:'Ingeniería en Informática',
    startsAt:new Date(Date.now()+10*86400000).toISOString(),place:'Aula 12',description:'Aprendé a configurar redes y proyectos',
    sourceUrl:'https://www.unlam.edu.ar/',sourcePublishedAt:new Date().toISOString(),reviewed:true,registrationUrl:null};
  assert.throws(()=>store.addEvent({...data,reviewed:false}),/inválido/);
  const event=store.addEvent(data);
  assert.ok(store.eventsFor(device).some(e=>e.id===event.id));
  assert.ok(!store.eventsFor(other).some(e=>e.id===event.id));
  assert.equal(store.data.queued.filter(e=>e.eventId===event.id).length,1);
  assert.ok(fs.existsSync(path.join(dir,'db.json')));
});

test('recordatorio y apertura distinguen push de Inicio',()=>{
  const {store}=tempStore();store.updateProfile(device,profile);
  const event=store.eventsFor(device)[0];
  store.markReminder(device,event.id,true);
  assert.equal(store.data.reminders.length,1);
  assert.equal(store.trackOpen(device,event.id,'push'),true);
  assert.equal(store.trackOpen(device,event.id,'feed'),true);
  assert.deepEqual(store.data.opens.map(o=>o.source),['push','feed']);
  store.markReminder(device,event.id,false);assert.equal(store.data.reminders.length,0);
});

test('scheduler envía automáticamente al evento nuevo y no a otras carreras',async()=>{
  const {store}=tempStore();store.updateProfile(device,profile);store.attachSubscription(device,subscription);
  const event=store.addEvent({title:'Seminario de ingeniería',department:'diit',career:'Ingeniería en Informática',
    startsAt:new Date(Date.now()+9*86400000).toISOString(),sourcePublishedAt:new Date().toISOString(),
    sourceUrl:'https://www.unlam.edu.ar/',place:'Aula de la UNLaM',description:'Actividad académica extensa',reviewed:true});
  const sent=[];
  const scheduler=makeScheduler(store,{}, async (sub,payload)=>{sent.push(payload);return {ok:true,status:201};});
  await scheduler.tick();
  assert.equal(sent.length,1);
  assert.equal(sent[0].eventId,event.id);
  assert.equal(store.data.queued.length,0);
  assert.equal(store.data.deliveries[0].statusType,'push_accepted');
  await scheduler.tick();assert.equal(sent.length,1);
});

test('resúmenes diario y semanal solo se entregan en el corte',async()=>{
  const {store}=tempStore();store.updateProfile(device,{...profile,frequency:'diaria'});store.attachSubscription(device,subscription);
  const ev=store.addEvent({title:'Clase abierta',department:'diit',career:'Ingeniería en Informática',
    startsAt:new Date(Date.now()+11*86400000).toISOString(),sourcePublishedAt:new Date().toISOString(),
    sourceUrl:'https://www.unlam.edu.ar/',place:'Aula',description:'Detalles',reviewed:true});
  const before=new Date('2030-01-02T18:59:00Z');
  // Ajusta únicamente la fecha de cola para comprobar el scheduler con un reloj fijo.
  store.data.queued[0].createdAt='2029-12-30T00:00:00Z';store.save();
  let sends=0;const scheduler=makeScheduler(store,{},async()=>{sends++;return {ok:true,status:201};});
  await scheduler.tick(before.getTime());assert.equal(sends,0);
  await scheduler.tick(Date.parse('2030-01-02T19:01:00Z'));assert.equal(sends,1);
  assert.equal(dueBucket(Date.parse('2030-01-02T17:00:00Z'),'diaria'),null);
  assert.equal(dueBucket(Date.parse('2030-01-07T19:01:00Z'),'semanal'),'2030-01-07');
  assert.ok(Number.isFinite(hoursBefore(ev.startsAt,Date.now())));
});

test('web push cifra información real con aes128gcm y firma VAPID', async()=>{
  const receiver=crypto.createECDH('prime256v1');receiver.generateKeys();
  const auth=crypto.randomBytes(16);
  const sub={endpoint:'https://push.example.com/send/test',keys:{p256dh:receiver.getPublicKey().toString('base64url'),auth:auth.toString('base64url')}};
  const payload={title:'Prueba',eventId:'123',url:'/?evento=123'};
  const encrypted=encryptPayload(sub,payload);
  const salt=encrypted.subarray(0,16);
  const sender=encrypted.subarray(21,21+encrypted[20]);
  const ciphertext=encrypted.subarray(21+encrypted[20]);
  const hmac=(key,msg)=>crypto.createHmac('sha256',key).update(msg).digest();
  const expand=(key,msg,n)=>hmac(key,Buffer.concat([msg,Buffer.from([1])])).subarray(0,n);
  const ikm=expand(hmac(auth,receiver.computeSecret(sender)),Buffer.concat([Buffer.from('WebPush: info\0'),receiver.getPublicKey(),sender]),32);
  const prk=hmac(salt,ikm);
  const cek=expand(prk,Buffer.from('Content-Encoding: aes128gcm\0'),16);
  const nonce=expand(prk,Buffer.from('Content-Encoding: nonce\0'),12);
  const cipher=crypto.createDecipheriv('aes-128-gcm',cek,nonce);
  cipher.setAuthTag(ciphertext.subarray(-16));
  const plain=Buffer.concat([cipher.update(ciphertext.subarray(0,-16)),cipher.final()]);
  assert.equal(plain.at(-1),2);
  assert.deepEqual(JSON.parse(plain.subarray(0,-1).toString()),payload);
  const keys=loadVapid(fs.mkdtempSync(path.join(os.tmpdir(),'vapid-test-')));
  const result=await sendPush(sub,payload,keys,async(_url,req)=>{
    assert.match(req.headers.Authorization,/^vapid t=/);
    const token=req.headers.Authorization.split('vapid t=')[1].split(',')[0];
    const [h,b,s]=token.split('.');
    assert.equal(crypto.verify('sha256',Buffer.from(`${h}.${b}`),{
      key:crypto.createPublicKey({key:keys.publicJwk,format:'jwk'}),dsaEncoding:'ieee-p1363'
    },Buffer.from(s,'base64url')),true);
    return {ok:true,status:201};
  });
  assert.equal(result.ok,true);
});

test('Expo Push registra tokens, envía avisos y desactiva tokens vencidos',async()=>{
  const {store}=tempStore();
  store.updateProfile(device,profile);
  assert.throws(()=>store.attachSubscription(device,{provider:'expo',token:'invalid'}),/Token de Expo Push inválido/);
  const expoSubscription={provider:'expo',token:'ExponentPushToken[test-device-token]'};
  store.attachSubscription(device,expoSubscription);
  assert.equal(store.profileFor(device).subscription.provider,'expo');

  const payload={title:'Nuevo evento',body:'Charla de ingeniería',eventId:'event-123',url:'/?evento=event-123'};
  const result=await sendPush(expoSubscription,payload,{},async(url,request)=>{
    assert.equal(url,'https://exp.host/--/api/v2/push/send');
    assert.equal(request.method,'POST');
    const body=JSON.parse(request.body);
    assert.equal(body.to,expoSubscription.token);
    assert.equal(body.data.eventId,payload.eventId);
    return {ok:true,status:200,json:async()=>({data:[{status:'ok',id:'ticket-123'}]})};
  });
  assert.deepEqual(result,{ok:true,status:200});

  const expired=await sendPush(expoSubscription,payload,{},async()=>({
    ok:true,status:200,json:async()=>({data:[{
      status:'error',message:'The recipient device is not registered',details:{error:'DeviceNotRegistered'}
    }]})
  }));
  assert.equal(expired.ok,false);
  assert.equal(expired.status,410);

  const event=store.addEvent({title:'Seminario de ingeniería',department:'diit',career:'Ingeniería en Informática',
    startsAt:new Date(Date.now()+9*86400000).toISOString(),sourcePublishedAt:new Date().toISOString(),
    sourceUrl:'https://www.unlam.edu.ar/',place:'Aula de la UNLaM',description:'Actividad académica extensa',reviewed:true});
  const sent=[];
  const scheduler=makeScheduler(store,{},async(sub,notification)=>{
    sent.push({sub,notification});
    return {ok:true,status:200};
  });
  await scheduler.tick();
  assert.equal(sent.length,1);
  assert.equal(sent[0].sub.provider,'expo');
  assert.equal(sent[0].notification.eventId,event.id);
  assert.equal(store.data.queued.length,0);
});


test('la base crea la carpeta data ausente y la recrea si desaparece',()=>{
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'nodo-data-missing-'));
  try {
    const file=path.join(tmp,'carpeta-inexistente','server','data','db.json');
    assert.equal(fs.existsSync(path.dirname(file)),false);
    const store=createStore({file, fresh:true});
    assert.equal(fs.existsSync(file),true);
    fs.rmSync(path.dirname(file),{recursive:true,force:true});
    store.save();
    assert.equal(fs.existsSync(file),true);
    assert.equal(JSON.parse(fs.readFileSync(file,'utf8')).version,1);
  } finally { fs.rmSync(tmp,{recursive:true,force:true}); }
});
