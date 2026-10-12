/* ============================================================
   Birthday for my baby — Interactive Story
   ============================================================ */

/* ✏️ CHỈNH SỬA TẠI ĐÂY ĐỂ CÁ NHÂN HOÁ */
const CONFIG = {
  nickname: "em bé",            // cách gọi trong lời thoại: "Hé lu em bé của anh!"
  name: "Em Bé",                // tên hiển thị ở tiêu đề Happy Birthday (có thể ghi tên thật)
  sign: "Người yêu của em ❤",   // chữ ký cuối thư
  musicVolume: 0.22,
};

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const rand = (a, b) => Math.random() * (b - a) + a;
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const reduceMotion = false; // Luôn đảm bảo hiệu ứng tim rơi, pháo hoa mượt mà nhất
const isTouch = matchMedia("(pointer: coarse)").matches;
// Phải khớp với media query 2 cột trong style.css
const wideMQ = matchMedia("(orientation: landscape) and (min-width: 860px), (orientation: landscape) and (min-width: 560px) and (max-height: 520px)");
const isWide = () => wideMQ.matches;

/* ---------- Cá nhân hoá văn bản ---------- */
$$(".nick").forEach(el => (el.textContent = CONFIG.nickname));
$$(".nick-name").forEach(el => (el.textContent = CONFIG.name));
$("#sign").textContent = CONFIG.sign;

/* ============================================================
   ÂM THANH (Web Audio — không cần file nhạc)
   ============================================================ */
const Sound = (() => {
  let ctx = null, musicGain = null, loopTimer = null, playing = false, userMuted = false;
  const btn = $("#music-btn"), label = $("#music-label");

  const ensure = () => {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  };

  const note = (dest, freq, t, dur, vol) => {
    [[1, vol], [2, vol * .25], [3, vol * .08]].forEach(([mult, v]) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.value = freq * mult;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(v, t + .015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(dest);
      o.start(t); o.stop(t + dur + .05);
    });
  };

  // Happy Birthday — giai điệu hộp nhạc
  const F = { G4: 392, A4: 440, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99 };
  const MELODY = [
    ["G4", .75], ["G4", .25], ["A4", 1], ["G4", 1], ["C5", 1], ["B4", 2],
    ["G4", .75], ["G4", .25], ["A4", 1], ["G4", 1], ["D5", 1], ["C5", 2],
    ["G4", .75], ["G4", .25], ["G5", 1], ["E5", 1], ["C5", 1], ["B4", 1], ["A4", 1],
    ["F5", .75], ["F5", .25], ["E5", 1], ["C5", 1], ["D5", 1], ["C5", 2],
  ];
  const BEAT = 0.5;

  const playOnce = () => {
    if (!playing || !ctx) return;
    musicGain = ctx.createGain();
    musicGain.gain.value = CONFIG.musicVolume;
    musicGain.connect(ctx.destination);
    let t = ctx.currentTime + .1;
    MELODY.forEach(([n, beats]) => {
      note(musicGain, F[n], t, beats * BEAT * 1.6, .5);
      t += beats * BEAT;
    });
    loopTimer = setTimeout(playOnce, (t - ctx.currentTime + 2.5) * 1000);
  };

  const setUI = on => {
    btn.classList.toggle("playing", on);
    btn.setAttribute("aria-pressed", String(on));
    label.textContent = on ? "Đang phát" : "Bật nhạc";
  };

  const start = () => {
    if (playing || userMuted || !ensure()) return;
    playing = true; setUI(true); playOnce();
  };
  const stop = () => {
    playing = false; clearTimeout(loopTimer);
    if (musicGain) { musicGain.disconnect(); musicGain = null; }
    setUI(false);
  };

  btn.addEventListener("click", () => {
    if (playing) { userMuted = true; stop(); }
    else { userMuted = false; start(); }
  });
  setUI(false);

  /* Hiệu ứng âm thanh ngắn */
  const sweep = (f1, f2, dur, vol = .15, type = "sine") => {
    if (!ensure()) return;
    const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime;
    o.type = type; o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + dur + .02);
  };
  const noise = (dur, vol, freq = 1200, delay = 0) => {
    if (!ensure()) return;
    const len = Math.floor(ctx.sampleRate * dur), buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(), t = ctx.currentTime + delay;
    s.buffer = buf; f.type = "bandpass"; f.frequency.value = freq; g.gain.value = vol;
    s.connect(f); f.connect(g); g.connect(ctx.destination); s.start(t);
  };

  return {
    start,
    pop() { sweep(520, 980, .12, .12); },
    sparkle() { sweep(1200, 2400, .25, .06); setTimeout(() => sweep(1600, 2800, .2, .05), 90); },
    stamp() { sweep(160, 40, .25, .35, "triangle"); noise(.12, .25, 500); },
    clap() { for (let i = 0; i < 14; i++) noise(.06, .25, rand(1200, 2600), i * rand(.05, .12)); },
    puff() { noise(.35, .12, 700); },
    unroll() { noise(1.8, .07, 900); },
    tada() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => sweep(f, f * 1.01, .35, .12, "triangle"), i * 110)); },
    rocket() {
      sweep(260, 920, .38, .12, "sine");
      noise(.22, .08, 1400);
    },
    firework() {
      sweep(160, 36, .35, .32, "triangle");
      noise(.45, .28, 480);
      setTimeout(() => {
        sweep(720, 180, .22, .14);
        noise(.18, .14, 1200);
      }, 70);
    },
  };
})();

