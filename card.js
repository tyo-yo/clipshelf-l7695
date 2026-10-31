// 縦長の ID カード（社員証の向き）を、光の当たる立体として描く部品。
// 決まり: 寸法は ID-1（53.98 x 85.6mm、角 3.18mm）。厚みは誇張して 1.8mm。光は左上から。
// 書体は Saira Extra Condensed（名前・番号）、IBM Plex Sans JP（文字）、IBM Plex Mono（極小の文字・機械読み取りの行）、Zen Kurenaido（署名＝ユーザーが書いたタイトル）。
import * as THREE from 'three';

export const CW = 53.98, CH = 85.6, CR = 3.18, CT = 1.8;
const TW = 1024, TH = Math.round(TW * CH / CW);   // 1024 x 1624
export const C = { ink: '#2d1b27', ink2: '#383553', steel: '#97b2c1', bone: '#eae7d4', shade: '#1c1019', copper: '#9e7967' };
const hex = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));

export async function loadFonts() {
  await Promise.all(['700 100px "Antonio"', '700 40px "Antonio"', '700 30px "IBM Plex Sans JP"', '500 20px "IBM Plex Mono"', '600 40px "Klee One"']
    .map(f => document.fonts.load(f, 'NEWCASTLE088キャッスル署名')));
}

// 静止画を ID 写真の刷り方に: 4段の2色化 + 横の刻線。粗い 360p も、刷りの質感として読める
export function engrave(img, w, h, { lines = 4, ramp = [C.shade, C.ink2, C.steel, C.bone] } = {}) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const x = cv.getContext('2d');
  if (img) { const s = Math.max(w / img.width, h / img.height); x.drawImage(img, (w - img.width * s) / 2, (h - img.height * s) / 2, img.width * s, img.height * s); }
  else { x.fillStyle = '#555'; x.fillRect(0, 0, w, h); }
  const d = x.getImageData(0, 0, w, h), p = d.data, rgb = ramp.map(hex);
  for (let i = 0; i < p.length; i += 4) {
    let L = (0.2126 * p[i] + 0.7152 * p[i + 1] + 0.0722 * p[i + 2]) / 255;
    L = Math.min(1, Math.max(0, (L - 0.08) / 0.84)); L = L * L * (3 - 2 * L);
    if (((i / 4 / w) | 0) % lines >= lines - 1) L *= 0.6;
    const f = L * (rgb.length - 1), k = Math.min(rgb.length - 2, Math.floor(f)), u = f - k;
    for (let c = 0; c < 3; c++) p[i + c] = rgb[k][c] + (rgb[k + 1][c] - rgb[k][c]) * u;
  }
  x.putImageData(d, 0, 0); return cv;
}
function rosette(x, cx, cy, R, n, alpha, color, lw = 1) {
  x.save(); x.strokeStyle = color; x.globalAlpha = alpha; x.lineWidth = lw;
  for (let k = 0; k < n; k++) {
    const r = R * (0.23 + 0.005 * k), dd = R * (0.30 - 0.004 * k);   // dd を小さくして中心の黒い穴を作らない
    x.beginPath();
    for (let t = 0; t <= Math.PI * 2 * 13 + 0.01; t += 0.008) { const px = cx + (R - r) * Math.cos(t) + dd * Math.cos((R - r) / r * t), py = cy + (R - r) * Math.sin(t) - dd * Math.sin((R - r) / r * t); t === 0 ? x.moveTo(px, py) : x.lineTo(px, py); }
    x.stroke();
  }
  x.restore();
}
function waves(x, y0, n, gap, amp, alpha, color) {
  x.save(); x.strokeStyle = color; x.globalAlpha = alpha; x.lineWidth = 1;
  for (let i = 0; i < n; i++) { x.beginPath(); for (let px = 0; px <= TW; px += 4) { const py = y0 + i * gap + amp * Math.sin(px * 0.014 + i * 0.35) + amp * .35 * Math.sin(px * 0.037 - i * .6); px ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke(); }
  x.restore();
}
function micro(x, text, x0, y0, len, size, color, alpha) { x.save(); x.font = `500 ${size}px "IBM Plex Mono"`; x.fillStyle = color; x.globalAlpha = alpha; let s = ''; while (x.measureText(s).width < len) s += text; x.fillText(s, x0, y0); x.restore(); }
function rr(x, X, Y, w, h, r) { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); }
function wrap(x, text, maxW) { const out = []; let line = ''; for (const ch of [...text]) { if (x.measureText(line + ch).width > maxW && line) { out.push(line); line = ''; } line += ch; } if (line) out.push(line); return out; }

