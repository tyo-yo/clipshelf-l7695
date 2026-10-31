// 読み取り機に差すカードの面（平面）。上の帯に番号とシーズン（棚で読める）、写真のラベル、名前、署名（タイトル）、下端に差し込む側のチップと機械読み取りの行。
import { engrave, C } from './card.js';
export const FW = 1024, FH = 1624;
export const BAND = 190;           // 上の帯の高さ（棚ではここだけ見える）
export const PH = { x: 48, y: 228, w: 928, h: 522 };
function rr(x, X, Y, w, h, r) { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); }
function rosette(x, cx, cy, R, n, alpha, color) {
  x.save(); x.strokeStyle = color; x.globalAlpha = alpha; x.lineWidth = 1;
  for (let k = 0; k < n; k++) { const r = R * (0.23 + 0.005 * k), dd = R * (0.30 - 0.004 * k); x.beginPath();
    for (let t = 0; t <= Math.PI * 26 + 0.01; t += 0.01) { const px = cx + (R - r) * Math.cos(t) + dd * Math.cos((R - r) / r * t), py = cy + (R - r) * Math.sin(t) - dd * Math.sin((R - r) / r * t); t ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke(); }
  x.restore();
}
function wrap(x, text, maxW) { const out = []; let line = ''; for (const ch of [...text]) { if (x.measureText(line + ch).width > maxW && line) { out.push(line); line = ''; } line += ch; } if (line) out.push(line); return out; }
// ゲームごとの見た目。どちらも地は明るく（暗い読み取り機の上で、カードが手前に見えるように）
export const THEMES = {
  apex: {
    paper: ['#c7cad0', '#9a9fa7'], band: ['#17181b', '#222428'], bandLine: '#e2371f', num: '#f4f1ea', numSub: '#8d9097',
    tagBg: '#e2371f', tagFg: '#ffffff', tagPre: '#17181b', tagPreFg: '#e2371f',
    ink: '#121316', sub: '#3d4148', accent: '#e2371f', frame: '#17181b',
    photo: ['#101113', '#474a51', '#b7bac0', '#f4f5f7'], holder: ['#101113', '#50535a', '#c2c5ca', '#f4f5f7'],
    pattern: '#5c6068', trace: '#4a4e55', stamp: 'rgba(226,55,31,.92)', mrz: 'rgba(18,19,22,.78)', micro: '#4d5158', chipLine: '#6b5530',
  },
  other: {
    paper: ['#c4c8ce', '#979ca4'], band: ['#15181c', '#1f2328'], bandLine: '#3fb4d0', num: '#eef3f5', numSub: '#8a9097',
    tagBg: '#3fb4d0', tagFg: '#06222b', tagPre: '#15181c', tagPreFg: '#3fb4d0',
    ink: '#121316', sub: '#3d4148', accent: '#2a9fbc', frame: '#15181c',
    photo: ['#0f1113', '#454950', '#b5b9bf', '#f3f5f7'], holder: ['#0f1113', '#4d5158', '#c0c4c9', '#f3f5f7'],
    pattern: '#5c6068', trace: '#4a4e55', stamp: 'rgba(42,159,188,.92)', mrz: 'rgba(18,19,22,.78)', micro: '#4d5158', chipLine: '#6b5530',
  },
  deadlock: {
    paper: ['#ece3c9', '#dfd3b2'], band: ['#163428', '#1f4335'], bandLine: '#c9a45c', num: '#efe6cb', numSub: '#a8a07f',
    tagBg: '#c9a45c', tagFg: '#163428', tagPre: '#163428', tagPreFg: '#c9a45c',
    ink: '#183026', sub: '#857653', accent: '#b8893a', frame: '#163428',
    photo: ['#11281e', '#3f5a48', '#b9b190', '#f5eed8'], holder: ['#11281e', '#46604f', '#c2b993', '#f5eed8'],
    pattern: '#a69565', trace: '#b08a46', stamp: 'rgba(184,137,58,.9)', mrz: 'rgba(24,48,38,.72)', micro: '#9c8c62', chipLine: '#5d4a26',
  },
};
// 回路の配線: 縦横に折れ、ときどき45度に曲がって、端が丸い接点で終わる線（乱数の種で毎回同じ形）
function traces(x, color, alpha, seed, box, n = 26) {
  let sd = seed; const r = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  x.save(); x.strokeStyle = color; x.fillStyle = color; x.globalAlpha = alpha; x.lineWidth = 2.2; x.lineJoin = 'round';
  for (let i = 0; i < n; i++) {
    let px = box.x + r() * box.w, py = box.y + r() * box.h, dir = Math.floor(r() * 4); x.beginPath(); x.moveTo(px, py);
    for (let k = 0, m = 3 + Math.floor(r() * 4); k < m; k++) {
      const L = 40 + r() * 110, diag = r() < .3, dx = [1, 0, -1, 0][dir], dy = [0, 1, 0, -1][dir];
      if (diag) { const dd = L * .5; px += dx * dd + dy * dd * (r() < .5 ? 1 : -1); py += dy * dd + dx * dd * (r() < .5 ? 1 : -1); } else { px += dx * L; py += dy * L; }
      px = Math.max(box.x, Math.min(box.x + box.w, px)); py = Math.max(box.y, Math.min(box.y + box.h, py)); x.lineTo(px, py); if (r() < .5) dir = (dir + (r() < .5 ? 1 : 3)) % 4;
    }
    x.stroke(); x.beginPath(); x.arc(px, py, 5.5, 0, Math.PI * 2); x.fill(); x.globalAlpha = alpha * .9; x.beginPath(); x.arc(px, py, 2.4, 0, Math.PI * 2); x.fillStyle = '#000'; x.fill(); x.fillStyle = color; x.globalAlpha = alpha;
  }
  x.restore();
}
// 差し込む側の端子（基板の縁の金の接点）
function edgeContacts(x, y, h) {
  const n = 14, w = (FW - 120) / n;
  for (let i = 0; i < n; i++) { const X = 60 + i * w + 4; const g = x.createLinearGradient(X, y, X, y + h); g.addColorStop(0, '#f0dc9e'); g.addColorStop(.5, '#b8923e'); g.addColorStop(1, '#e5cf8c'); x.fillStyle = g; rr(x, X, y, w - 8, h + 12, 6); x.fill(); }
}
// 二次元コード: 番号から作る点の並び（読めるコードではなく、記録媒体らしさの印）
function matrixCode(x, X, Y, S, seed, color) {
  const n = 14, c = S / n; let sd = seed * 7919 + 13; const r = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  x.save(); x.fillStyle = color; for (let i = 0; i < n; i++) x.fillRect(X, Y + i * c, c, c); for (let i = 0; i < n; i++) x.fillRect(X + i * c, Y + (n - 1) * c, c, c);
  for (let i = 0; i < n; i += 2) { x.fillRect(X + i * c, Y, c, c); x.fillRect(X + (n - 1) * c, Y + i * c, c, c); }
  for (let i = 1; i < n - 1; i++) for (let j = 1; j < n - 1; j++) if (r() < .48) x.fillRect(X + i * c, Y + j * c, c, c);
  x.restore();
}
const BGS = {};   // 地は、ゲームごとに1回だけ描く
function background(game) {
  if (BGS[game]) return BGS[game]; const T = THEMES[game], cv = document.createElement('canvas'); cv.width = FW; cv.height = FH; const x = cv.getContext('2d');
  const g = x.createLinearGradient(0, 0, FW * .4, FH); g.addColorStop(0, T.paper[0]); g.addColorStop(1, T.paper[1]); x.fillStyle = g; x.fillRect(0, 0, FW, FH);
  if (game !== 'deadlock') {
    // 金属のヘアライン（横の細かい筋）と、斜めの光の反射
    { let sd = 5; const r = () => (sd = (sd * 16807) % 2147483647) / 2147483647; for (let i = 0; i < 1400; i++) { x.fillStyle = r() < .5 ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.06)'; x.fillRect(0, r() * FH, FW, 1); } }
    const sh = x.createLinearGradient(0, 0, FW, FH * .6); sh.addColorStop(0, 'rgba(255,255,255,0)'); sh.addColorStop(.45, 'rgba(255,255,255,.22)'); sh.addColorStop(.55, 'rgba(255,255,255,0)'); x.fillStyle = sh; x.fillRect(0, 0, FW, FH);
    // 回路の配線とアンテナの渦
    traces(x, T.trace, .38, 11, { x: 30, y: BAND + 20, w: FW - 60, h: FH - BAND - 120 }, 30);
    x.save(); x.strokeStyle = T.trace; x.globalAlpha = .3; x.lineWidth = 3; for (let i = 0; i < 6; i++) { const d = i * 18; rr(x, 560 + d, 1110 + d, 420 - 2 * d, 230 - 2 * d, 26 - i * 3); x.stroke(); } x.restore();
    // 大きく薄い Apex の三角の A
    x.save(); x.globalAlpha = .08; x.fillStyle = T.ink; const s2 = 900, cx2 = FW * .62, by = 1420, ty = by - s2 * .9;
    x.beginPath(); x.moveTo(cx2, ty); x.lineTo(cx2 + s2 * .55, by); x.lineTo(cx2 - s2 * .55, by); x.closePath(); x.moveTo(cx2, ty + s2 * .3); x.lineTo(cx2 - s2 * .3, by - s2 * .08); x.lineTo(cx2 + s2 * .3, by - s2 * .08); x.closePath(); x.fill('evenodd'); x.restore();
    // 右端の赤の帯と、縁の面取りの光
    x.fillStyle = T.accent; x.fillRect(FW - 18, BAND + 40, 6, FH - BAND - 260);
    x.strokeStyle = 'rgba(255,255,255,.45)'; x.lineWidth = 3; x.strokeRect(1.5, 1.5, FW - 3, FH - 3);
  } else {
    { let sd = 3; const r = () => (sd = (sd * 16807) % 2147483647) / 2147483647; for (let i = 0; i < 7000; i++) { x.fillStyle = r() < .5 ? 'rgba(0,0,0,.035)' : 'rgba(255,255,255,.06)'; x.fillRect(r() * FW, r() * FH, 2, 2); } }
    // アール・デコ: 下の中央から広がる放射の線と、段々の弧
    x.save(); x.strokeStyle = T.pattern; x.globalAlpha = .28; x.lineWidth = 1.4; const ox = FW / 2, oy = FH + 40;
    for (let k = 0; k < 46; k++) { const a = Math.PI + (k + .5) / 46 * Math.PI; x.beginPath(); x.moveTo(ox, oy); x.lineTo(ox + Math.cos(a) * 1500, oy + Math.sin(a) * 1500); x.stroke(); }
    x.globalAlpha = .45; x.lineWidth = 2.2; for (let r = 260; r < 900; r += 90) { x.beginPath(); x.arc(ox, oy, r, Math.PI, 2 * Math.PI); x.stroke(); }
    x.restore();
    // 真鍮の配線
    traces(x, T.trace, .42, 23, { x: 40, y: BAND + 30, w: FW - 80, h: FH - BAND - 140 }, 22);
    // 角の段々の飾り（真鍮）
    x.save(); x.strokeStyle = T.accent; x.lineWidth = 3; x.globalAlpha = .75;
    const corner = (cx, cy, sx, sy) => { for (let i = 0; i < 3; i++) { const d = 26 + i * 16; x.beginPath(); x.moveTo(cx + sx * d, cy + sy * 210); x.lineTo(cx + sx * d, cy + sy * d); x.lineTo(cx + sx * 210, cy + sy * d); x.stroke(); } };
    corner(0, BAND, 1, 1); corner(FW, BAND, -1, 1); corner(0, FH, 1, -1); corner(FW, FH, -1, -1); x.restore();
  }
  return (BGS[game] = cv);
}
// res: 出力の幅（px）。棚のカードは小さくてよい
export function drawFace2(clip, res = 512) {
  window.__df = (window.__df || 0) + 1;   // 何回描いたか（重さの確かめ用）
  const game = THEMES[clip.game] ? clip.game : 'apex', T = THEMES[game];
  const k = res / FW, cv = document.createElement('canvas'); cv.width = res; cv.height = Math.round(FH * k); const x = cv.getContext('2d'); x.scale(k, k);
  x.drawImage(background(game), 0, 0);
  // 上の帯: 番号（型押し風）と区切りの札。棚に重ねたとき、ここだけが見える
  const bg = x.createLinearGradient(0, 0, 0, BAND); bg.addColorStop(0, T.band[0]); bg.addColorStop(1, T.band[1]); x.fillStyle = bg; x.fillRect(0, 0, FW, BAND);
  x.fillStyle = T.bandLine; x.fillRect(0, BAND - 8, FW, 8); if (game === 'deadlock') { x.fillRect(0, BAND - 16, FW, 2); }
  const NO = String(clip.no).padStart(3, '0'), TPL = !!clip.tpl;   // tpl: 仮のカードの型（クリップごとの中身を描かない）
  if (!TPL) {
  x.font = '800 104px "Antonio"'; x.fillStyle = 'rgba(0,0,0,.55)'; x.fillText(NO, 55, 142); x.fillStyle = T.num; x.fillText(NO, 52, 138);
  const nw = x.measureText(NO).width; x.fillStyle = T.numSub; x.font = '500 24px "IBM Plex Mono"'; x.fillText('No.', 52 + nw + 12, 84); x.fillText(`/${String(clip.of).padStart(3, '0')}`, 52 + nw + 12, 136);
  { const sp = clip.sp || 'S', sn = clip.sn || (clip.s || '').slice(1); x.font = '800 54px "Antonio"'; const pw = Math.max(50, x.measureText(sp).width + 20); x.font = '800 74px "Antonio"'; const nw2 = x.measureText(sn).width + 28, X0 = FW - 52 - pw - nw2;
    x.save(); if (game !== 'deadlock') { x.beginPath(); x.moveTo(X0 + 14, 62); x.lineTo(X0 + pw + nw2, 62); x.lineTo(X0 + pw + nw2 - 14, 142); x.lineTo(X0, 142); x.closePath(); x.clip(); }
    x.fillStyle = T.tagBg; x.fillRect(X0, 62, pw + nw2, 80); x.fillStyle = T.tagPre; x.fillRect(X0, 62, pw, 80); x.restore();
    x.fillStyle = T.tagPreFg; x.font = '800 54px "Antonio"'; x.fillText(sp, X0 + 12, 122); x.fillStyle = T.tagFg; x.font = '800 74px "Antonio"'; x.fillText(sn, X0 + pw + 12, 132); }
  }
  // 写真（刻線の刷り）と、角の認証の丸
  x.fillStyle = T.frame; x.fillRect(PH.x - 6, PH.y - 6, PH.w + 12, PH.h + 12);
  if (TPL) { const pg = x.createLinearGradient(PH.x, PH.y, PH.x + PH.w, PH.y + PH.h); pg.addColorStop(0, T.photo[1]); pg.addColorStop(1, T.photo[0]); x.fillStyle = pg; x.fillRect(PH.x, PH.y, PH.w, PH.h); x.fillStyle = 'rgba(0,0,0,.25)'; for (let yy = PH.y; yy < PH.y + PH.h; yy += 4) x.fillRect(PH.x, yy + 3, PH.w, 1); }
  else { x.drawImage(engrave(clip.img, Math.round(PH.w * k), Math.round(PH.h * k), { ramp: T.photo }), PH.x, PH.y, PH.w, PH.h);
  x.save(); x.beginPath(); x.rect(PH.x, PH.y, PH.w, PH.h); x.clip(); x.globalCompositeOperation = 'screen'; x.globalAlpha = .45; x.fillStyle = '#fff'; x.font = '800 116px "Antonio"'; x.fillText(clip.d.slice(0, 4), PH.x + 16, PH.y + PH.h - 18); x.restore(); }
  const hx = PH.x + PH.w - 74, hy = PH.y + PH.h - 22; x.save(); x.beginPath(); x.arc(hx, hy, 118, 0, Math.PI * 2); x.clip();
  const hg = x.createRadialGradient(hx - 30, hy - 40, 10, hx, hy, 118); hg.addColorStop(0, 'rgba(255,255,255,.6)'); hg.addColorStop(1, game === 'apex' ? 'rgba(226,55,31,.22)' : game === 'other' ? 'rgba(63,180,208,.24)' : 'rgba(201,164,92,.3)'); x.fillStyle = hg; x.fillRect(hx - 118, hy - 118, 236, 236);
  x.strokeStyle = '#fff'; x.globalAlpha = .34; for (let i = 0; i < 27; i++) { x.beginPath(); x.arc(hx, hy, 6 + i * 4.3, 0, Math.PI * 2); x.stroke(); } x.restore();
  // 欄の名前つきの値
  const lab = (t, X, Y) => { x.save(); x.fillStyle = T.sub; x.font = '500 19px "IBM Plex Mono"'; x.fillText(t, X, Y); x.restore(); };
  const mark = (X, Y) => { x.fillStyle = T.accent; if (game !== 'deadlock') x.fillRect(X, Y - 15, 8, 15); else { x.save(); x.translate(X + 5, Y - 8); x.rotate(Math.PI / 4); x.fillRect(-5, -5, 10, 10); x.restore(); } };
  if (clip.holder || TPL) { const HX = 744, HY = 776, HW = 232, HH = 280; x.fillStyle = T.frame; x.fillRect(HX - 5, HY - 5, HW + 10, HH + 10);
    if (TPL) { x.fillStyle = T.holder[1]; x.fillRect(HX, HY, HW, HH); } else x.drawImage(engrave(clip.holder, HW, HH, { lines: 3, ramp: T.holder }), HX, HY); x.fillStyle = T.accent; x.fillRect(HX - 5, HY + HH + 5, HW + 10, 6); lab('holder / 所持者', HX, HY - 14); }
  mark(52, 800); lab(clip.kind || 'legend / レジェンド', 68, 800); x.fillStyle = T.ink; let nf = 150; if (!TPL) { x.font = `800 ${nf}px "Antonio"`; while (x.measureText(clip.legend).width > 670 && nf > 80) { nf -= 6; x.font = `800 ${nf}px "Antonio"`; } x.fillText(clip.legend, 46, 930); }
  mark(52, 978); lab('recorded / 記録日', 68, 978); mark(420, 978); lab('length / 長さ', 436, 978);
  x.fillStyle = T.ink; x.font = '500 38px "IBM Plex Mono"'; if (!TPL) { x.fillText(clip.d, 52, 1024); x.fillText(`${clip.dur}s`, 420, 1024); }
  mark(52, 1086); lab('signature / 署名', 68, 1086);
  if (!TPL && clip.src === 'stamp') { x.save(); x.translate(FW - 290, 1094); x.rotate(-.08); x.strokeStyle = T.stamp; x.lineWidth = 4; x.strokeRect(0, 0, 250, 54); x.lineWidth = 1.5; x.strokeRect(6, 6, 238, 42);
    x.fillStyle = T.stamp; x.font = '700 34px "Antonio"'; x.fillText('TIMESTAMP', 20, 41); x.restore(); }
  if (!TPL) { let fs = 62, lines; do { x.font = `600 ${fs}px "Klee One"`; lines = wrap(x, clip.t, FW - 120); fs -= 2; } while (lines.length > 3 && fs > 40);
  x.fillStyle = T.ink; const lh = fs * 1.14; lines.slice(0, 3).forEach((l, i) => { x.save(); x.translate(54, 1150 + fs * .2 + i * lh); x.rotate(i % 2 ? .008 : -.01); x.fillText(l, 0, 0); x.restore(); }); }
  // 差し込む側（下端）: チップと認証の貼り、機械読み取りの行
  const cx = 52, cy = 1380, cw = 140, chh = 110; const cg = x.createLinearGradient(cx, cy, cx + cw, cy + chh); cg.addColorStop(0, '#dcc68f'); cg.addColorStop(.5, '#a3854a'); cg.addColorStop(1, '#e6d6a5');
  x.fillStyle = cg; rr(x, cx, cy, cw, chh, 14); x.fill(); x.strokeStyle = T.chipLine; x.lineWidth = 3; x.beginPath();
  [[46, 0, 46, chh], [94, 0, 94, chh], [0, 38, 46, 38], [0, 72, 46, 72], [94, 38, cw, 38], [94, 72, cw, 72]].forEach(([a, b, c2, d]) => { x.moveTo(cx + a, cy + b); x.lineTo(cx + c2, cy + d); }); x.stroke();
  { const KX = 600, KY = 1352, KW = 372, KH = 150; x.save(); rr(x, KX, KY, KW, KH, 18); x.clip();
    const kg = x.createLinearGradient(KX, KY, KX + KW, KY + KH); if (game !== 'deadlock') { kg.addColorStop(0, '#c9ccd2'); kg.addColorStop(.45, '#f3f1ec'); kg.addColorStop(.55, game === 'other' ? '#9fd6e3' : '#e9a596'); kg.addColorStop(1, '#bfc4cb'); } else { kg.addColorStop(0, '#b08a46'); kg.addColorStop(.45, '#f2dfa8'); kg.addColorStop(.55, '#9fbfa6'); kg.addColorStop(1, '#a8873f'); }
    x.fillStyle = kg; x.fillRect(KX, KY, KW, KH);
    x.strokeStyle = 'rgba(255,255,255,.5)'; x.lineWidth = 1.2; for (let t = -KH; t < KW; t += 7) { x.beginPath(); x.moveTo(KX + t, KY + KH); x.lineTo(KX + t + KH * .7, KY); x.stroke(); }
    x.strokeStyle = 'rgba(0,0,0,.18)'; for (let r = 10; r < 120; r += 9) { x.beginPath(); x.arc(KX + KW - 70, KY + KH / 2, r, 0, Math.PI * 2); x.stroke(); }
    x.fillStyle = 'rgba(0,0,0,.42)'; x.font = '800 54px "Antonio"'; x.fillText(game === 'apex' ? 'APEX GAMES' : game === 'other' ? 'CLIPSHELF' : 'DEADLOCK', KX + 22, KY + 92); x.restore();
    x.strokeStyle = 'rgba(0,0,0,.25)'; x.lineWidth = 2; rr(x, KX, KY, KW, KH, 18); x.stroke(); }
  if (!TPL) {
  { x.save(); x.font = '500 13px "IBM Plex Mono"'; x.fillStyle = T.micro; let m = ''; while (x.measureText(m).width < FW - 104) m += `${clip.legend}·${NO}·${(clip.sp || '') + (clip.sn || '')}·`; x.fillText(m, 52, 1508); x.restore(); }
  { x.save(); x.translate(FW - 30, 1300); x.rotate(-Math.PI / 2); x.font = '500 22px "IBM Plex Mono"'; x.fillStyle = T.sub; x.fillText(`SN ${NO} · ${clip.d}`, 0, 0); x.restore(); }
  x.fillStyle = T.mrz; x.font = '500 34px "IBM Plex Mono"';
  const z = s => s.padEnd(34, '<').slice(0, 34); x.fillText(z(`CLIP<${clip.legend.replace(/ /g, '<')}<<${(clip.sp || '') + (clip.sn || '')}<<${NO}`), 52, 1540); x.fillText(z(`${clip.d.replace(/\./g, '')}<${String(clip.dur).padStart(4, '0')}<<${game === 'apex' ? 'APEX' : game === 'other' ? 'MISC' : 'DLCK'}`), 52, 1580);
  }
  if (!TPL) matrixCode(x, 618, 940, 104, clip.no, T.ink);
  if (!TPL && game === 'deadlock') { const bits = clip.no.toString(2).padStart(13, '0'); x.save(); x.fillStyle = 'rgba(22,52,40,.88)';
    for (let i = 0; i < 13; i++) { const Y = 300 + i * 34; x.strokeStyle = 'rgba(22,52,40,.35)'; x.lineWidth = 1.5; rr(x, 14, Y, 18, 24, 7); x.stroke(); if (bits[i] === '1') { rr(x, 14, Y, 18, 24, 7); x.fill(); } } x.restore(); }
  edgeContacts(x, FH - 30, 30);
  return cv;
}
export const MRZ = clip => `CLIP<${clip.legend}<<${clip.s}<<${String(clip.no).padStart(3, '0')}<<${clip.d.replace(/\./g, '')}`;