/* ============================================================
   HIỆU ỨNG: tim bay nền, tim nổ, confetti
   ============================================================ */
const heartsLayer = $("#hearts-layer");
const EMOJIS = ["💖", "💗", "💕", "🌸", "✨", "🎀", "🧸", "💝", "🍓"];

function spawnFloatHeart() {
  if (document.hidden || heartsLayer.childElementCount > 24) return;
  const el = document.createElement("span");
  el.className = "float-heart";
  el.textContent = pick(EMOJIS);
  el.style.left = rand(0, 100) + "vw";
  el.style.fontSize = rand(14, 30) + "px";
  el.style.animationDuration = rand(9, 17) + "s";
  el.style.setProperty("--sway", rand(-60, 60) + "px");
  el.style.setProperty("--rot", rand(-40, 40) + "deg");
  heartsLayer.appendChild(el);
  el.addEventListener("animationend", () => el.remove());
}
if (!reduceMotion) setInterval(spawnFloatHeart, isTouch ? 1500 : 900);

function burstHearts(x, y, n = 12) {
  if (reduceMotion) return;
  for (let i = 0; i < n; i++) {
    const el = document.createElement("span");
    el.className = "burst-heart";
    el.textContent = pick(EMOJIS.slice(0, 5));
    el.style.left = x + "px"; el.style.top = y + "px";
    const ang = rand(0, Math.PI * 2), dist = rand(60, 170);
    el.style.setProperty("--dx", Math.cos(ang) * dist + "px");
    el.style.setProperty("--dy", Math.sin(ang) * dist - 60 + "px");
    el.style.setProperty("--rot", rand(-60, 60) + "deg");
    el.style.fontSize = rand(18, 32) + "px";
    document.body.appendChild(el);
    el.addEventListener("animationend", () => el.remove());
  }
}

/* ============================================================
   HỆ THỐNG PHÁO HOA & PHÁO GIẤY RỰC RỠ (FIREWORKS ENGINE V2)
   - Tên lửa bay vút có vệt khói lấp lánh (spark smoke trail)
   - Pháo hoa chùm sao có đuôi sáng dài (motion trail lines)
   - Pháo hoa hình trái tim (heart firework) nở to lung linh
   - Mưa sao vàng thác nước (kamuro golden willow)
   - Vòng hào quang phát sáng (shockwave rings) & chớp bầu trời
   - Đại bác pháo giấy kim tuyến 3D tung bay (3D tumbling confetti)
   - Chế độ Ambient Celebration tự động duy trì pháo hoa ở màn cuối
   ============================================================ */
