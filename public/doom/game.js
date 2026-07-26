// @ts-nocheck -- Standalone browser game; validated separately with node --check.
(() => {
  "use strict";

  const canvas = document.querySelector("#game");
  const ctx = canvas.getContext("2d", { alpha: false });
  const minimap = document.querySelector("#minimap");
  const mapCtx = minimap.getContext("2d");

  const ui = {
    start: document.querySelector("#start-overlay"),
    pause: document.querySelector("#pause-overlay"),
    enter: document.querySelector("#enter-button"),
    resume: document.querySelector("#resume-button"),
    pauseButton: document.querySelector("#pause-button"),
    art: document.querySelector("#art-modal"),
    closeArt: document.querySelector("#close-art"),
    prompt: document.querySelector("#interaction-prompt"),
    room: document.querySelector("#room-label"),
    minimapWrap: document.querySelector("#minimap-wrap"),
    loading: document.querySelector("#loading"),
    modalImage: document.querySelector("#modal-image"),
    modalIndex: document.querySelector("#modal-index"),
    modalKicker: document.querySelector("#modal-kicker"),
    modalTitle: document.querySelector("#modal-title"),
    modalMeta: document.querySelector("#modal-meta"),
    modalDescription: document.querySelector("#modal-description"),
    modalLink: document.querySelector("#modal-link"),
  };

  const FOV = Math.PI / 3;
  const MAX_DEPTH = 24;
  const PLAYER_RADIUS = 0.2;
  const map = [
    "111111111111111111",
    "100000000000000001",
    "102222011111022201",
    "100001000001000001",
    "101101011101011101",
    "100001010001010001",
    "111101010111010111",
    "100000010000010001",
    "103333011110033301",
    "100000000010000001",
    "101111110010111101",
    "100000010000000001",
    "101110011111011101",
    "100010000000010001",
    "101011111110010101",
    "100000000000000001",
    "100000000000000001",
    "111111111111111111",
  ];

  const rooms = [
    { x1: 0, y1: 0, x2: 17, y2: 3, label: "FOYER / 01" },
    { x1: 0, y1: 3, x2: 7, y2: 8, label: "KNOCHENRAUM / 02" },
    { x1: 7, y1: 3, x2: 17, y2: 9, label: "SIGNALHALLE / 03" },
    { x1: 0, y1: 8, x2: 10, y2: 14, label: "ARCHIV / 04" },
    { x1: 10, y1: 8, x2: 17, y2: 15, label: "RELIQUIAR / 05" },
    { x1: 0, y1: 14, x2: 17, y2: 17, label: "UNTERER SALON / 06" },
  ];

  const fallbackWorks = [
    {
      title: "Threshold I",
      slug: "threshold-i",
      imageUrl: "assets/threshold-i.webp",
      imageAlt:
        "Abstraktes schwarzes, knochenfarbenes und rotes Gemälde mit einem zentralen Durchgang",
      medium: "Mixed Media auf Leinen",
      dimensions: "120 × 150 cm",
      year: 2026,
      description:
        "Eine Schwelle ist Wunde und Einladung zugleich. Anatomien aus Graphit sammeln sich um ein rotes Feld, das sich weder als Eingang noch als Ausgang auflösen lässt.",
    },
    {
      title: "Blue Reliquary",
      slug: "blue-reliquary",
      imageUrl: "assets/blue-reliquary.webp",
      imageAlt: "Kobaltblaues Gefäß, schwebend auf schwarzem Grund",
      medium: "Tusche, Wachsstift, Mineralpigment",
      dimensions: "100 × 125 cm",
      year: 2026,
      description:
        "Ein imaginäres Gefäß für Signale, die ihre Absender überdauern. Kreisende Spuren verwandeln das Objekt in Diagramm, Ikone und unmögliches Instrument.",
    },
    {
      title: "Signal Bloom",
      slug: "signal-bloom",
      imageUrl: "assets/signal-bloom.webp",
      imageAlt: "Ockerfarbene und schwarze botanische Abstraktion",
      medium: "Mineralpigment und Kohle",
      dimensions: "110 × 138 cm",
      year: 2026,
      description:
        "Botanische Kraft trifft auf technische Notation. Die Blüte wächst über ihre eigenen Ränder hinaus, für einen Moment zwischen Präparat und Ereignis gehalten.",
    },
  ];

  const curatedPlacements = [
    { x: 7.5, y: 1.55 },
    { x: 3.5, y: 3.55 },
    { x: 10.5, y: 5.5 },
    { x: 3.5, y: 9.5 },
    { x: 14.4, y: 11.5 },
    { x: 8.5, y: 15.4 },
    { x: 14.5, y: 15.4 },
    { x: 1.55, y: 12.5 },
  ];

  const generatedPlacements = map
    .flatMap((row, y) =>
      [...row].map((cell, x) => {
        if (cell !== "0" || Math.hypot(x + 0.5 - 1.7, y + 0.5 - 1.7) < 2.4) {
          return null;
        }
        const besideWall = [
          map[y - 1]?.[x],
          map[y + 1]?.[x],
          map[y]?.[x - 1],
          map[y]?.[x + 1],
        ].some((neighbor) => neighbor && neighbor !== "0");
        if (!besideWall) return null;
        const placement = { x: x + 0.5, y: y + 0.5 };
        const alreadyCurated = curatedPlacements.some(
          (curated) =>
            Math.hypot(curated.x - placement.x, curated.y - placement.y) < 0.9,
        );
        return alreadyCurated ? null : placement;
      }),
    )
    .filter(Boolean);

  const placements = [...curatedPlacements, ...generatedPlacements];

  const state = {
    started: false,
    paused: true,
    modalOpen: false,
    mapVisible: true,
    lastTime: performance.now(),
    bob: 0,
    moveAmount: 0,
    nearestWork: null,
    keys: new Set(),
    lookTouch: 0,
    player: { x: 1.7, y: 1.7, direction: 0.08 },
    works: [],
    depthBuffer: new Float32Array(1),
    ambient: null,
  };

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    const targetWidth = Math.max(
      360,
      Math.floor(window.innerWidth * ratio * 0.72),
    );
    const targetHeight = Math.max(
      240,
      Math.floor(window.innerHeight * ratio * 0.72),
    );
    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      state.depthBuffer = new Float32Array(targetWidth);
    }
  }

  function normalizeWork(work, index) {
    const fallback = fallbackWorks[index % fallbackWorks.length];
    return {
      title: work.title || fallback.title,
      slug: work.slug || fallback.slug,
      imageUrl: work.imageUrl || fallback.imageUrl,
      imageAlt: work.imageAlt || fallback.imageAlt,
      medium: work.medium || fallback.medium,
      dimensions: work.dimensions || fallback.dimensions,
      year: work.year || fallback.year,
      description: work.description || work.excerpt || fallback.description,
      index,
      x:
        placements[index % placements.length].x +
        Math.cos(index * 2.399) *
          0.12 *
          Math.min(2, Math.floor(index / placements.length)),
      y:
        placements[index % placements.length].y +
        Math.sin(index * 2.399) *
          0.12 *
          Math.min(2, Math.floor(index / placements.length)),
      image: null,
      frame: null,
    };
  }

  async function loadWorks() {
    let records = null;
    const controller = new AbortController();
    const requestTimer = window.setTimeout(() => controller.abort(), 7000);
    try {
      const response = await fetch("/api/gallery", {
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
      if (response.ok) {
        const payload = await response.json();
        const items = Array.isArray(payload) ? payload : payload.items;
        if (Array.isArray(items)) records = items;
      }
    } catch {
      // Standalone mode intentionally falls back to the bundled exhibition.
    } finally {
      window.clearTimeout(requestTimer);
    }

    records ??= fallbackWorks;
    state.works = records.map(normalizeWork);
    await Promise.all(
      state.works.map(
        (work) =>
          new Promise((resolve) => {
            const image = new Image();
            const fallback = fallbackWorks[work.index % fallbackWorks.length];
            let usingFallback = false;
            let settled = false;
            let timer = 0;

            const finish = () => {
              if (settled) return;
              settled = true;
              window.clearTimeout(timer);
              image.onload = null;
              image.onerror = null;
              resolve();
            };

            const tryFallback = () => {
              if (usingFallback) {
                finish();
                return;
              }
              usingFallback = true;
              window.clearTimeout(timer);
              timer = window.setTimeout(finish, 5000);
              image.src = fallback.imageUrl;
            };

            image.onload = () => {
              if (usingFallback) {
                work.imageUrl = fallback.imageUrl;
                work.imageAlt = fallback.imageAlt;
              }
              work.image = image;
              work.frame = createFramedArtwork(work);
              finish();
            };
            image.onerror = tryFallback;
            timer = window.setTimeout(tryFallback, 8000);
            image.src = work.imageUrl;
          }),
      ),
    );
    setTimeout(() => ui.loading.classList.add("is-done"), 180);
  }

  function createFramedArtwork(work) {
    const frame = document.createElement("canvas");
    frame.width = 256;
    frame.height = 360;
    const fctx = frame.getContext("2d");
    const gradient = fctx.createLinearGradient(0, 0, 256, 360);
    gradient.addColorStop(0, "#736b5d");
    gradient.addColorStop(0.25, "#191714");
    gradient.addColorStop(0.75, "#090807");
    gradient.addColorStop(1, "#887c69");
    fctx.fillStyle = gradient;
    fctx.fillRect(0, 0, 256, 360);
    fctx.fillStyle = "#dfd5c3";
    fctx.fillRect(8, 8, 240, 344);
    fctx.fillStyle = "#080706";
    fctx.fillRect(13, 13, 230, 334);
    fctx.drawImage(work.image, 20, 18, 216, 270);
    fctx.fillStyle = "#d8d0c3";
    fctx.fillRect(20, 298, 216, 38);
    fctx.fillStyle = "#181512";
    fctx.font = "500 12px Arial";
    fctx.fillText(work.title.toUpperCase().slice(0, 28), 30, 314);
    fctx.fillStyle = "#6e665c";
    fctx.font = "9px monospace";
    fctx.fillText(
      `${work.year} / ARBEIT ${String(work.index + 1).padStart(2, "0")}`,
      30,
      327,
    );
    return frame;
  }

  function wallAt(x, y) {
    const mx = Math.floor(x);
    const my = Math.floor(y);
    if (mx < 0 || my < 0 || my >= map.length || mx >= map[0].length) return 1;
    return Number(map[my][mx]);
  }

  function canMove(x, y) {
    return (
      !wallAt(x - PLAYER_RADIUS, y - PLAYER_RADIUS) &&
      !wallAt(x + PLAYER_RADIUS, y - PLAYER_RADIUS) &&
      !wallAt(x - PLAYER_RADIUS, y + PLAYER_RADIUS) &&
      !wallAt(x + PLAYER_RADIUS, y + PLAYER_RADIUS)
    );
  }

  function castRay(angle) {
    const rayX = Math.cos(angle);
    const rayY = Math.sin(angle);
    let mapX = Math.floor(state.player.x);
    let mapY = Math.floor(state.player.y);
    const deltaX = Math.abs(1 / (rayX || 0.00001));
    const deltaY = Math.abs(1 / (rayY || 0.00001));
    const stepX = rayX < 0 ? -1 : 1;
    const stepY = rayY < 0 ? -1 : 1;
    let sideX =
      rayX < 0
        ? (state.player.x - mapX) * deltaX
        : (mapX + 1 - state.player.x) * deltaX;
    let sideY =
      rayY < 0
        ? (state.player.y - mapY) * deltaY
        : (mapY + 1 - state.player.y) * deltaY;
    let side = 0;
    let type = 0;

    for (let i = 0; i < 64; i += 1) {
      if (sideX < sideY) {
        sideX += deltaX;
        mapX += stepX;
        side = 0;
      } else {
        sideY += deltaY;
        mapY += stepY;
        side = 1;
      }
      type =
        mapY < 0 || mapX < 0 || mapY >= map.length || mapX >= map[0].length
          ? 1
          : Number(map[mapY][mapX]);
      if (type) break;
    }

    const distance =
      side === 0
        ? (mapX - state.player.x + (1 - stepX) / 2) / (rayX || 0.00001)
        : (mapY - state.player.y + (1 - stepY) / 2) / (rayY || 0.00001);
    const hit =
      side === 0
        ? state.player.y + distance * rayY
        : state.player.x + distance * rayX;

    return {
      distance: Math.max(0.001, distance),
      type,
      side,
      textureX: hit - Math.floor(hit),
    };
  }

  function renderWorld() {
    const width = canvas.width;
    const height = canvas.height;
    const bob = Math.sin(state.bob) * Math.min(5, state.moveAmount * 7);
    const horizon = height * 0.48 + bob;

    const ceiling = ctx.createLinearGradient(0, 0, 0, horizon);
    ceiling.addColorStop(0, "#030405");
    ceiling.addColorStop(0.7, "#11100f");
    ceiling.addColorStop(1, "#24201c");
    ctx.fillStyle = ceiling;
    ctx.fillRect(0, 0, width, horizon);

    const floor = ctx.createLinearGradient(0, horizon, 0, height);
    floor.addColorStop(0, "#25201c");
    floor.addColorStop(0.28, "#11100e");
    floor.addColorStop(1, "#050505");
    ctx.fillStyle = floor;
    ctx.fillRect(0, horizon, width, height - horizon);

    ctx.globalAlpha = 0.13;
    ctx.strokeStyle = "#d6c8b2";
    for (
      let y = horizon + 12;
      y < height;
      y += Math.max(9, (y - horizon) * 0.09)
    ) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    for (let x = 0; x < width; x += 1) {
      const camera = (x / width - 0.5) * FOV;
      const ray = castRay(state.player.direction + camera);
      const corrected = ray.distance * Math.cos(camera);
      state.depthBuffer[x] = corrected;
      const wallHeight = Math.min(height * 2.4, height / corrected);
      const top = Math.floor(horizon - wallHeight / 2);
      const fog = Math.min(0.85, corrected / MAX_DEPTH);
      const sideShade = ray.side ? 0.74 : 1;
      const textureShade = 0.8 + Math.sin(ray.textureX * Math.PI * 12) * 0.08;
      const palettes = {
        1: [91, 84, 74],
        2: [84, 33, 23],
        3: [26, 45, 94],
      };
      const base = palettes[ray.type] || palettes[1];
      const light = sideShade * textureShade * (1 - fog);
      const r = Math.floor(base[0] * light + 7 * fog);
      const g = Math.floor(base[1] * light + 7 * fog);
      const b = Math.floor(base[2] * light + 7 * fog);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x, top, 1, wallHeight);

      if (
        (Math.floor(ray.textureX * 10) === 0 ||
          Math.floor(ray.textureX * 10) === 9) &&
        corrected < 12
      ) {
        ctx.fillStyle = `rgba(225,211,190,${0.08 * (1 - fog)})`;
        ctx.fillRect(x, top, 1, wallHeight);
      }

      const ceilingLight = Math.max(0, 1 - Math.abs(ray.textureX - 0.5) * 5);
      if (ray.type === 1 && ceilingLight > 0.7 && corrected < 8) {
        ctx.fillStyle = `rgba(226,213,187,${0.045 * (1 - fog)})`;
        ctx.fillRect(x, 0, 1, top);
      }
    }

    renderArtworks(horizon);
    renderVignette();
  }

  function renderArtworks(horizon) {
    const width = canvas.width;
    const height = canvas.height;
    const cos = Math.cos(state.player.direction);
    const sin = Math.sin(state.player.direction);
    const visible = state.works
      .map((work) => {
        const dx = work.x - state.player.x;
        const dy = work.y - state.player.y;
        return {
          work,
          depth: dx * cos + dy * sin,
          side: -dx * sin + dy * cos,
        };
      })
      .filter((item) => item.depth > 0.18 && item.work.frame)
      .sort((a, b) => b.depth - a.depth);

    for (const item of visible) {
      const spriteHeight = Math.min(height * 2.2, (height * 0.88) / item.depth);
      const spriteWidth = spriteHeight * (256 / 360);
      const screenX =
        width / 2 +
        (item.side / item.depth) * (width / (2 * Math.tan(FOV / 2)));
      const left = Math.floor(screenX - spriteWidth / 2);
      const top = Math.floor(horizon - spriteHeight * 0.5);

      for (
        let stripe = Math.max(0, left);
        stripe < Math.min(width, left + spriteWidth);
        stripe += 1
      ) {
        if (item.depth >= state.depthBuffer[stripe]) continue;
        const sourceX = ((stripe - left) / spriteWidth) * item.work.frame.width;
        ctx.drawImage(
          item.work.frame,
          sourceX,
          0,
          1,
          item.work.frame.height,
          stripe,
          top,
          1,
          spriteHeight,
        );
      }
    }
  }

  function renderVignette() {
    const gradient = ctx.createRadialGradient(
      canvas.width / 2,
      canvas.height / 2,
      canvas.height * 0.2,
      canvas.width / 2,
      canvas.height / 2,
      canvas.width * 0.66,
    );
    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(0.65, "rgba(0,0,0,0.08)");
    gradient.addColorStop(1, "rgba(0,0,0,0.78)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function renderMinimap() {
    const size = minimap.width;
    const cell = size / map.length;
    mapCtx.clearRect(0, 0, size, size);
    mapCtx.fillStyle = "rgba(5,5,5,.86)";
    mapCtx.fillRect(0, 0, size, size);
    for (let y = 0; y < map.length; y += 1) {
      for (let x = 0; x < map[y].length; x += 1) {
        if (map[y][x] !== "0") {
          const type = map[y][x];
          mapCtx.fillStyle =
            type === "2" ? "#702b20" : type === "3" ? "#20396f" : "#4d4942";
          mapCtx.fillRect(x * cell, y * cell, cell + 0.4, cell + 0.4);
        }
      }
    }
    for (const work of state.works) {
      mapCtx.fillStyle = "#df4b2b";
      mapCtx.fillRect(work.x * cell - 2, work.y * cell - 2, 4, 4);
    }
    mapCtx.save();
    mapCtx.translate(state.player.x * cell, state.player.y * cell);
    mapCtx.rotate(state.player.direction);
    mapCtx.fillStyle = "#eee4d4";
    mapCtx.beginPath();
    mapCtx.moveTo(7, 0);
    mapCtx.lineTo(-5, -4);
    mapCtx.lineTo(-5, 4);
    mapCtx.closePath();
    mapCtx.fill();
    mapCtx.restore();
  }

  function update(delta) {
    if (state.paused || state.modalOpen || !state.started) {
      state.moveAmount *= 0.85;
      return;
    }
    const key = (code) => state.keys.has(code);
    const forward =
      Number(key("KeyW") || key("ArrowUp")) -
      Number(key("KeyS") || key("ArrowDown"));
    const strafe = Number(key("KeyD")) - Number(key("KeyA"));
    const turn =
      Number(key("ArrowRight")) - Number(key("ArrowLeft")) + state.lookTouch;
    const sprint = key("ShiftLeft") || key("ShiftRight");
    const moveSpeed = (sprint ? 3.25 : 2.15) * delta;
    const turnSpeed = 1.8 * delta;
    state.player.direction += turn * turnSpeed;

    const cos = Math.cos(state.player.direction);
    const sin = Math.sin(state.player.direction);
    const dx = (cos * forward - sin * strafe) * moveSpeed;
    const dy = (sin * forward + cos * strafe) * moveSpeed;
    if (canMove(state.player.x + dx, state.player.y)) state.player.x += dx;
    if (canMove(state.player.x, state.player.y + dy)) state.player.y += dy;

    state.moveAmount +=
      ((Math.abs(forward) + Math.abs(strafe) > 0 ? 1 : 0) - state.moveAmount) *
      0.16;
    state.bob += delta * (sprint ? 13 : 9) * state.moveAmount;
    updateNearbyWork();
    updateRoom();
  }

  function updateNearbyWork() {
    let nearest = null;
    let nearestDistance = Infinity;
    for (const work of state.works) {
      const dx = work.x - state.player.x;
      const dy = work.y - state.player.y;
      const distance = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);
      const difference = Math.atan2(
        Math.sin(angle - state.player.direction),
        Math.cos(angle - state.player.direction),
      );
      if (
        distance < 1.65 &&
        Math.abs(difference) < 0.75 &&
        distance < nearestDistance
      ) {
        nearest = work;
        nearestDistance = distance;
      }
    }
    state.nearestWork = nearest;
    ui.prompt.hidden = !nearest;
  }

  function updateRoom() {
    const room = rooms.find(
      (item) =>
        state.player.x >= item.x1 &&
        state.player.x <= item.x2 &&
        state.player.y >= item.y1 &&
        state.player.y <= item.y2,
    );
    if (room && ui.room.textContent !== room.label)
      ui.room.textContent = room.label;
  }

  function showArtwork(work) {
    if (!work) return;
    state.modalOpen = true;
    document.exitPointerLock?.();
    ui.modalImage.src = work.imageUrl;
    ui.modalImage.alt = work.imageAlt;
    ui.modalIndex.textContent = `ARBEIT ${String(work.index + 1).padStart(2, "0")}`;
    ui.modalKicker.textContent = `ARCHIV / ${work.medium || "ORIGINALARBEIT"}`;
    ui.modalTitle.textContent = work.title;
    ui.modalMeta.textContent = [work.year, work.medium, work.dimensions]
      .filter(Boolean)
      .join(" — ");
    ui.modalDescription.textContent = work.description;
    ui.modalLink.href = work.slug ? `../work/${work.slug}` : "../#work";
    ui.art.hidden = false;
  }

  function closeArtwork() {
    state.modalOpen = false;
    ui.art.hidden = true;
    if (
      state.started &&
      !state.paused &&
      matchMedia("(pointer:fine)").matches
    ) {
      canvas.requestPointerLock?.();
    }
  }

  function pauseGame(show = true) {
    if (!state.started || state.modalOpen) return;
    state.paused = show;
    ui.pause.classList.toggle("overlay--open", show);
    if (show) document.exitPointerLock?.();
    else if (matchMedia("(pointer:fine)").matches)
      canvas.requestPointerLock?.();
  }

  function startGame() {
    state.started = true;
    state.paused = false;
    ui.start.classList.remove("overlay--open");
    initAmbient();
    if (matchMedia("(pointer:fine)").matches) canvas.requestPointerLock?.();
  }

  function initAmbient() {
    if (state.ambient) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audio = new AudioContext();
      const gain = audio.createGain();
      const low = audio.createOscillator();
      const high = audio.createOscillator();
      low.type = "sine";
      high.type = "triangle";
      low.frequency.value = 47;
      high.frequency.value = 71;
      gain.gain.value = 0.018;
      low.connect(gain);
      high.connect(gain);
      gain.connect(audio.destination);
      low.start();
      high.start();
      state.ambient = { audio, gain };
    } catch {
      // Audio is atmospheric only; unsupported browsers remain fully playable.
    }
  }

  function frame(time) {
    const delta = Math.min(0.05, (time - state.lastTime) / 1000);
    state.lastTime = time;
    resize();
    update(delta);
    renderWorld();
    if (state.mapVisible) renderMinimap();
    requestAnimationFrame(frame);
  }

  function onKeyDown(event) {
    if (
      [
        "KeyW",
        "KeyA",
        "KeyS",
        "KeyD",
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "Space",
      ].includes(event.code)
    ) {
      event.preventDefault();
    }
    if (
      event.repeat &&
      ["KeyE", "Space", "KeyM", "Escape"].includes(event.code)
    )
      return;
    state.keys.add(event.code);
    if ((event.code === "KeyE" || event.code === "Space") && !state.modalOpen) {
      showArtwork(state.nearestWork);
    } else if (event.code === "KeyM") {
      state.mapVisible = !state.mapVisible;
      ui.minimapWrap.classList.toggle("is-hidden", !state.mapVisible);
    } else if (event.code === "Escape") {
      if (state.modalOpen) closeArtwork();
      else pauseGame(!state.paused);
    }
  }

  function bindTouchControls() {
    document.querySelectorAll("[data-key]").forEach((button) => {
      const code = button.dataset.key;
      const press = (event) => {
        event.preventDefault();
        state.keys.add(code);
      };
      const release = (event) => {
        event.preventDefault();
        state.keys.delete(code);
      };
      button.addEventListener("pointerdown", press);
      button.addEventListener("pointerup", release);
      button.addEventListener("pointercancel", release);
      button.addEventListener("pointerleave", release);
    });
    document.querySelectorAll("[data-look]").forEach((button) => {
      const direction = Number(button.dataset.look);
      const press = (event) => {
        event.preventDefault();
        state.lookTouch = direction;
      };
      const release = (event) => {
        event.preventDefault();
        state.lookTouch = 0;
      };
      button.addEventListener("pointerdown", press);
      button.addEventListener("pointerup", release);
      button.addEventListener("pointercancel", release);
      button.addEventListener("pointerleave", release);
    });
    document
      .querySelector("[data-action='interact']")
      .addEventListener("click", () => {
        showArtwork(state.nearestWork);
      });
  }

  window.addEventListener("resize", resize);
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", (event) => state.keys.delete(event.code));
  window.addEventListener("blur", () => {
    state.keys.clear();
    state.lookTouch = 0;
  });
  document.addEventListener("mousemove", (event) => {
    if (document.pointerLockElement === canvas && !state.paused) {
      state.player.direction += event.movementX * 0.0023;
    }
  });
  document.addEventListener("pointerlockchange", () => {
    if (
      state.started &&
      !state.modalOpen &&
      document.pointerLockElement !== canvas &&
      !ui.pause.classList.contains("overlay--open")
    ) {
      pauseGame(true);
    }
  });
  canvas.addEventListener("click", () => {
    if (state.started && !state.paused && !state.modalOpen)
      canvas.requestPointerLock?.();
  });
  ui.enter.addEventListener("click", startGame);
  ui.resume.addEventListener("click", () => pauseGame(false));
  ui.pauseButton.addEventListener("click", () => pauseGame(true));
  ui.closeArt.addEventListener("click", closeArtwork);
  ui.art.addEventListener("click", (event) => {
    if (event.target === ui.art) closeArtwork();
  });

  bindTouchControls();
  resize();
  loadWorks();
  requestAnimationFrame(frame);
})();
