import React, { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./tanks.scss";

export default function TinyTanks() {
  const name1 = localStorage.getItem("name1") || "Красный";
  const name2 = localStorage.getItem("name2") || "Синий";

  const canvasRef = useRef(null);
  const requestRef = useRef(null);

  const [score, setScore] = useState({ p1: 0, p2: 0 });
  const [winner, setWinner] = useState(null);

  const [speed, setSpeed] = useState(1); // скорость танков
  const [fireCooldown, setFireCooldown] = useState(1000); // мс
  const [turnSpeed, setTurnSpeed] = useState(0.05); // скорость поворота

  const tanksRef = useRef({
    p1: { x: 100, y: 160, angle: 0, vx: 0, vy: 0, hp: 5, color: "#ef4444" },
    p2: { x: 540, y: 160, angle: Math.PI, vx: 0, vy: 0, hp: 5, color: "#3b82f6" },
  });
  const bulletsRef = useRef([]);
  const keysRef = useRef({});
  const arena = useRef({ w: 640, h: 320, padding: 10 });
  const lastShotRef = useRef({ p1: 0, p2: 0 });

  // --- цикл рендера/обновления ---
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;

    c.width = arena.current.w;
    c.height = arena.current.h;

    const ctx = c.getContext("2d");
    if (!ctx) return;

    let last = performance.now();

    const loop = (now) => {
      const dtMs = Math.min(40, now - last);
      last = now;

      if (!winner) {
        update(dtMs / 16);
      }

      draw(ctx);
      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    };
  }, [winner, speed, fireCooldown, turnSpeed]); // добавляем turnSpeed

  // --- клавиши ---
  useEffect(() => {
    const onKeyDown = (e) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space", "Enter"].includes(e.code)) {
        e.preventDefault();
      }
      keysRef.current[e.code] = true;
    };
    const onKeyUp = (e) => {
      keysRef.current[e.code] = false;
    };

    window.addEventListener("keydown", onKeyDown, { passive: false });
    window.addEventListener("keyup", onKeyUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  // --- логика ---
  function update(dt) {
    ["p1", "p2"].forEach(applyControls);

    for (const id of ["p1", "p2"]) {
      const t = tanksRef.current[id];
      t.x += t.vx * dt;
      t.y += t.vy * dt;
      t.vx *= 0.9;
      t.vy *= 0.9;

      if (t.x < arena.current.padding) { t.x = arena.current.padding; t.vx = Math.abs(t.vx) * 0.7; }
      if (t.x > arena.current.w - arena.current.padding) { t.x = arena.current.w - arena.current.padding; t.vx = -Math.abs(t.vx) * 0.7; }
      if (t.y < arena.current.padding) { t.y = arena.current.padding; t.vy = Math.abs(t.vy) * 0.7; }
      if (t.y > arena.current.h - arena.current.padding) { t.y = arena.current.h - arena.current.padding; t.vy = -Math.abs(t.vy) * 0.7; }
    }

    const alive = [];
    for (const b of bulletsRef.current) {
      b.x += b.dx * dt;
      b.y += b.dy * dt;
      let bounced = false;
      if (b.x < 0) { b.x = 0; b.dx = -b.dx; bounced = true; }
      if (b.x > arena.current.w) { b.x = arena.current.w; b.dx = -b.dx; bounced = true; }
      if (b.y < 0) { b.y = 0; b.dy = -b.dy; bounced = true; }
      if (b.y > arena.current.h) { b.y = arena.current.h; b.dy = -b.dy; bounced = true; }
      if (bounced) b.bouncesLeft--;

      for (const id of ["p1", "p2"]) {
        if (id === b.owner) continue;
        const t = tanksRef.current[id];
        const dx = b.x - t.x, dy = b.y - t.y;
        if (dx * dx + dy * dy < (16 + 6) * (16 + 6)) {
          t.hp -= 1;
          t.vx += (b.dx / 100) * 8;
          t.vy += (b.dy / 100) * 8;
          b.dead = true;

          if (t.hp <= 0 && !winner) {
            const winPlayer = b.owner === "p1" ? name1 : name2;
            setWinner(winPlayer);
            setScore((prev) => ({ ...prev, [b.owner]: prev[b.owner] + 1 }));
          }
        }
      }

      if (!b.dead && b.bouncesLeft >= 0) alive.push(b);
    }
    bulletsRef.current = alive;

    const A = tanksRef.current.p1, B = tanksRef.current.p2;
    const dx = B.x - A.x, dy = B.y - A.y, d2 = dx * dx + dy * dy;
    const minDist = 34;
    if (d2 < minDist * minDist && d2 > 0) {
      const d = Math.sqrt(d2);
      const nx = dx / d, ny = dy / d;
      const overlap = (minDist - d) / 2;
      A.x -= nx * overlap; A.y -= ny * overlap;
      B.x += nx * overlap; B.y += ny * overlap;
      const rvx = (B.vx - A.vx) * 0.2, rvy = (B.vy - A.vy) * 0.2;
      A.vx -= rvx; A.vy -= rvy;
      B.vx += rvx; B.vy += rvy;
    }
  }

  function draw(ctx) {
    ctx.clearRect(0, 0, arena.current.w, arena.current.h);
    ctx.fillStyle = "#eef2ff";
    ctx.fillRect(0, 0, arena.current.w, arena.current.h);

    for (const b of bulletsRef.current) {
      ctx.beginPath();
      ctx.fillStyle = "#111";
      ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const id of ["p1", "p2"]) {
      const t = tanksRef.current[id];
      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.rotate(t.angle);
      ctx.fillStyle = t.color;
      ctx.fillRect(-14, -10, 28, 20);
      ctx.fillStyle = "#111";
      ctx.fillRect(0, -3, 20, 6);
      ctx.restore();

      ctx.fillStyle = "#ddd";
      ctx.fillRect(t.x - 20, t.y - 26, 40, 6);
      ctx.fillStyle = "#10b981";
      ctx.fillRect(t.x - 20, t.y - 26, (Math.max(0, t.hp) / 5) * 40, 6);
    }
  }

  function applyControls(id) {
    const k = keysRef.current;
    const t = tanksRef.current[id];

    let forward = false, backward = false, left = false, right = false;

    if (id === "p1") {
      forward = k["KeyW"]; backward = k["KeyS"]; left = k["KeyA"]; right = k["KeyD"];
      if (k["Space"] && canShoot(id)) shoot(id);
    } else {
      forward = k["ArrowUp"]; backward = k["ArrowDown"]; left = k["ArrowLeft"]; right = k["ArrowRight"];
      if (k["Enter"] && canShoot(id)) shoot(id);
    }

    if (left) t.angle -= turnSpeed;
    if (right) t.angle += turnSpeed;

    if (forward) { t.vx += Math.cos(t.angle) * speed; t.vy += Math.sin(t.angle) * speed; }
    if (backward) { t.vx -= Math.cos(t.angle) * speed * 0.5; t.vy -= Math.sin(t.angle) * speed * 0.5; }

    const sp = Math.hypot(t.vx, t.vy);
    const maxSp = 3 * speed;
    if (sp > maxSp) {
      t.vx = (t.vx / sp) * maxSp;
      t.vy = (t.vy / sp) * maxSp;
    }
  }

  function canShoot(id) {
    const now = performance.now();
    if (now - lastShotRef.current[id] > fireCooldown) {
      lastShotRef.current[id] = now;
      return true;
    }
    return false;
  }

  function shoot(owner) {
    const t = tanksRef.current[owner];
    const spd = 5;
    const dx = Math.cos(t.angle) * spd;
    const dy = Math.sin(t.angle) * spd;
    bulletsRef.current.push({ x: t.x + dx, y: t.y + dy, dx, dy, owner, bouncesLeft: 2 });
  }

  function reset() {
    tanksRef.current = {
      p1: { x: 100, y: 160, angle: 0, vx: 0, vy: 0, hp: 5, color: "#ef4444" },
      p2: { x: 540, y: 160, angle: Math.PI, vx: 0, vy: 0, hp: 5, color: "#3b82f6" },
    };
    bulletsRef.current = [];
    lastShotRef.current = { p1: 0, p2: 0 };
    setWinner(null);
  }

// ... остальной код выше остаётся без изменений

function resetScore() {
  setScore({ p1: 0, p2: 0 });
}

function resetSettings() {
  setSpeed(1);
  setFireCooldown(1000);
  setTurnSpeed(0.05);
}

return (
  <div className="container tank">
    <div className="betwen-div">
      <h2 className="title-tank">Tiny Tanks</h2>
      <div className="buton-div">
        <Link to="/"><button className="back-tank">Назад</button></Link>
        <button onClick={reset} className="reset-tank">Сброс игры</button>
        <button onClick={resetScore} className="reset-score">Сброс счета</button>
        <button onClick={resetSettings} className="reset-settings">Сброс настроек</button>
      </div>
    </div>

    <div className="scoreboard">
      <canvas ref={canvasRef} />
      <div className="setings">
        <div className="upr"><b>Управление</b></div>
        <div className="move">{name1}: W/A/S/D — движение, Space — выстрел</div>
        <div className="move-2">{name2}: Стрелки — движение, Enter — выстрел</div>
        <div className="score">Счёт:</div>
        <div className="name-1">{name1}: {score.p1}</div>
        <div className="name-2">{name2}: {score.p2}</div>

        <div className="speed-control">
          <label>
            Скорость танков: {speed.toFixed(2)}
            <input
              type="range"
              min={0.1}
              max={2.5}
              step={0.01}
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
            />
          </label>
        </div>

        <div className="turnspeed-control">
          <label>
            Скорость поворота: {turnSpeed.toFixed(2)}
            <input
              type="range"
              min={0.01}
              max={0.2}
              step={0.005}
              value={turnSpeed}
              onChange={(e) => setTurnSpeed(parseFloat(e.target.value))}
            />
          </label>
        </div>

        <div className="cooldown-control">
          <label>
            КД стрельбы: {(fireCooldown / 1000).toFixed(2)} c — ({(1000 / fireCooldown).toFixed(2)} )
            <input
              type="range"
              min={100}
              max={2000}
              step={10}
              value={fireCooldown}
              onChange={(e) => setFireCooldown(Number(e.target.value))}
            />
          </label>
        </div>
      </div>
    </div>

    {winner && (
      <div className="overlay">
        <h1>{winner} победил!</h1>
        <div className="overlay-buttons">
          <button onClick={reset} className="reset-overlay">Сброс игры</button>
          <Link to="/"><button className="menu-overlay">В меню</button></Link>
        </div>
      </div>
    )}
  </div>
);

}