const Fireworks = (() => {
  const cv = $("#confetti"), c = cv.getContext("2d");
  let rockets = [], sparks = [], shockwaves = [], confetti = [];
  let raf = null, W = 0, H = 0, dpr = 1;
  let ambientTimer = null;

  // Bảng màu bão hòa cao, rực rỡ và lấp lánh trên nền sáng
  const PALETTES = {
    heart: ["#ff007f", "#ff1493", "#ff4081", "#ff77a9", "#ffd166", "#ffffff"],
    gold: ["#ffd700", "#ffaa00", "#ffb703", "#fff3b0", "#ff8800", "#ffffff"],
    vibrant: ["#ff006e", "#8338ec", "#3a86ff", "#06d6a0", "#ffbe0b", "#fb5607", "#ffffff"],
    rainbow: ["#e8175d", "#7928ca", "#00cec9", "#f39c12", "#ff007f", "#00b894", "#ffffff"],
  };
  const ALL_COLORS = [...new Set(Object.values(PALETTES).flat())];

  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = cv.width = innerWidth * dpr;
    H = cv.height = innerHeight * dpr;
  };
  resize();
  addEventListener("resize", resize);

  // Hiệu ứng chớp sáng bầu trời
  function flashSky() {
    const el = $("#sky-flash");
    if (!el) return;
    el.classList.add("flash");
    setTimeout(() => el.classList.remove("flash"), 75);
  }

  // 1. Phóng tên lửa pháo hoa bay lên từ dưới
  function launchRocket(sxRatio, txRatio, tyRatio, color, type = "sphere") {
    resize();
    Sound.rocket();
    const sx = sxRatio * W;
    const tx = txRatio * W;
    const ty = tyRatio * H;
    const distY = H + 10 - ty;
    const frames = Math.max(22, Math.min(36, Math.floor(distY / (22 * dpr))));

    rockets.push({
      x: sx,
      y: H + 10,
      tx, ty,
      vx: (tx - sx) / frames,
      vy: (ty - (H + 10)) / frames,
      color: color || pick(ALL_COLORS),
      trail: [],
      maxTrail: 10,
      life: frames,
      type, // "heart", "willow", "sphere"
    });
    if (!raf) raf = requestAnimationFrame(loop);
  }

  // 2. Nổ pháo hoa tại (x, y)
  function explode(x, y, baseColor, type = "sphere", count = 90) {
    Sound.firework();
    flashSky();

    // Vòng hào quang phát sáng nở bung
    shockwaves.push({
      x, y,
      r: 4 * dpr,
      maxR: rand(50, 85) * dpr,
      alpha: 0.9,
      color: baseColor || pick(ALL_COLORS),
      width: 4 * dpr
    });

    if (type === "heart") {
      // Pháo hoa bung tỏa hình trái tim ngọt ngào
      const heartCount = Math.floor(count * 0.95);
      const palette = PALETTES.heart;
      for (let i = 0; i < heartCount; i++) {
        const t = (i / heartCount) * Math.PI * 2;
        // Đường cong trái tim tham số
        const hx = 16 * Math.pow(Math.sin(t), 3);
        const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        const spread = rand(0.55, 0.78) * dpr;
        sparks.push({
          x, y,
          vx: hx * 0.35 * spread,
          vy: hy * 0.35 * spread,
          trail: [],
          maxTrail: 7,
          color: Math.random() < 0.28 ? "#ffffff" : pick(palette),
          alpha: 1,
          decay: rand(0.012, 0.018),
          size: rand(3.2, 5.2) * dpr,
          gravity: 0.065 * dpr,
          friction: 0.972,
          twinkle: true,
        });
      }
    } else if (type === "willow") {
      // Pháo hoa mưa sao vàng thác nước rủ xuống
      const palette = PALETTES.gold;
      for (let i = 0; i < count; i++) {
        const angle = rand(0, Math.PI * 2);
        const speed = rand(2.5, 9.5) * dpr;
        sparks.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.5 * dpr,
          trail: [],
          maxTrail: 11,
          color: Math.random() < 0.25 ? "#ffffff" : pick(palette),
          alpha: 1,
          decay: rand(0.008, 0.014),
          size: rand(3, 4.8) * dpr,
          gravity: 0.095 * dpr,
          friction: 0.965,
          twinkle: true,
        });
      }
    } else {
      // Chùm pháo hoa tròn sao băng rực rỡ 360 độ
      const palette = pick([PALETTES.vibrant, PALETTES.rainbow, PALETTES.heart]);
      for (let i = 0; i < count; i++) {
        const angle = rand(0, Math.PI * 2);
        const speed = rand(3, 13) * dpr;
        sparks.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          trail: [],
          maxTrail: 8,
          color: Math.random() < 0.22 ? "#ffffff" : (baseColor || pick(palette)),
          alpha: 1,
          decay: rand(0.012, 0.022),
          size: rand(3, 5.5) * dpr,
          gravity: 0.115 * dpr,
          friction: 0.962,
          twinkle: Math.random() < 0.7,
        });
      }
    }

    if (!raf) raf = requestAnimationFrame(loop);
  }

  // 3. Đại bác pháo giấy kim tuyến 3D tung bay (Confetti Cannons)
  function blastCannons(power = 22) {
    const leftX = 0.04 * W, rightX = 0.96 * W, bottomY = H + 10;
    const count = Math.floor(rand(55, 75));
    // Đại bác góc trái bắn chéo sang phải lên cao
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI / 3 + rand(-0.35, 0.35);
      const speed = rand(15, power) * dpr;
      addConfettiPiece(leftX, bottomY, Math.cos(angle) * speed, Math.sin(angle) * speed);
    }
    // Đại bác góc phải bắn chéo sang trái lên cao
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI * 2 / 3 + rand(-0.35, 0.35);
      const speed = rand(15, power) * dpr;
      addConfettiPiece(rightX, bottomY, Math.cos(angle) * speed, Math.sin(angle) * speed);
    }
    if (!raf) raf = requestAnimationFrame(loop);
  }

  function addConfettiPiece(x, y, vx, vy) {
    confetti.push({
      x, y, vx, vy,
      w: rand(9, 17) * dpr,
      h: rand(12, 24) * dpr,
      color: pick(ALL_COLORS),
      rot: rand(0, Math.PI * 2),
      vrot: rand(-0.18, 0.18),
      tilt: rand(0, Math.PI * 2),
      vtilt: rand(0.08, 0.22),
      wobble: rand(0, 6.28),
      life: rand(140, 240),
      gravity: 0.22 * dpr,
    });
  }

  function burstConfetti(xr, yr, count = 75, angle = -Math.PI / 2, spread = Math.PI * 2, power = 17) {
    const cx = xr * W, cy = yr * H;
    for (let i = 0; i < count; i++) {
      const a = angle + rand(-spread / 2, spread / 2);
      const v = rand(power * 0.4, power) * dpr;
      addConfettiPiece(cx, cy, Math.cos(a) * v, Math.sin(a) * v);
    }
    if (!raf) raf = requestAnimationFrame(loop);
  }

  // Animation Loop chính
  function loop() {
    c.clearRect(0, 0, W, H);

    // A. Vẽ Rockets bay lên
    for (let i = rockets.length - 1; i >= 0; i--) {
      const r = rockets[i];
      r.life--;
      r.trail.push({ x: r.x, y: r.y });
      if (r.trail.length > r.maxTrail) r.trail.shift();

      r.x += r.vx;
      r.y += r.vy;

      // Vẽ vệt đuôi tên lửa phát sáng
      if (r.trail.length > 1) {
        c.beginPath();
        c.moveTo(r.trail[0].x, r.trail[0].y);
        for (let t = 1; t < r.trail.length; t++) {
          c.lineTo(r.trail[t].x, r.trail[t].y);
        }
        c.strokeStyle = r.color;
        c.lineWidth = 4 * dpr;
        c.lineCap = "round";
        c.stroke();
      }

      // Đầu tên lửa trắng sáng
      c.beginPath();
      c.arc(r.x, r.y, 4 * dpr, 0, Math.PI * 2);
      c.fillStyle = "#ffffff";
      c.shadowColor = r.color;
      c.shadowBlur = 12 * dpr;
      c.fill();

      // Thả tàn lửa nhỏ phía sau
      if (Math.random() < 0.6) {
        sparks.push({
          x: r.x + rand(-3, 3) * dpr,
          y: r.y + rand(3, 8) * dpr,
          vx: rand(-1, 1) * dpr,
          vy: rand(0.5, 2.5) * dpr,
          trail: [],
          maxTrail: 3,
          color: "#ffd166",
          alpha: 0.8,
          decay: 0.05,
          size: rand(2, 3.5) * dpr,
          gravity: 0.1 * dpr,
          friction: 0.95,
          twinkle: true,
        });
      }

      if (r.life <= 0) {
        rockets.splice(i, 1);
        explode(r.tx, r.ty, r.color, r.type, 95);
      }
    }

    // B. Vẽ Shockwave Rings (Vòng hào quang nổ)
    for (let i = shockwaves.length - 1; i >= 0; i--) {
      const sw = shockwaves[i];
      sw.r += (sw.maxR - sw.r) * 0.16 + 1.2 * dpr;
      sw.alpha *= 0.88;
      if (sw.alpha < 0.02 || sw.r >= sw.maxR) {
        shockwaves.splice(i, 1);
        continue;
      }
      c.save();
      c.beginPath();
      c.arc(sw.x, sw.y, sw.r, 0, Math.PI * 2);
      c.strokeStyle = sw.color;
      c.globalAlpha = sw.alpha;
      c.lineWidth = sw.width * sw.alpha;
      c.shadowColor = sw.color;
      c.shadowBlur = 10 * dpr;
      c.stroke();
      c.restore();
    }

    // C. Vẽ Sparks chùm sao pháo hoa với vệt sáng lộng lẫy (Motion Trails)
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.vx *= s.friction;
      s.vy *= s.friction;
      s.vy += s.gravity;
      s.x += s.vx;
      s.y += s.vy;
      s.alpha -= s.decay;

      s.trail.push({ x: s.x, y: s.y });
      if (s.trail.length > s.maxTrail) s.trail.shift();

      if (s.alpha <= 0) {
        sparks.splice(i, 1);
        continue;
      }

      c.save();
      c.globalAlpha = Math.max(0, s.alpha);

      // Vệt sáng kéo dài (motion trail)
      if (s.trail.length > 1) {
        c.beginPath();
        c.moveTo(s.trail[0].x, s.trail[0].y);
        for (let t = 1; t < s.trail.length; t++) {
          c.lineTo(s.trail[t].x, s.trail[t].y);
        }
        c.strokeStyle = s.color;
        c.lineWidth = s.size * 0.85;
        c.lineCap = "round";
        c.stroke();
      }

      // Hạt đầu phát sáng
      c.beginPath();
      const rad = s.size * (s.twinkle && Math.random() < 0.35 ? 1.5 : 1);
      c.arc(s.x, s.y, rad, 0, Math.PI * 2);
      c.fillStyle = s.color;
      c.shadowColor = s.color;
      c.shadowBlur = 10 * dpr;
      c.fill();

      // Tâm trắng chói sáng
      c.beginPath();
      c.arc(s.x, s.y, Math.max(1, rad * 0.4), 0, Math.PI * 2);
      c.fillStyle = "#ffffff";
      c.fill();

      c.restore();
    }

    // D. Vẽ Pháo giấy kim tuyến 3D (3D tumbling confetti)
    for (let i = confetti.length - 1; i >= 0; i--) {
      const p = confetti[i];
      p.vy += p.gravity;
      p.vx *= 0.985;
      p.x += p.vx + Math.sin(p.wobble) * 0.6 * dpr;
      p.y += p.vy;
      p.rot += p.vrot;
      p.tilt += p.vtilt;
      p.wobble += 0.08;
      p.life--;

      if (p.life <= 0 || p.y > H + 50) {
        confetti.splice(i, 1);
        continue;
      }

      c.save();
      c.translate(p.x, p.y);
      c.rotate(p.rot);
      c.scale(1, Math.cos(p.tilt)); // 3D Flip
      c.fillStyle = p.color;
      c.globalAlpha = Math.min(1, p.life / 30);
      c.shadowColor = "rgba(0,0,0,0.12)";
      c.shadowBlur = 4 * dpr;
      c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      c.restore();
    }

    if (rockets.length > 0 || sparks.length > 0 || shockwaves.length > 0 || confetti.length > 0) {
      raf = requestAnimationFrame(loop);
    } else {
      c.clearRect(0, 0, W, H);
      raf = null;
    }
  }

  // ĐẠI TIỆC PHÁO HOA 6 GIAI ĐOẠN HOÀNH TRÁNG (>4.5 GIÂY)
  function grandShow() {
    resize();
    blastCannons(23);

    // Giai đoạn 1 (0ms): 2 quả tên lửa vút lên nổ Trái tim hồng & Mưa sao vàng
    launchRocket(0.3, 0.35, 0.28, "#ff007f", "heart");
    launchRocket(0.7, 0.65, 0.28, "#ffd700", "willow");

    // Giai đoạn 2 (400ms): Thổi thêm đại bác confetti từ 2 góc bay vồng lên cao
    setTimeout(() => {
      blastCannons(25);
      launchRocket(0.5, 0.5, 0.22, "#3a86ff", "sphere");
    }, 400);

    // Giai đoạn 3 (950ms): 2 quả pháo hoa chéo cánh nổ lung linh rực rỡ
    setTimeout(() => {
      launchRocket(0.18, 0.28, 0.35, "#ff006e", "sphere");
      launchRocket(0.82, 0.72, 0.35, "#06d6a0", "willow");
      burstConfetti(0.5, 0.3, 80, -Math.PI / 2, Math.PI * 2, 16);
    }, 950);

    // Giai đoạn 4 (1700ms): Quả pháo hoa khổng lồ hình trái tim rực đỏ giữa trời
    setTimeout(() => {
      launchRocket(0.5, 0.5, 0.2, "#ff0055", "heart");
    }, 1700);

    // Giai đoạn 5 (2500ms): Thác nước vàng cascade lung linh rủ xuống
    setTimeout(() => {
      launchRocket(0.32, 0.38, 0.26, "#ffd700", "willow");
      launchRocket(0.68, 0.62, 0.26, "#ffbe0b", "willow");
      blastCannons(21);
    }, 2500);

    // Giai đoạn 6 (3400ms): Trận địa pháo hoa kết màn đại tiệc rực rỡ
    setTimeout(() => {
      launchRocket(0.25, 0.3, 0.25, "#8338ec", "sphere");
      launchRocket(0.5, 0.5, 0.18, "#ff007f", "heart");
      launchRocket(0.75, 0.7, 0.25, "#ffbe0b", "sphere");
      burstConfetti(0.5, 0.35, 110, -Math.PI / 2, Math.PI * 2, 18);
    }, 3400);
  }

  // Khởi động đại tiệc pháo hoa & duy trì ambient pháo hoa định kỳ
  function startFinale() {
    grandShow();
    stopAmbient();
    ambientTimer = setInterval(() => {
      if (current === 7 && !document.hidden) {
        const sx = rand(0.2, 0.8);
        const tx = sx + rand(-0.12, 0.12);
        const ty = rand(0.18, 0.38);
        const types = ["heart", "sphere", "willow", "heart"];
        const t = pick(types);
        launchRocket(sx, tx, ty, null, t);
      }
    }, 2300);
  }

  function stopAmbient() {
    if (ambientTimer) {
      clearInterval(ambientTimer);
      ambientTimer = null;
    }
  }

  return {
    launchRocket,
    explode,
    blastCannons,
    burstConfetti,
    burst(xr, yr, n, a, s, p) { burstConfetti(xr, yr, n, a, s, p); },
    celebrate() { grandShow(); },
    grandShow,
    startFinale,
    stopAmbient,
    fireAt(clientX, clientY) {
      resize();
      const txRatio = clientX / innerWidth;
      const tyRatio = clientY / innerHeight;
      const sxRatio = Math.max(0.1, Math.min(0.9, txRatio + rand(-0.08, 0.08)));
      launchRocket(sxRatio, txRatio, tyRatio, pick(ALL_COLORS), Math.random() < 0.5 ? "heart" : "sphere");
      burstConfetti(txRatio, tyRatio, 35, -Math.PI / 2, Math.PI * 2, 12);
    }
  };
})();
const Confetti = Fireworks; // Tương thích với các gọi hàm Confetti cũ