// 写真の位置（テクスチャの座標）。飛ぶときに写真を画面に合わせるために外へ出す
export const PHOTO = { x: 56, y: 150, w: 912, h: 513 };

// クリップ1本の面を描く。clip: {legend, no, of, s, d, dur, t, img(Image|null)}
export function drawFace(clip, { res = 1024, full = true } = {}) {
  const k = res / TW;
  const mk = () => { const cv = document.createElement('canvas'); cv.width = Math.round(TW * k); cv.height = Math.round(TH * k); const c = cv.getContext('2d'); c.scale(k, k); return [cv, c]; };
  const [col, x] = mk(), [bump, b] = mk(), [rough, r] = mk(), [metal, m] = mk(), [irid, ir] = mk(), [thick, th] = mk();
  const g = x.createLinearGradient(0, 0, TW, TH); g.addColorStop(0, '#36222f'); g.addColorStop(.5, C.ink); g.addColorStop(1, '#2a2442'); x.fillStyle = g; x.fillRect(0, 0, TW, TH);
  rosette(x, TW * .62, 1150, 470, 10, .10, C.steel);
  rosette(x, TW * .62, 1150, 250, 6, .08, C.copper);
  // 地紋の中心の紋章（空いた中心を、意図した印に見せる）
  x.save(); x.translate(TW * .62, 1150); x.strokeStyle = C.steel; x.globalAlpha = .22; for (let i = 0; i < 9; i++) { x.lineWidth = i % 3 ? 1 : 2.2; x.beginPath(); x.arc(0, 0, 40 + i * 9, 0, Math.PI * 2); x.stroke(); }
  x.globalAlpha = .16; x.fillStyle = C.steel; x.font = '800 70px "Saira Extra Condensed"'; x.textAlign = 'center'; x.fillText('CS', 0, 24); x.restore();
  waves(x, 1430, 16, 6, 10, .10, C.steel);
  // 上の帯
  x.fillStyle = C.bone; x.font = '600 52px "Saira Extra Condensed"'; x.fillText('CLIPSHELF', 56, 92);
  x.fillStyle = C.steel; x.font = '500 22px "IBM Plex Mono"'; x.fillText('PERSONAL CLIP REGISTRY', 290, 78); x.fillText('APEX LEGENDS', 290, 104);
  micro(x, `${clip.legend}·CLIP·REGISTRY·`, 56, 128, TW - 112, 11, C.steel, .6);
  // 写真
  const P = PHOTO; x.fillStyle = C.shade; x.fillRect(P.x - 5, P.y - 5, P.w + 10, P.h + 10);
  x.drawImage(engrave(clip.img, Math.round(P.w * k), Math.round(P.h * k)), P.x, P.y, P.w, P.h);
  x.strokeStyle = C.steel; x.globalAlpha = .5; x.lineWidth = 2; x.strokeRect(P.x - 5, P.y - 5, P.w + 10, P.h + 10); x.globalAlpha = 1;
  if (clip.d) { x.save(); x.beginPath(); x.rect(P.x, P.y, P.w, P.h); x.clip(); x.globalCompositeOperation = 'screen'; x.globalAlpha = .42; x.fillStyle = C.bone; x.font = '800 120px "Saira Extra Condensed"'; x.fillText(clip.d.slice(0, 4), P.x + 18, P.y + P.h - 18);
    x.globalCompositeOperation = 'multiply'; x.globalAlpha = .5; x.fillStyle = C.shade; for (let yy = P.y + P.h - 130; yy < P.y + P.h; yy += 4) x.fillRect(P.x, yy, 280, 1.3); x.restore(); }
  const lab = (t, X, Y) => { x.save(); x.fillStyle = C.steel; x.globalAlpha = .85; x.font = '500 17px "IBM Plex Mono"'; x.fillText(t, X, Y); x.restore(); };
  // ホログラムの丸の刷り（光を拾わない角度でも、認証の印として読める）
  { const hx = P.x + P.w - 70, hy = P.y + P.h - 20; x.save(); x.beginPath(); x.arc(hx, hy, 130, 0, Math.PI * 2); x.clip();
    const hg = x.createRadialGradient(hx - 30, hy - 40, 10, hx, hy, 130); hg.addColorStop(0, 'rgba(234,231,212,.55)'); hg.addColorStop(1, 'rgba(151,178,193,.28)'); x.fillStyle = hg; x.fillRect(hx - 130, hy - 130, 260, 260);
    x.strokeStyle = C.bone; x.globalAlpha = .35; for (let k = 0; k < 30; k++) { x.lineWidth = 1; x.beginPath(); x.arc(hx, hy, 6 + k * 4.3, 0, Math.PI * 2); x.stroke(); } x.restore(); }
  // 名前
  lab('legend / レジェンド', 58, 700);
  x.fillStyle = C.bone; x.font = '800 168px "Saira Extra Condensed"'; x.fillText(clip.legend, 52, 840);
  // シーズン（白黒反転）・日付・長さ
  lab('season', 58, 872); lab('recorded / 記録日', 200, 872); lab('length / 長さ', 470, 872);
  x.fillStyle = C.steel; x.fillRect(58, 882, 118, 58); x.fillStyle = C.shade; x.font = '800 52px "Saira Extra Condensed"'; x.fillText(clip.s, 74, 930);
  x.fillStyle = C.bone; x.font = '500 34px "IBM Plex Mono"'; x.fillText(clip.d, 200, 926); x.fillText(`${clip.dur}s`, 470, 926);
  // チップと型押しの番号
  const cx = 58, cy = 978, cw = 132, ch = 104;
  const cg = x.createLinearGradient(cx, cy, cx + cw, cy + ch); cg.addColorStop(0, '#dcc68f'); cg.addColorStop(.5, '#a3854a'); cg.addColorStop(1, '#e6d6a5');
  x.fillStyle = cg; rr(x, cx, cy, cw, ch, 14); x.fill();
  x.strokeStyle = '#6b5530'; x.lineWidth = 3; x.beginPath(); [[44, 0, 44, ch], [88, 0, 88, ch], [0, 36, 44, 36], [0, 68, 44, 68], [88, 36, cw, 36], [88, 68, cw, 68]].forEach(([a, b2, c2, d2]) => { x.moveTo(cx + a, cy + b2); x.lineTo(cx + c2, cy + d2); }); x.stroke();
  const NO = `No.${String(clip.no).padStart(3, '0')}`;
  lab('document no. / 番号', 226, 984);
  x.fillStyle = 'rgba(234,231,212,.94)'; x.font = '800 132px "Saira Extra Condensed"'; x.fillText(NO, 224, 1080);
  const nw = x.measureText(NO).width; x.fillStyle = C.steel; x.font = '500 28px "IBM Plex Mono"'; x.fillText(`/ ${String(clip.of).padStart(3, '0')}`, 224 + nw + 16, 1078);
  // 署名の欄: ユーザーが書いたタイトルを手書きで
  x.fillStyle = C.steel; x.font = '500 20px "IBM Plex Mono"'; x.fillText('signature / 署名', 58, 1146);
  x.font = '400 64px "Zen Kurenaido"'; x.fillStyle = C.bone;
  const sig = wrap(x, clip.t, TW - 120).slice(0, 4);
  sig.forEach((l, i) => { x.save(); x.translate(60, 1222 + i * 72); x.rotate(-0.012 * (i % 2 ? -1 : 1)); x.fillText(l, 0, 0); x.restore(); });
  x.strokeStyle = C.steel; x.globalAlpha = .45; x.lineWidth = 1.5; x.beginPath(); x.moveTo(58, 1222 + sig.length * 72 - 44); x.lineTo(TW - 58, 1222 + sig.length * 72 - 44); x.stroke(); x.globalAlpha = 1;
  // 角度で光る丸の列
  for (let i = 0; i < 6; i++) { const ox = 640 + i * 54, oy = 1462; const og = x.createRadialGradient(ox - 6, oy - 6, 2, ox, oy, 20); og.addColorStop(0, 'rgba(234,231,212,.9)'); og.addColorStop(1, i % 2 ? 'rgba(151,178,193,.5)' : 'rgba(158,121,103,.5)'); x.fillStyle = og; x.beginPath(); x.arc(ox, oy, 19, 0, Math.PI * 2); x.fill(); }
  // 機械読み取りの行
  x.fillStyle = 'rgba(234,231,212,.7)'; x.font = '500 33px "IBM Plex Mono"';
  const z = (s) => s.padEnd(30, '<').slice(0, 30);
  x.fillText(z(`CLIP<${clip.legend}<<${clip.s}<<${String(clip.no).padStart(3, '0')}`), 56, 1530); x.fillText(z(`${clip.d.replace(/\./g, '')}<${String(clip.dur).padStart(4, '0')}<<APEX`), 56, 1574);

  if (!full) return { col };
  // 凹凸: 番号・チップの縁・写真の枠
  b.fillStyle = '#000'; b.fillRect(0, 0, TW, TH); b.fillStyle = '#fff'; b.shadowColor = '#fff'; b.shadowBlur = 5; b.font = '800 132px "Saira Extra Condensed"'; b.fillText(NO, 224, 1080); b.shadowBlur = 0;
  b.strokeStyle = '#999'; b.lineWidth = 4; rr(b, cx, cy, cw, ch, 14); b.stroke(); b.strokeStyle = '#555'; b.lineWidth = 3; b.strokeRect(P.x - 5, P.y - 5, P.w + 10, P.h + 10);
  // 粗さ（明るいほど粗い）: 地は半つや、写真は少しつや、チップはつや、ホログラムはつや
  r.fillStyle = '#8c8c8c'; r.fillRect(0, 0, TW, TH);
  { let sd = 7; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647; for (let i = 0; i < 9000; i++) { r.fillStyle = rnd() < .5 ? '#6e6e6e' : '#a4a4a4'; r.fillRect(rnd() * TW, rnd() * TH, 2, 2); } } r.fillStyle = '#5a5a5a'; r.fillRect(P.x, P.y, P.w, P.h); r.fillStyle = '#3a3a3a'; rr(r, cx, cy, cw, ch, 14); r.fill();
  m.fillStyle = '#000'; m.fillRect(0, 0, TW, TH);
  { let sd = 11; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647; m.fillStyle = '#5a5a5a'; for (let i = 0; i < 2600; i++) m.fillRect(rnd() * TW, rnd() * TH, 1.6, 1.6); }
  m.fillStyle = '#fff'; rr(m, cx, cy, cw, ch, 14); m.fill();
  // ホログラムの貼り: 写真の右下に重なる円と、右端の細い帯
  ir.fillStyle = '#000'; ir.fillRect(0, 0, TW, TH); ir.fillStyle = '#fff'; ir.beginPath(); ir.arc(P.x + P.w - 70, P.y + P.h - 20, 130, 0, Math.PI * 2); ir.fill();
  ir.fillStyle = '#9a9a9a'; ir.fillRect(TW - 92, 0, 40, TH);
  ir.fillStyle = '#fff'; for (let i = 0; i < 6; i++) { ir.beginPath(); ir.arc(640 + i * 54, 1462, 19, 0, Math.PI * 2); ir.fill(); }
  r.fillStyle = '#2a2a2a'; r.beginPath(); r.arc(P.x + P.w - 70, P.y + P.h - 20, 130, 0, Math.PI * 2); r.fill();
  th.fillStyle = '#808080'; th.fillRect(0, 0, TW, TH);
  for (let k = 0; k < 34; k++) { th.strokeStyle = k % 2 ? '#fff' : '#111'; th.lineWidth = 4; th.beginPath(); th.arc(P.x + P.w - 70, P.y + P.h - 20, 6 + k * 3.8, 0, Math.PI * 2); th.stroke(); }
  for (let y = 0; y < TH; y += 10) { th.fillStyle = (y / 10) % 2 ? '#eee' : '#333'; th.fillRect(TW - 92, y, 40, 5); }
  return { col, bump, rough, metal, irid, thick };
}

