// Web Push RFC 8291 (aes128gcm) + RFC 8292 (VAPID), usando Node crypto sin servicios externos.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const b64 = bytes => Buffer.from(bytes).toString('base64url');
const unb64 = s => Buffer.from(s, 'base64url');
const hmac = (key, value) => crypto.createHmac('sha256', key).update(value).digest();
function expand(prk, info, length) {
  const blocks = [];
  let previous = Buffer.alloc(0), counter = 1;
  while (Buffer.concat(blocks).length < length) {
    previous = hmac(prk, Buffer.concat([previous, info, Buffer.from([counter++])]));
    blocks.push(previous);
  }
  return Buffer.concat(blocks).subarray(0, length);
}
function pubFromJwk(jwk) { return Buffer.concat([Buffer.from([4]), unb64(jwk.x), unb64(jwk.y)]); }
export function loadVapid(dataDir) {
  fs.mkdirSync(dataDir, { recursive: true });
  const file = path.join(dataDir, 'vapid.json');
  if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const keys = { privateJwk: privateKey.export({ format: 'jwk' }), publicJwk: publicKey.export({ format: 'jwk' }) };
  fs.writeFileSync(file, JSON.stringify(keys, null, 2), { mode: 0o600 });
  return keys;
}
export function vapidPublicKey(keys) { return b64(pubFromJwk(keys.publicJwk)); }
export function encryptPayload(subscription, payload) {
  const receiver = unb64(subscription.keys.p256dh);
  const auth = unb64(subscription.keys.auth);
  const sender = crypto.createECDH('prime256v1');
  sender.generateKeys();
  const senderPublic = sender.getPublicKey();
  const salt = crypto.randomBytes(16);
  const secret = sender.computeSecret(receiver);
  const prk = hmac(auth, secret);
  const ikm = expand(prk, Buffer.concat([Buffer.from('WebPush: info\0'), receiver, senderPublic]), 32);
  const secondPrk = hmac(salt, ikm);
  const cek = expand(secondPrk, Buffer.from('Content-Encoding: aes128gcm\0'), 16);
  const nonce = expand(secondPrk, Buffer.from('Content-Encoding: nonce\0'), 12);
  const plaintext = Buffer.concat([Buffer.from(JSON.stringify(payload)), Buffer.from([2])]);
  if (plaintext.length > 3900) throw new Error('Notificación demasiado extensa');
  const cipher = crypto.createCipheriv('aes-128-gcm', cek, nonce);
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final(), cipher.getAuthTag()]);
  const recSize = Buffer.alloc(4); recSize.writeUInt32BE(4096);
  return Buffer.concat([salt, recSize, Buffer.from([senderPublic.length]), senderPublic, encrypted]);
}
async function sendExpoPush(subscription, payload, fetchImpl) {
  const response = await fetchImpl('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: subscription.token,
      title: payload.title,
      body: payload.body,
      sound: 'default',
      data: { eventId: payload.eventId, url: payload.url },
    }),
    signal: AbortSignal.timeout(12000),
  });
  const result = await response.json();
  if (!response.ok) return { ok: false, status: response.status,
    detail: result.errors?.[0]?.message || 'Expo Push rechazó el envío' };
  const ticket = result.data?.[0];
  if (ticket?.status === 'ok') return { ok: true, status: response.status };
  if (!ticket || ticket.status !== 'error') throw new Error('Respuesta inválida del servicio Expo Push');
  const error = ticket.details?.error;
  return {
    ok: false,
    status: error === 'DeviceNotRegistered' ? 410 : response.status,
    detail: ticket.message || 'Expo Push rechazó el envío',
  };
}
export async function sendPush(subscription, payload, keys, fetchImpl = fetch) {
  if (subscription.provider === 'expo') return sendExpoPush(subscription, payload, fetchImpl);
  const endpoint = new URL(subscription.endpoint);
  if (endpoint.protocol !== 'https:') throw new Error('El endpoint de push debe ser HTTPS');
  const origin = endpoint.origin;
  const jwtBody = { aud: origin, exp: Math.floor(Date.now()/1000)+11*3600,
    sub: process.env.VAPID_SUBJECT || 'mailto:dev@example.com' };
  const jwtStart = `${b64(JSON.stringify({ alg: 'ES256', typ: 'JWT' }))}.${b64(JSON.stringify(jwtBody))}`;
  const key = crypto.createPrivateKey({ key: keys.privateJwk, format: 'jwk' });
  const signature = crypto.sign('sha256', Buffer.from(jwtStart), { key, dsaEncoding: 'ieee-p1363' });
  const token = `${jwtStart}.${b64(signature)}`;
  const response = await fetchImpl(subscription.endpoint, { method: 'POST', headers: {
    'Authorization': `vapid t=${token}, k=${vapidPublicKey(keys)}`, 'Content-Encoding': 'aes128gcm',
    'Content-Type': 'application/octet-stream', 'TTL': '86400', 'Urgency': 'normal'
  }, body: encryptPayload(subscription, payload), signal: AbortSignal.timeout(12000) });
  return { ok: response.ok, status: response.status };
}