/* ============================================================
   CON TRỎ TIM RƠI (canvas — mượt cả trên điện thoại)
   ============================================================ */
const HeartTrail = (() => {
  const cv = $("#fx"), c = cv.getContext("2d");
  const COLORS = ["#ff6b9d", "#ff8fb5", "#ffb3c9", "#e8407a", "#c9a7ff", "#ffa3c4"];
  // Trái tim đơn vị (rộng ~2, cao ~1.85, tâm 0,0)
  const HEART = new Path2D("M0 0.85C0 0.85 -1 0.2 -1 -0.35C-1 -0.75 -0.7 -1 -0.4 -1C-0.2 -1 -0.07 -0.88 0 -0.72C0.07 -0.88 0.2 -1 0.4 -1C0.7 -1 1 -0.75 1 -0.35C1 0.2 0 0.85 0 0.85Z");
  const MAX = isTouch ? 50 : 90;
  let parts = [], raf = null, dpr = 1;

  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
  };
  resize(); addEventListener("resize", resize);

  function add(x, y, big = false) {
    if (parts.length >= MAX) parts.shift();
    parts.push({
      x, y,
      vx: big ? rand(-2.2, 2.2) : rand(-.5, .5),
      vy: big ? rand(-4, -1.5) : rand(-.3, .6),
      s: big ? rand(8, 13) : rand(5, 9.5),
      rot: rand(-.4, .4), vr: rand(-.03, .03),
      life: 0, max: rand(55, 95), ph: rand(0, 6.28),
      color: pick(COLORS),
    });
    if (!raf) raf = requestAnimationFrame(tick);
  }

  function tick() {
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, cv.width, cv.height);
    parts = parts.filter(p => p.life < p.max);
    for (const p of parts) {
      p.life++;
      p.vy = Math.min(p.vy + .07, 2.4);                 // rơi nhẹ nhàng
      p.x += p.vx + Math.sin(p.ph + p.life * .09) * .45; // đung đưa
      p.y += p.vy;
      p.vx *= .97;
      p.rot += p.vr;
      const t = p.life / p.max;
      const alpha = t < .1 ? t / .1 : 1 - Math.max(0, (t - .55) / .45);
      const sc = p.s * dpr * (t < .15 ? .4 + (t / .15) * .6 : 1);
      const cos = Math.cos(p.rot) * sc, sin = Math.sin(p.rot) * sc;
      c.setTransform(cos, sin, -sin, cos, p.x * dpr, p.y * dpr);
      c.globalAlpha = alpha;
      c.fillStyle = p.color;
      c.fill(HEART);
      c.globalAlpha = alpha * .6;
      c.fillStyle = "#fff";
      c.beginPath(); c.ellipse(-.45, -.45, .22, .13, -.6, 0, 6.3); c.fill();
    }
    c.globalAlpha = 1;
    if (parts.length) raf = requestAnimationFrame(tick);
    else { c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cv.width, cv.height); raf = null; }
  }

  if (!reduceMotion) {
    let lx = null, ly = null, acc = 0;
    addEventListener("pointermove", e => {
      const x = e.clientX, y = e.clientY;
      if (lx === null) { lx = x; ly = y; return; }
      acc += Math.hypot(x - lx, y - ly);
      lx = x; ly = y;
      const step = e.pointerType === "touch" ? 24 : 16;
      let n = 0;
      while (acc > step && n < 3) { acc -= step; n++; add(x + rand(-5, 5), y + 8 + rand(-3, 3)); }
      if (acc > step) acc = 0;
    }, { passive: true });
    addEventListener("pointerdown", e => {
      lx = e.clientX; ly = e.clientY;
      for (let i = 0; i < 6; i++) add(e.clientX, e.clientY, true);
    }, { passive: true });
    document.addEventListener("pointerleave", () => { lx = null; });
  }
  return { add };
})();

