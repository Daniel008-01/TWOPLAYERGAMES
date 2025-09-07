import React, { useRef, useState, useEffect } from 'react';

export default function TinyRaces({ onBack, name1 = 'Player 1', name2 = 'Player 2', trackConfig = null }) {
  const canvasRef = useRef(null);
  const reqRef = useRef(null);

  const arena = useRef({ w: 900, h: 520, padding: 0 });
  const track = useRef({
    type: 'ring',
    cx: 450, cy: 260,
    innerR: 110,
    outerR: 220,
    finishA: -Math.PI / 2,
    finishWidth: 10,
    outerPath: null,
    innerPath: null,
    finishSeg: null
  });

  const wallsRef = useRef([]);
  const carsRef = useRef({
    p1: { x: 450 - 160, y: 260, angle: 0, speed: 0, accel: 120, brake: 220, maxSpeed: 300, turnSpeed: 2.6, color: '#ef4444', laps: 0, lastCross: -9999, lastSide: null, bestLap: null, curLapStart: null, prevX: null, prevY: null },
    p2: { x: 450 + 160, y: 260, angle: Math.PI, speed: 0, accel: 120, brake: 220, maxSpeed: 300, turnSpeed: 2.6, color: '#3b82f6', laps: 0, lastCross: -9999, lastSide: null, bestLap: null, curLapStart: null, prevX: null, prevY: null }
  });

  const keysRef = useRef({});
  const [winner, setWinner] = useState(null);
  const [raceStartedAt, setRaceStartedAt] = useState(null);
  const [scores, setScores] = useState({ p1: 0, p2: 0 });
  const LAP_TARGET_REF = useRef(3);
  const CROSS_DEBOUNCE = 700;

  // --- утилиты ---
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function normalizeAngle(a) { while (a <= -Math.PI) a += Math.PI * 2; while (a > Math.PI) a -= Math.PI * 2; return a; }

  // raycast point in polygon
  function pointInPoly(x, y, poly) {
    if (!poly || poly.length === 0) return false;
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i][0], yi = poly[i][1];
      const xj = poly[j][0], yj = poly[j][1];
      const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi + 0.00000001) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  // segment intersection
  function onSeg(ax,ay,bx,by, px,py) {
    return px >= Math.min(ax,bx) - 1e-9 && px <= Math.max(ax,bx) + 1e-9 && py >= Math.min(ay,by) - 1e-9 && py <= Math.max(ay,by) + 1e-9;
  }
  function segSegIntersect(a1x,a1y,a2x,a2y, b1x,b1y,b2x,b2y) {
    const orient = (ax,ay, bx,by, cx,cy) => (bx-ax)*(cy-ay) - (by-ay)*(cx-ax);
    const o1 = orient(a1x,a1y, a2x,a2y, b1x,b1y);
    const o2 = orient(a1x,a1y, a2x,a2y, b2x,b2y);
    const o3 = orient(b1x,b1y, b2x,b2y, a1x,a1y);
    const o4 = orient(b1x,b1y, b2x,b2y, a2x,a2y);
    if (Math.abs(o1) < 1e-9 && onSeg(a1x,a1y,a2x,a2y,b1x,b1y)) return true;
    if (Math.abs(o2) < 1e-9 && onSeg(a1x,a1y,a2x,a2y,b2x,b2y)) return true;
    if (Math.abs(o3) < 1e-9 && onSeg(b1x,b1y,b2x,b2y,a1x,a1y)) return true;
    if (Math.abs(o4) < 1e-9 && onSeg(b1x,b1y,b2x,b2y,a2x,a2y)) return true;
    return (o1*o2 < 0) && (o3*o4 < 0);
  }

  function drawPoly(ctx, pts) {
    if (!pts || !pts.length) return;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i=1;i<pts.length;i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
  }

  // rect vs circle resolver
  function circleRectResolve(cx,cy, cr, rx,ry,rw,rh) {
    const nearestX = Math.max(rx, Math.min(cx, rx + rw));
    const nearestY = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - nearestX, dy = cy - nearestY;
    const d2 = dx*dx + dy*dy;
    if (d2 < cr*cr && d2 > 0) {
      const d = Math.sqrt(d2);
      const overlap = cr - d;
      return { nx: dx/d, ny: dy/d, overlap };
    }
    return null;
  }

  // reflect velocity vector (vx,vy) across normal (nx,ny)
  function reflectAndDampen(vx, vy, nx, ny, damp=0.7) {
    // normalize normal
    const nlen = Math.sqrt(nx*nx + ny*ny) || 1;
    nx /= nlen; ny /= nlen;
    const dot = vx*nx + vy*ny;
    // reflection
    let rx = vx - 2 * dot * nx;
    let ry = vy - 2 * dot * ny;
    // dampen magnitude (apply -30%)
    rx *= damp;
    ry *= damp;
    return { vx: rx, vy: ry };
  }

  // ----------------- init trackConfig -----------------
  useEffect(() => {
    if (!trackConfig) return;
    if (trackConfig.size && typeof trackConfig.size.w === 'number' && typeof trackConfig.size.h === 'number') {
      arena.current.w = trackConfig.size.w;
      arena.current.h = trackConfig.size.h;
    } else if (trackConfig.arena && typeof trackConfig.arena.w === 'number' && typeof trackConfig.arena.h === 'number') {
      arena.current.w = trackConfig.arena.w;
      arena.current.h = trackConfig.arena.h;
    }
    if (trackConfig.center) {
      track.current.cx = trackConfig.center.cx ?? track.current.cx;
      track.current.cy = trackConfig.center.cy ?? track.current.cy;
    }
    if (trackConfig.innerR != null) track.current.innerR = trackConfig.innerR;
    if (trackConfig.outerR != null) track.current.outerR = trackConfig.outerR;
    if (trackConfig.finish && typeof trackConfig.finish.angle === 'number') {
      track.current.finishA = trackConfig.finish.angle ?? track.current.finishA;
      track.current.finishWidth = trackConfig.finish.width ?? track.current.finishWidth;
    }
    if (trackConfig.lapTarget) LAP_TARGET_REF.current = trackConfig.lapTarget;
    wallsRef.current = trackConfig.walls ? trackConfig.walls.slice() : [];

    if (trackConfig.starts) {
      const s = trackConfig.starts;
      if (s.p1) { carsRef.current.p1.x = s.p1.x; carsRef.current.p1.y = s.p1.y; carsRef.current.p1.angle = s.p1.angle ?? carsRef.current.p1.angle; }
      if (s.p2) { carsRef.current.p2.x = s.p2.x; carsRef.current.p2.y = s.p2.y; carsRef.current.p2.angle = s.p2.angle ?? carsRef.current.p2.angle; }
    }

    if (trackConfig.trackType === 'poly') {
      track.current.type = 'poly';
      track.current.outerPath = (trackConfig.outerPath || []).map(p => [p[0], p[1]]);
      track.current.innerPath = (trackConfig.innerPath || []).map(p => [p[0], p[1]]);
      if (trackConfig.finish && trackConfig.finish.p1 && trackConfig.finish.p2) {
        track.current.finishSeg = { x1: trackConfig.finish.p1[0], y1: trackConfig.finish.p1[1], x2: trackConfig.finish.p2[0], y2: trackConfig.finish.p2[1] };
        track.current.finishWidth = trackConfig.finish.width ?? track.current.finishWidth;
      } else track.current.finishSeg = null;
    } else {
      track.current.type = 'ring';
      track.current.outerPath = null; track.current.innerPath = null; track.current.finishSeg = null;
    }

    const now = performance.now();
    Object.values(carsRef.current).forEach(c => {
      c.curLapStart = now; c.lastCross = -9999; c.laps = 0; c.bestLap = null; c.lastSide = null; c.speed = 0;
      c.prevX = c.x; c.prevY = c.y;
    });
    setWinner(null); setRaceStartedAt(null);
  }, [trackConfig]);

  // canvas init & loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = arena.current.w; canvas.height = arena.current.h;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.style.width = arena.current.w + 'px'; canvas.style.height = arena.current.h + 'px';
    canvas.width = Math.floor(arena.current.w * dpr); canvas.height = Math.floor(arena.current.h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const now = performance.now();
    Object.values(carsRef.current).forEach(c => c.curLapStart = now);

    let last = performance.now();
    function loop(nowTs) {
      const dtMs = Math.min(40, nowTs - last);
      last = nowTs;
      if (!winner) update(dtMs / 1000);
      draw(ctx);
      reqRef.current = requestAnimationFrame(loop);
    }
    reqRef.current = requestAnimationFrame(loop);

    return () => { if (reqRef.current) cancelAnimationFrame(reqRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [winner, trackConfig]);

  // keyboard
  useEffect(() => {
    function onDown(e) { if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault(); keysRef.current[e.code] = true; }
    function onUp(e) { keysRef.current[e.code] = false; }
    window.addEventListener('keydown', onDown, { passive: false });
    window.addEventListener('keyup', onUp);
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); };
  }, []);

  // --- update loop ---
  function update(dt) {
    const now = performance.now();

    ['p1','p2'].forEach(id => {
      const car = carsRef.current[id];

      // save prev for finish detection (poly)
      car.prevX = car.x; car.prevY = car.y;

      // input
      let accel=false, brake=false, left=false, right=false;
      if (id === 'p1') { accel = keysRef.current['KeyW']; brake = keysRef.current['KeyS']; left = keysRef.current['KeyA']; right = keysRef.current['KeyD']; }
      else { accel = keysRef.current['ArrowUp']; brake = keysRef.current['ArrowDown']; left = keysRef.current['ArrowLeft']; right = keysRef.current['ArrowRight']; }

      if (accel) car.speed += car.accel * dt;
      else if (brake) car.speed -= car.brake * dt;
      else { car.speed *= Math.pow(0.93, dt * 60); if (Math.abs(car.speed) < 2) car.speed = 0; }
      car.speed = clamp(car.speed, -car.maxSpeed * 0.5, car.maxSpeed);

      const speedFactor = clamp(Math.abs(car.speed) / car.maxSpeed, 0, 1);
      if (left) car.angle -= car.turnSpeed * (0.2 + 0.8 * speedFactor) * dt * (car.speed >= 0 ? 1 : -1);
      if (right) car.angle += car.turnSpeed * (0.2 + 0.8 * speedFactor) * dt * (car.speed >= 0 ? 1 : -1);

      // move
      car.x += Math.cos(car.angle) * car.speed * dt;
      car.y += Math.sin(car.angle) * car.speed * dt;

      // clamp to arena
      const pad = 8;
      if (car.x < pad) { car.x = pad; car.speed *= -0.2; }
      if (car.y < pad) { car.y = pad; car.speed *= -0.2; }
      if (car.x > arena.current.w - pad) { car.x = arena.current.w - pad; car.speed *= -0.2; }
      if (car.y > arena.current.h - pad) { car.y = arena.current.h - pad; car.speed *= -0.2; }

      // determine on-road
      let onRoad = true;
      if (track.current.type === 'ring') {
        const dx = car.x - track.current.cx, dy = car.y - track.current.cy;
        const dist = Math.sqrt(dx*dx + dy*dy);
        onRoad = (dist >= track.current.innerR && dist <= track.current.outerR);
      } else if (track.current.type === 'poly') {
        const inOuter = pointInPoly(car.x, car.y, track.current.outerPath || []);
        const inInner = pointInPoly(car.x, car.y, track.current.innerPath || []);
        onRoad = inOuter && !inInner;
      }

      // offroad behaviour: cap speed to 40% of max + extra drag
      const offroadMax = car.maxSpeed * 0.4;
      if (!onRoad) {
        // if moving faster than allowed, clamp preserving sign
        if (Math.abs(car.speed) > offroadMax) {
          car.speed = (car.speed > 0 ? 1 : -1) * offroadMax;
        }
        // additional slow-down while offroad
        car.speed *= Math.pow(0.975, dt * 60);
        if (Math.abs(car.speed) < 1) car.speed = 0;
      }

      // walls collision -> reflect + dampen (ricochet)
      const carRadius = 14;
      for (const w of wallsRef.current) {
        if (!w) continue;
        if (w.type === 'circle') {
          const dx = car.x - w.x, dy = car.y - w.y;
          const d2 = dx*dx + dy*dy;
          const rsum = (w.r || 10) + carRadius;
          if (d2 < rsum * rsum && d2 > 0) {
            const d = Math.sqrt(d2);
            const nx = dx / d, ny = dy / d;
            const overlap = rsum - d + 0.5; // + small nudge
            // reflect velocity
            const vx = Math.cos(car.angle) * car.speed;
            const vy = Math.sin(car.angle) * car.speed;
            const r = reflectAndDampen(vx, vy, nx, ny, 0.7); // speed *= 0.7
            // write back
            car.x += nx * overlap;
            car.y += ny * overlap;
            const newSpeed = Math.sqrt(r.vx * r.vx + r.vy * r.vy);
            car.angle = Math.atan2(r.vy, r.vx);
            car.speed = newSpeed;
            if (Math.abs(car.speed) < 1) car.speed = 0;
          }
        } else if (w.type === 'rect') {
          const res = circleRectResolve(car.x, car.y, carRadius, w.x, w.y, w.w, w.h);
          if (res) {
            // reflect velocity across normal res.nx,res.ny
            const vx = Math.cos(car.angle) * car.speed;
            const vy = Math.sin(car.angle) * car.speed;
            const r = reflectAndDampen(vx, vy, res.nx, res.ny, 0.7);
            car.x += res.nx * (res.overlap + 0.5);
            car.y += res.ny * (res.overlap + 0.5);
            const newSpeed = Math.sqrt(r.vx * r.vx + r.vy * r.vy);
            car.angle = Math.atan2(r.vy, r.vx);
            car.speed = newSpeed;
            if (Math.abs(car.speed) < 1) car.speed = 0;
          }
        }
      }
    });

    // car-car collision (unchanged)
    {
      const A = carsRef.current.p1, B = carsRef.current.p2;
      const dx = B.x - A.x, dy = B.y - A.y;
      const d2 = dx*dx + dy*dy;
      const minDist = 28;
      if (d2 < minDist * minDist && d2 > 0) {
        const d = Math.sqrt(d2), nx = dx/d, ny = dy/d, overlap = (minDist - d)/2;
        A.x -= nx * overlap; A.y -= ny * overlap; B.x += nx * overlap; B.y += ny * overlap;
        const vx = (B.speed - A.speed) * 0.08;
        A.speed -= vx; B.speed += vx;
      }
    }

    // lap detection (poly or ring)
    if (track.current.type === 'poly' && track.current.finishSeg) {
      ['p1','p2'].forEach(id => {
        const car = carsRef.current[id];
        if (car.prevX == null) return;
        const fx1 = track.current.finishSeg.x1, fy1 = track.current.finishSeg.y1;
        const fx2 = track.current.finishSeg.x2, fy2 = track.current.finishSeg.y2;
        const crossed = segSegIntersect(car.prevX, car.prevY, car.x, car.y, fx1, fy1, fx2, fy2);
        if (crossed && (now - car.lastCross) > CROSS_DEBOUNCE) {
          const vx = Math.cos(car.angle) * car.speed;
          const vy = Math.sin(car.angle) * car.speed;
          const tangX = fx2 - fx1, tangY = fy2 - fy1;
          const forwardness = vx * tangX + vy * tangY;
          if (forwardness > 20) {
            const lapTime = now - (car.curLapStart || now);
            car.laps += 1; car.lastCross = now; car.curLapStart = now;
            if (car.bestLap === null || lapTime < car.bestLap) car.bestLap = lapTime;
            if (car.laps >= LAP_TARGET_REF.current && !winner) {
              setWinner(id === 'p1' ? name1 : name2);
              setScores(prev => ({ ...prev, [id]: prev[id] + 1 }));
            }
          }
        }
      });
    } else {
      ['p1','p2'].forEach(id => {
        const car = carsRef.current[id];
        const vx = car.x - track.current.cx;
        const vy = car.y - track.current.cy;
        const ang = Math.atan2(vy, vx);
        const aDiff = normalizeAngle(ang - track.current.finishA);
        const side = aDiff > 0 ? 1 : -1;
        const finishVecX = Math.cos(track.current.finishA);
        const finishVecY = Math.sin(track.current.finishA);
        const proj = vx * finishVecX + vy * finishVecY;
        const perpendicularDist = Math.abs(-vx * finishVecY + vy * finishVecX);
        const closeToFinish = perpendicularDist < 40 && proj > track.current.innerR;
        const justCrossed = car.lastSide !== null && side !== car.lastSide && closeToFinish && (now - car.lastCross) > CROSS_DEBOUNCE;
        if (justCrossed) {
          const tangX = -finishVecY, tangY = finishVecX;
          const velX = Math.cos(car.angle) * car.speed;
          const velY = Math.sin(car.angle) * car.speed;
          const forwardness = velX * tangX + velY * tangY;
          if (forwardness > 20) {
            const lapTime = now - (car.curLapStart || now);
            car.laps += 1; car.lastCross = now; car.curLapStart = now;
            if (car.bestLap === null || lapTime < car.bestLap) car.bestLap = lapTime;
            if (car.laps >= LAP_TARGET_REF.current && !winner) {
              setWinner(id === 'p1' ? name1 : name2);
              setScores(prev => ({ ...prev, [id]: prev[id] + 1 }));
            }
          }
        }
        car.lastSide = side;
      });
    }

    if (!raceStartedAt) setRaceStartedAt(now);
  }

  // --- drawing (unchanged except uses new onRoad/rules) ---
  function draw(ctx) {
    ctx.clearRect(0,0,arena.current.w,arena.current.h);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0,0,arena.current.w,arena.current.h);

    const tr = track.current;
    if (tr.type === 'poly' && tr.outerPath && tr.innerPath) {
      ctx.save();
      drawPoly(ctx, tr.outerPath);
      ctx.fillStyle = '#374151';
      ctx.fill();
      ctx.globalCompositeOperation = 'destination-out';
      drawPoly(ctx, tr.innerPath);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';

      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.setLineDash([8,8]);
      ctx.beginPath();
      const outer = tr.outerPath, inner = tr.innerPath;
      if (outer.length === inner.length) {
        for (let i=0;i<outer.length;i++){
          const mx = (outer[i][0] + inner[i][0]) / 2;
          const my = (outer[i][1] + inner[i][1]) / 2;
          if (i===0) ctx.moveTo(mx,my); else ctx.lineTo(mx,my);
        }
        ctx.closePath(); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.moveTo(outer[0][0], outer[0][1]); for (let i=1;i<outer.length;i++) ctx.lineTo(outer[i][0], outer[i][1]); ctx.closePath(); ctx.stroke();
      }
      ctx.setLineDash([]); ctx.restore();

      if (tr.finishSeg) {
        ctx.lineWidth = tr.finishWidth || 8; ctx.strokeStyle = '#fff';
        ctx.beginPath(); ctx.moveTo(tr.finishSeg.x1, tr.finishSeg.y1); ctx.lineTo(tr.finishSeg.x2, tr.finishSeg.y2); ctx.stroke();
      }
    } else {
      ctx.save(); ctx.translate(tr.cx, tr.cy);
      ctx.beginPath(); ctx.arc(0,0, tr.outerR, 0, Math.PI*2); ctx.fillStyle = '#374151'; ctx.fill();
      ctx.globalCompositeOperation = 'destination-out'; ctx.beginPath(); ctx.arc(0,0, tr.innerR, 0, Math.PI*2); ctx.fill(); ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.setLineDash([8, 8]); ctx.beginPath(); ctx.arc(0,0, (tr.innerR + tr.outerR)/2, 0, Math.PI*2); ctx.stroke(); ctx.setLineDash([]);
      const fa = tr.finishA;
      const fx1 = Math.cos(fa) * tr.innerR, fy1 = Math.sin(fa) * tr.innerR, fx2 = Math.cos(fa) * tr.outerR, fy2 = Math.sin(fa) * tr.outerR;
      ctx.lineWidth = tr.finishWidth; ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.moveTo(fx1, fy1); ctx.lineTo(fx2, fy2); ctx.stroke();
      ctx.restore();
    }

    for (const w of wallsRef.current) {
      if (!w) continue;
      if (w.type === 'circle') {
        ctx.beginPath(); ctx.arc(w.x, w.y, w.r, 0, Math.PI*2); ctx.fillStyle = '#8b5cf6'; ctx.fill(); ctx.strokeStyle = '#2d2d2d'; ctx.lineWidth = 1; ctx.stroke();
      } else if (w.type === 'rect') {
        ctx.fillStyle = '#8b5cf6'; ctx.fillRect(w.x, w.y, w.w, w.h); ctx.strokeStyle = '#2d2d2d'; ctx.lineWidth = 1; ctx.strokeRect(w.x, w.y, w.w, w.h);
      }
    }

    Object.entries(carsRef.current).forEach(([id, car]) => drawCar(ctx, car));

    ctx.save();
    ctx.fillStyle = '#111827'; ctx.font = '14px sans-serif';
    const p1 = carsRef.current.p1, p2 = carsRef.current.p2;
    ctx.fillText(`${name1} — Laps: ${p1.laps}/${LAP_TARGET_REF.current}`, 10, 20);
    ctx.fillText(`${name2} — Laps: ${p2.laps}/${LAP_TARGET_REF.current}`, 10, 40);
    ctx.fillStyle = '#6b7280'; ctx.font = '12px monospace';
    ctx.fillText(`Best ${name1}: ${formatMs(p1.bestLap)}`, 10, 60); ctx.fillText(`Best ${name2}: ${formatMs(p2.bestLap)}`, 10, 76);
    const now = performance.now();
    const cur1 = p1.curLapStart ? now - p1.curLapStart : 0;
    const cur2 = p2.curLapStart ? now - p2.curLapStart : 0;
    ctx.fillStyle = '#111827';
    ctx.fillText(`Cur ${name1}: ${formatMs(cur1)}`, 10, 100); ctx.fillText(`Cur ${name2}: ${formatMs(cur2)}`, 10, 116);
    ctx.restore();

    if (winner) {
      ctx.save(); ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.fillRect(0,0,arena.current.w,arena.current.h);
      ctx.fillStyle = '#0f172a'; ctx.font = '36px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(`${winner} победил!`, arena.current.w/2, arena.current.h/2 - 10);
      ctx.font = '18px sans-serif'; ctx.fillText('Нажми Сброс или В меню', arena.current.w/2, arena.current.h/2 + 26); ctx.restore();
    }
  }

  function drawCar(ctx, car) {
    ctx.save(); ctx.translate(car.x, car.y); ctx.rotate(car.angle);
    ctx.fillStyle = car.color; roundRect(ctx, -16, -10, 32, 20, 4); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(-6, -8, 12, 10);
    ctx.fillStyle = '#111827'; ctx.fillRect(-12, -14, 6, 4); ctx.fillRect(-12, 10, 6, 4); ctx.fillRect(6, -14, 6, 4); ctx.fillRect(6, 10, 6, 4);
    ctx.restore();
    ctx.save(); ctx.fillStyle = '#e5e7eb'; ctx.fillRect(car.x - 22, car.y - 36, 44, 6); ctx.fillStyle = '#60a5fa';
    const perc = clamp(Math.abs(car.speed) / car.maxSpeed, 0, 1);
    ctx.fillRect(car.x - 22, car.y - 36, 44 * perc, 6); ctx.restore();
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  function formatMs(ms) {
    if (!ms && ms !== 0) return '--:--';
    const s = Math.floor(ms / 1000); const mm = Math.floor(s / 60); const ss = s % 60;
    const msRem = Math.floor((ms % 1000) / 10);
    return `${mm}:${String(ss).padStart(2,'0')}.${String(msRem).padStart(2,'0')}`;
  }

  function reset() {
    if (trackConfig && trackConfig.starts) {
      const s = trackConfig.starts;
      if (s.p1) { carsRef.current.p1.x = s.p1.x; carsRef.current.p1.y = s.p1.y; carsRef.current.p1.angle = s.p1.angle ?? carsRef.current.p1.angle; }
      if (s.p2) { carsRef.current.p2.x = s.p2.x; carsRef.current.p2.y = s.p2.y; carsRef.current.p2.angle = s.p2.angle ?? carsRef.current.p2.angle; }
    } else {
      carsRef.current.p1.x = 450 - 160; carsRef.current.p1.y = 260; carsRef.current.p1.angle = 0;
      carsRef.current.p2.x = 450 + 160; carsRef.current.p2.y = 260; carsRef.current.p2.angle = Math.PI;
    }
    const now = performance.now();
    Object.values(carsRef.current).forEach(c => { c.speed = 0; c.laps = 0; c.lastCross = -9999; c.lastSide = null; c.bestLap = null; c.curLapStart = now; c.prevX = c.x; c.prevY = c.y; });
    setWinner(null); setRaceStartedAt(null);
  }

  return (
    <div style={{ position: 'relative', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h2 style={{ margin: 0 }}>{trackConfig?.name ?? 'Tiny Races'}</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onBack} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #e5e7eb' }}>Назад</button>
          <button onClick={reset} style={{ padding: '6px 10px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 6 }}>Сброс</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <canvas ref={canvasRef} style={{ border: '1px solid #e5e7eb', flex: '0 0 auto' }} />
        <div style={{ width: 260 }}>
          <div style={{ marginBottom: 8 }}><b>Управление</b></div>
          <div style={{ fontSize: 13, color: '#374151' }}>{name1}: W/A/S/D — движение</div>
          <div style={{ fontSize: 13, color: '#374151' }}>{name2}: Стрелки — движение</div>

          <div style={{ marginTop: 12, fontWeight: 'bold' }}>Лиды</div>
          <div style={{ marginTop: 6 }}>{name1}: {carsRef.current.p1.laps} круг(ов)</div>
          <div>{name2}: {carsRef.current.p2.laps} круг(ов)</div>

          <div style={{ marginTop: 12, fontWeight: 'bold' }}>Счет побед</div>
          <div style={{ marginTop: 6 }}>{name1}: {scores.p1}</div>
          <div>{name2}: {scores.p2}</div>

          <div style={{ marginTop: 12, color: '#6b7280', fontSize: 13 }}>
            Цель: {LAP_TARGET_REF.current} круга. Пересекай белую линию в направлении движения по трассе.
          </div>
        </div>
      </div>
    </div>
  );
}