// どのカードでも同じ位置にある凹凸・粗さ・金属・ホログラム（番号の凹凸だけ持たない）。面の数を減らすため全カードで共有する
let SHARED = null;
export function sharedMaps() {
  if (SHARED) return SHARED;
  const f = drawFace({ legend: '', no: 0, of: 0, s: '', d: '', dur: 0, t: '', img: null }, { res: 512 });
  const b = f.bump.getContext('2d'); b.setTransform(1, 0, 0, 1, 0, 0); b.fillStyle = '#000'; b.fillRect(0, 0, f.bump.width, f.bump.height);
  b.scale(.5, .5); b.strokeStyle = '#999'; b.lineWidth = 4; rr(b, 58, 978, 132, 104, 14); b.stroke(); b.strokeStyle = '#555'; b.lineWidth = 3; b.strokeRect(PHOTO.x - 5, PHOTO.y - 5, PHOTO.w + 10, PHOTO.h + 10);
  return (SHARED = f);
}
export function cardGeometry() {
  const s = new THREE.Shape(), w = CW / 2, h = CH / 2, R = CR;
  s.moveTo(-w + R, -h); s.lineTo(w - R, -h); s.quadraticCurveTo(w, -h, w, -h + R); s.lineTo(w, h - R); s.quadraticCurveTo(w, h, w - R, h); s.lineTo(-w + R, h); s.quadraticCurveTo(-w, h, -w, h - R); s.lineTo(-w, -h + R); s.quadraticCurveTo(-w, -h, -w + R, -h);
  const bev = 0.35, geo = new THREE.ExtrudeGeometry(s, { depth: CT - bev * 2, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 4, curveSegments: 10 });
  geo.translate(0, 0, -(CT - bev * 2) / 2);
  const uv = geo.attributes.uv, pos = geo.attributes.position, g0 = geo.groups[0];
  for (let i = g0.start; i < g0.start + g0.count; i++) uv.setXY(i, (pos.getX(i) + w) / CW, (pos.getY(i) + h) / CH);
  uv.needsUpdate = true; geo.computeVertexNormals();
  // 表と裏を別の材質に分ける（材質 0 = 表、1 = 縁、2 = 裏）。表の三角形と裏の三角形は、押し出しの作りでそれぞれ連続している
  const zs = []; for (let i = g0.start; i < g0.start + g0.count; i += 3) zs.push(pos.getZ(i) + pos.getZ(i + 1) + pos.getZ(i + 2));
  const half = zs.length / 2, firstBack = zs.slice(0, half).every(z => z < 0), secondFront = zs.slice(half).every(z => z > 0);
  if (firstBack && secondFront) { const g1 = geo.groups[1]; geo.clearGroups(); geo.addGroup(g0.start, half * 3, 2); geo.addGroup(g0.start + half * 3, half * 3, 0); geo.addGroup(g1.start, g1.count, 1); }
  return geo;
}
const TEXCACHE = new WeakMap();
export function faceMaterial(renderer, maps) {
  const t = (cv, srgb) => { if (TEXCACHE.has(cv)) return TEXCACHE.get(cv); const x = mkTex(cv, srgb); TEXCACHE.set(cv, x); return x; };
  const mkTex = (cv, srgb) => { const x = new THREE.CanvasTexture(cv); x.anisotropy = renderer.capabilities.getMaxAnisotropy(); if (srgb) x.colorSpace = THREE.SRGBColorSpace; return x; };
  const S = sharedMaps(); maps = { ...S, ...maps };
  return new THREE.MeshPhysicalMaterial({
    map: t(maps.col, true), bumpMap: t(maps.bump), bumpScale: 1.6,
    roughness: 1, roughnessMap: t(maps.rough), metalness: 1, metalnessMap: t(maps.metal),
    clearcoat: 1, clearcoatRoughness: 0.16,
    iridescence: 1, iridescenceMap: t(maps.irid), iridescenceIOR: 2.0, iridescenceThicknessRange: [120, 1100], iridescenceThicknessMap: t(maps.thick),
  });
}
export function backMaterial() {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 812; const x = cv.getContext('2d'); x.scale(.5, .5);
  const g = x.createLinearGradient(0, 0, TW, TH); g.addColorStop(0, '#2f2433'); g.addColorStop(1, '#231a29'); x.fillStyle = g; x.fillRect(0, 0, TW, TH);
  x.fillStyle = '#15101a'; x.fillRect(0, 170, TW, 150);                                    // 磁気の帯
  x.fillStyle = 'rgba(151,178,193,.10)'; x.fillRect(0, 168, TW, 2); x.fillRect(0, 320, TW, 2);
  rosette(x, TW / 2, 980, 420, 9, .10, C.steel); rosette(x, TW / 2, 980, 220, 5, .08, C.copper);
  waves(x, 1420, 14, 7, 9, .08, C.steel);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshPhysicalMaterial({ map: t, roughness: .55, clearcoat: .7, clearcoatRoughness: .3 });
}
export const edgeMaterial = () => new THREE.MeshPhysicalMaterial({ color: 0xcfc6b2, roughness: .5, clearcoat: .6, clearcoatRoughness: .3 });