/* ============================================================
   ĐIỀU KHIỂN CÁC MÀN
   ============================================================ */
const scenes = $$(".scene");
const dots = $$("#progress li");
let current = 0;
let wishSummary = "";
let letterTimer = null;

function updateProgress() {
  dots.forEach((d, i) => {
    d.classList.toggle("done", i < current);
    d.classList.toggle("now", i === current);
  });
}

const hooks = {
  1: () => runLoader(),
  6: () => {
    // Màn 7 (Bánh sinh nhật): chuẩn bị nến và hướng dẫn
    resetCake();
  },
  7: () => {
    // Màn 8 (Finale - Món quà cuối cùng): ĐẠI TIỆC PHÁO HOA RỰC RỠ BÙNG NỔ!
    Fireworks.startFinale();
    Sound.tada();
    Sound.clap();

    $("#wish-recap").hidden = !wishSummary;
    $("#wish-recap-text").textContent = wishSummary;
    // Tự động mở cuộn thư sau khi pháo hoa bùng nổ (để bạn nữ ngắm trọn pháo hoa mở màn)
    if (isWide()) letterTimer = setTimeout(openLetter, 1600);
    else letterTimer = setTimeout(openLetter, 4500);
  },
};

function goTo(n) {
  if (n < 0 || n >= scenes.length || n === current) return;
  Fireworks.stopAmbient();
  const old = scenes[current];
  old.classList.remove("active");
  old.classList.add("exit");
  setTimeout(() => old.classList.remove("exit"), 300);

  current = n;
  updateProgress();
  setTimeout(() => {
    scenes[n].classList.add("active");
    window.scrollTo(0, 0);
    if (hooks[n]) hooks[n]();
  }, 220);
}

/* Nút "next" chung */
$$("[data-next]").forEach(b =>
  b.addEventListener("click", e => {
    if (b.disabled) return;
    Sound.start();            // trình duyệt cần 1 cú chạm trước khi phát nhạc
    Sound.pop();
    burstHearts(e.clientX || innerWidth / 2, e.clientY || innerHeight / 2, 8);
    goTo(current + 1);
  })
);

/* ---------- Màn 2: thanh loading 99% ---------- */
let loaderTimer = null;
function runLoader() {
  const fill = $("#loader-fill"), text = $("#loader-text"), btn = $("#btn-wait");
  const lines = [
    "Đang nạp {p}% yêu thương...",
    "Đang gói quà bằng ruy băng hồng... {p}%",
    "Đang xin ông trời cho em thêm xinh... {p}%",
    "Sắp xong rồi, đừng nhìn trộm nha... {p}%",
  ];
  let p = 0;
  btn.disabled = true;
  clearInterval(loaderTimer);
  loaderTimer = setInterval(() => {
    p = Math.min(99, p + rand(1.5, 4.5));
    const pi = Math.floor(p);
    fill.style.width = pi + "%";
    text.textContent = lines[Math.min(lines.length - 1, Math.floor(pi / 26))].replace("{p}", pi);
    if (pi >= 99) {
      clearInterval(loaderTimer);
      btn.disabled = false;
      Sound.sparkle();
    }
  }, 120);
}

/* ---------- Màn 3: nút "Em quên thật" chạy trốn ---------- */
const runaway = (() => {
  const run = $("#btn-runaway");
  let dodges = 0;
  const flee = e => {
    if (dodges >= 5) return;
    e.preventDefault();
    dodges++;
    Sound.pop();
    const maxX = Math.max(40, Math.min(innerWidth / 2 - 110, 140));
    run.style.translate = `${rand(-maxX, maxX)}px ${rand(-60, 30)}px`;
    if (dodges === 5) {
      run.textContent = "Thôi em nhớ rồi mà 🥹";
      run.style.translate = "0 0";
    }
  };
  run.addEventListener("pointerenter", e => { if (e.pointerType === "mouse") flee(e); });
  run.addEventListener("pointerdown", flee);
  run.addEventListener("click", e => {
    if (dodges < 5) return e.preventDefault();
    Sound.start(); Sound.pop(); goTo(current + 1);
  });
  return {
    reset() { dodges = 0; run.textContent = "Em quên thật á 🙈"; run.style.translate = "0 0"; },
  };
})();

/* ---------- Màn 6: gửi điều ước ---------- */
$("#wish-form").addEventListener("submit", e => {
  e.preventDefault();
  Sound.start();
  const picked = $$(".chip input:checked").map(i => i.value);
  const own = $("#wish-text").value.trim();
  wishSummary = [...picked, own].filter(Boolean).join(" · ");

  $("#wish-form").classList.add("sent");
  $("#approved-msg").hidden = false;
  $("#stamp").classList.add("show");
  $("#duyet-card").classList.add("shake");
  Sound.stamp();
  setTimeout(() => { Sound.tada(); Confetti.burst(.5, .4, 80, Math.PI * 2, -Math.PI / 2, 14); }, 450);
  setTimeout(() => { $("#btn-after-wish").hidden = false; }, 900);
});

/* ============================================================
   MÀN 7: FINALE — bánh kem, cuộn thư, bắn tim
   ============================================================ */
const dock = $("#letter-dock"), scroll = $("#scroll"), btnLetter = $("#btn-letter");

// Các dòng thư hiện lần lượt sau khi cuộn giấy mở ra
$$(".paper-inner .ln").forEach((el, i) => el.style.setProperty("--d", (1.3 + i * .45).toFixed(2) + "s"));

function openLetter() {
  clearTimeout(letterTimer);
  btnLetter.classList.remove("nudge");
  const already = scroll.classList.contains("open");
  dock.classList.add("show");
  if (already) return;
  setTimeout(() => {
    scroll.classList.add("open");
    Sound.unroll();
    if (!isWide()) setTimeout(() => $("#scroll-close").focus({ preventScroll: true }), 400);
  }, isWide() ? 0 : 380);
}
function closeLetter() {
  scroll.classList.remove("open");
  Sound.pop();
  setTimeout(() => dock.classList.remove("show"), 600);
}
btnLetter.addEventListener("click", () => { Sound.pop(); openLetter(); });
$("#scroll-seal").addEventListener("click", () => { Sound.pop(); openLetter(); });
$("#scroll-close").addEventListener("click", closeLetter);
addEventListener("keydown", e => { if (e.key === "Escape" && dock.classList.contains("show") && !isWide()) closeLetter(); });
// Chạm ra ngoài cuộn thư (điện thoại) để đóng
dock.addEventListener("click", e => { if (e.target === dock && !isWide()) closeLetter(); });

/* ---------- Màn 7: Thổi nến sinh nhật ---------- */
const grandCake = $("#grand-cake"),
      btnBlow = $("#btn-blow"),
      btnToFinale = $("#btn-to-finale"),
      cakeHint = $("#cake-hint"),
      cakeInstruction = $("#cake-instruction");

let cakeBlown = false;

function blowCake() {
  if (cakeBlown) return;
  cakeBlown = true;
  grandCake.classList.add("out");
  Sound.puff();
  setTimeout(() => {
    Sound.clap();
    Sound.tada();
    Confetti.burst(0.5, 0.45, 90, Math.PI * 2, -Math.PI / 2, 16);
  }, 250);

  const r = grandCake.getBoundingClientRect();
  burstHearts(r.left + r.width / 2, r.top + 30, 22);

  cakeHint.textContent = "✨ Điều ước của em đã bay vào vũ trụ rồi!";
  cakeInstruction.innerHTML = "Ước nguyện tuổi mới đã xong! Anh có một món quà đặc biệt cuối cùng dành riêng cho <b class=\"nick\">" + CONFIG.nickname + "</b> nè... 🎁";
  btnBlow.hidden = true;
  btnToFinale.hidden = false;
  btnToFinale.classList.add("nudge");
}

function resetCake() {
  cakeBlown = false;
  grandCake.classList.remove("out");
  cakeHint.textContent = "👇 Chạm vào bánh hoặc bấm nút để thổi nến";
  cakeInstruction.innerHTML = "Điều ước đã được anh duyệt rồi nè! Bây giờ <b class=\"nick\">" + CONFIG.nickname + "</b> hãy <b>nhắm mắt ước một điều</b> rồi thổi nến nha! 🕯️✨";
  btnBlow.hidden = false;
  btnToFinale.hidden = true;
}

grandCake.addEventListener("click", blowCake);
grandCake.addEventListener("keydown", e => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    blowCake();
  }
});
btnBlow.addEventListener("click", blowCake);
btnToFinale.addEventListener("click", () => {
  Sound.start();
  Sound.pop();
  goTo(7);
});

let heartCount = 0;
$("#btn-hearts").addEventListener("click", e => {
  heartCount++;
  const cnt = $("#heart-count");
  cnt.hidden = false;
  cnt.textContent = heartCount;
  const r = e.currentTarget.getBoundingClientRect();
  const x = r.left + r.width / 2, y = r.top;
  burstHearts(x, y, 14);
  for (let i = 0; i < 10; i++) HeartTrail.add(x + rand(-20, 20), y, true);
  Sound.sparkle();
});

// Bắn pháo hoa rực rỡ khi bấm nút
$("#btn-fireworks").addEventListener("click", () => {
  Sound.start();
  Fireworks.grandShow();
});

// Bắn pháo hoa ngay vị trí nhấp chuột khi chạm vào màn 8
$("#scene-8").addEventListener("click", e => {
  if (!e.target.closest("button, textarea, input, label, a, .paper-inner, .scroll")) {
    Fireworks.fireAt(e.clientX, e.clientY);
  }
});

$("#finale-gif").addEventListener("click", e => {
  burstHearts(e.clientX, e.clientY, 10);
  Fireworks.fireAt(e.clientX, e.clientY);
  Sound.pop();
});

$("#btn-replay").addEventListener("click", () => {
  Sound.pop();
  clearTimeout(letterTimer);
  Fireworks.stopAmbient();
  resetCake();
  scroll.classList.remove("open");
  dock.classList.remove("show");
  btnLetter.classList.remove("nudge");
  $("#wish-form").classList.remove("sent");
  $("#approved-msg").hidden = true;
  $("#stamp").classList.remove("show");
  $("#duyet-card").classList.remove("shake");
  $("#btn-after-wish").hidden = true;
  $("#wish-text").value = "";
  $$(".chip input").forEach(i => (i.checked = false));
  heartCount = 0; $("#heart-count").hidden = true;
  wishSummary = "";
  runaway.reset();
  goTo(0);
});

/* ---------- Khởi động ---------- */
// Tải trước GIF để chuyển màn mượt
["hello", "wait", "oantrach", "dodanh", "xoa-dau", "duyet", "quay-tron"].forEach(n => { new Image().src = `src_video/${n}.gif`; });
updateProgress();

// Xem nhanh 1 màn khi kiểm tra/chỉnh sửa: mở index.html#7 (thổi nến) hoặc index.html#8 (màn cuối)
const jump = parseInt(location.hash.slice(1), 10);
if (jump >= 2 && jump <= scenes.length) {
  setTimeout(() => goTo(jump - 1), 120);
}
