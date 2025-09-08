import React, { useEffect, useRef, useState } from "react";
import "./squidGame.scss";

export default function SquidGame() {
  const name1 = localStorage.getItem("name1") || "Красный";
  const name2 = localStorage.getItem("name2") || "Синий";
  // конфиг поля и сетки (клетки)
  const ARENA_W = 900;
  const ARENA_H = 520;
  const CELL = 20;
  const COLS = Math.floor(ARENA_W / CELL);
  const ROWS = Math.floor(ARENA_H / CELL);
  const PLAYER_SIZE = CELL - 2;
  const FINISH_ROW = 0;

  // push
  const PUSH_RANGE = 3; // в клетках
  const PUSH_COOLDOWN_MS = 450;

  // скорость (шагов в секунду)
  const [ticksPerSecond, setTicksPerSecond] = useState(6);
  const tickMsRef = useRef(1000 / ticksPerSecond);
  useEffect(() => { tickMsRef.current = 1000 / ticksPerSecond; }, [ticksPerSecond]);

  // сигнал светофора
  const [signal, setSignal] = useState("red");
  const signalRef = useRef("red");
  useEffect(() => { signalRef.current = signal; }, [signal]);

  // победитель
  const [winner, setWinner] = useState(null);
  const winnerRef = useRef(null);
  useEffect(() => { winnerRef.current = winner; }, [winner]);

  // позиции игроков в клетках (refs для быстрой работы) и ререндер
  const redRef = useRef({ x: Math.floor(COLS * 0.25), y: ROWS - 4 });
  const blueRef = useRef({ x: Math.floor(COLS * 0.75), y: ROWS - 4 });
  const [, setTick] = useState(0);

  // клавиши + история последнего нажатия (для приоритета)
  const keysRef = useRef({});
  const lastPressedRef = useRef({});

  // интервалы / таймеры
  const intervalRef = useRef(null);
  const lightTimerRef = useRef(null);
  const lastStepTsRef = useRef(0);

  // immediate-step флаг не нужен — используем performImmediate и блокируем автоповтор
  const lastPushRedRef = useRef(0);
  const lastPushBlueRef = useRef(0);

  const clampCell = (v, min, max) => Math.max(min, Math.min(max, v));

  // Сброс позиций
  const resetPositions = () => {
    redRef.current = { x: Math.floor(COLS * 0.25), y: ROWS - 4 };
    blueRef.current = { x: Math.floor(COLS * 0.75), y: ROWS - 4 };
    keysRef.current = {};
    lastPressedRef.current = {};
    lastStepTsRef.current = 0;
    setTick(t => t + 1);
  };

  // переключение сигнала (рандомный интервал)
  const scheduleSignal = () => {
    clearTimeout(lightTimerRef.current);
    const nextMs = 1800 + Math.random() * 1400;
    lightTimerRef.current = setTimeout(() => {
      signalRef.current = signalRef.current === "red" ? "green" : "red";
      setSignal(signalRef.current);
      scheduleSignal();
    }, nextMs);
  };

  // возвращает направление ("up"/"down"/"left"/"right") по последней нажатой клавише в наборе
  const getDirectionFor = (which) => {
    const map = which === "red"
      ? ["KeyW", "KeyS", "KeyA", "KeyD"]
      : ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
    let best = null, bestT = -1;
    for (const code of map) {
      if (keysRef.current[code]) {
        const t = lastPressedRef.current[code] || 0;
        if (t > bestT) { bestT = t; best = code; }
      }
    }
    if (!best) return null;
    if (best === "KeyW" || best === "ArrowUp") return "up";
    if (best === "KeyS" || best === "ArrowDown") return "down";
    if (best === "KeyA" || best === "ArrowLeft") return "left";
    if (best === "KeyD" || best === "ArrowRight") return "right";
    return null;
  };

  // Шаг: перемещение по клетке в зависимости от текущих нажатий
  // nowTs указывает момент шага (performance.now())
  const performStep = (nowTs = performance.now()) => {
    if (winnerRef.current) return;
    // если красный — движение запрещено (поражение того, кто двигается)
    if (signalRef.current === "red") {
      const redPressed = keysRef.current["KeyW"] || keysRef.current["KeyA"] || keysRef.current["KeyS"] || keysRef.current["KeyD"];
      const bluePressed = keysRef.current["ArrowUp"] || keysRef.current["ArrowLeft"] || keysRef.current["ArrowDown"] || keysRef.current["ArrowRight"];
      if (redPressed) { winnerRef.current = name2; setWinner(name2); lastStepTsRef.current = nowTs; return; }
      if (bluePressed) { winnerRef.current = name1; setWinner(name1); lastStepTsRef.current = nowTs; return; }
      lastStepTsRef.current = nowTs;
      return;
    }

    const prevR = { ...redRef.current }, prevB = { ...blueRef.current };
    const dirR = getDirectionFor("red");
    const dirB = getDirectionFor("blue");

    const moveCell = (pos, dir) => {
      if (!dir) return pos;
      let nx = pos.x, ny = pos.y;
      if (dir === "up") ny -= 1;
      if (dir === "down") ny += 1;
      if (dir === "left") nx -= 1;
      if (dir === "right") nx += 1;
      nx = clampCell(nx, 0, COLS - 1);
      ny = clampCell(ny, 0, ROWS - 1);
      return { x: nx, y: ny };
    };

    const newR = moveCell(redRef.current, dirR);
    const newB = moveCell(blueRef.current, dirB);

    redRef.current = newR;
    blueRef.current = newB;
    lastStepTsRef.current = nowTs;

    // финиш
    if (!winnerRef.current) {
      if (newR.y <= FINISH_ROW) { winnerRef.current = name1; setWinner(name1); }
      else if (newB.y <= FINISH_ROW) { winnerRef.current = name2; setWinner(name2); }
    }

    // если позиция изменилась — ререндер
    if (newR.x !== prevR.x || newR.y !== prevR.y || newB.x !== prevB.x || newB.y !== prevB.y) {
      setTick(t => t + 1);
    }
  };

  // push
  const tryPush = (who) => {
    if (winnerRef.current) return;
    const now = performance.now();
    if (who === "red") {
      if (now - lastPushRedRef.current < PUSH_COOLDOWN_MS) return;
      lastPushRedRef.current = now;
      pushFromTo("red");
    } else {
      if (now - lastPushBlueRef.current < PUSH_COOLDOWN_MS) return;
      lastPushBlueRef.current = now;
      pushFromTo("blue");
    }
  };

  const pushFromTo = (fromName) => {
    const from = fromName === "red" ? redRef.current : blueRef.current;
    const to = fromName === "red" ? blueRef.current : redRef.current;
    const dx = to.x - from.x, dy = to.y - from.y;
    const distCells = Math.hypot(dx, dy);
    if (distCells > PUSH_RANGE) return;
    const nx = distCells === 0 ? 0 : Math.round(dx / distCells);
    const ny = distCells === 0 ? -1 : Math.round(dy / distCells);
    const push = (pos) => {
      let nxp = pos.x + nx * 2;
      let nyp = pos.y + ny * 2;
      nxp = clampCell(nxp, 0, COLS - 1);
      nyp = clampCell(nyp, 0, ROWS - 1);
      return { x: nxp, y: nyp };
    };

    if (fromName === "red") {
      blueRef.current = push(blueRef.current);
      if (signalRef.current === "red") { winnerRef.current = name1; setWinner(name1); }
    } else {
      redRef.current = push(redRef.current);
      if (signalRef.current === "red") { winnerRef.current = name2; setWinner(name2); }
    }
    setTick(t => t + 1);
  };

  // клавиши: preventDefault для стрелок/space/enter, track keys + lastPressed.
  // выполняем ОДИН мгновенный шаг при первом keydown (ignore e.repeat)
  useEffect(() => {
    const isEditable = (el) => el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
    const preventKeys = new Set(["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter"]);

    const onKeyDown = (e) => {
      if (!isEditable(e.target) && preventKeys.has(e.code)) e.preventDefault();

      keysRef.current[e.code] = true;
      lastPressedRef.current[e.code] = performance.now();

      // мгновенный первый шаг — только если это не автоповтор
      if (!e.repeat && ["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
        const now = performance.now();
        // выполняем шаг сразу и блокируем следующий до tickMs
        performStep(now);
      }

      if (e.code === "Space") tryPush("red");
      if (e.code === "Enter") tryPush("blue");
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // основной интервал: проверяет время и выполняет шаг, если прошло >= tickMs
  useEffect(() => {
    resetPositions();
    signalRef.current = "red";
    setSignal("red");
    scheduleSignal();

    const tickCheck = () => {
      const now = performance.now();
      const tickMs = tickMsRef.current;
      if (now - lastStepTsRef.current >= tickMs) {
        performStep(now);
      }
    };

    clearInterval(intervalRef.current); // очистка старого интервала
    intervalRef.current = setInterval(tickCheck, 30);

    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(lightTimerRef.current);
    };
  }, [ticksPerSecond]); // <-- добавляем сюда зависимость


  // Start / Restart UI
  const handleStart = () => {
    if (winnerRef.current) {
      winnerRef.current = null;
      setWinner(null);
      resetPositions();
    }
    signalRef.current = "green";
    setSignal("green");
    clearTimeout(lightTimerRef.current);
    scheduleSignal();
    // сразу позволим шагнуть (если удерживается клавиша, последний keydown уже мог выполнить шаг)
    const now = performance.now();
    lastStepTsRef.current = now; // признак что шаг выполнен сейчас
  };

  const handleRestart = () => {
    winnerRef.current = null;
    setWinner(null);
    signalRef.current = "red";
    setSignal("red");
    clearTimeout(lightTimerRef.current);
    scheduleSignal();
    resetPositions();
  };

  // positions for rendering (pixel coords)
  const redPos = redRef.current;
  const bluePos = blueRef.current;

  // стили инлайн — чтобы гарантировать видимость
  const arenaStyle = { width: ARENA_W, height: ARENA_H, position: "relative", overflow: "hidden", backgroundColor: "#f8fafc" };
  const gridStyle = {
    position: "absolute", left: 0, top: 0, width: ARENA_W, height: ARENA_H, zIndex: 0,
    backgroundSize: `${CELL}px ${CELL}px`,
    backgroundImage:
      `linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px),
       linear-gradient(to bottom, rgba(0,0,0,0.04) 1px, transparent 1px)`,
    pointerEvents: "none",
  };
  const playerBaseStyle = { position: "absolute", zIndex: 2, borderRadius: 4, boxShadow: "0 2px 6px rgba(0,0,0,0.15)", display: "block" };


  return (
    <div className="sg-container">
      <div className="sg-hud" style={{ marginBottom: 12 }}>
        <div className="sg-names">
          <span className="sg-redName">{name1}</span>
          <span className="sg-blueName">{name2}</span>
        </div>

        <div
          className="sg-signal"
          aria-label={signal === "red" ? "Красный" : "Зелёный"}
          style={{
            background: signal === "red" ? "#ef4444" : "#22c55e",
          }}
        />


        <div className="sg-controls">
          <button className="sg-restartBtn" onClick={handleStart}>
            Start (с зелёного)
          </button>
          <button className="sg-restartBtn" onClick={handleRestart}>
            Рестарт
          </button>
        </div>

        <div className="sg-speed">
          <label>Speed (шагов/с)</label>
          <input
            type="range"
            min={2}
            max={12}
            value={ticksPerSecond}
            onChange={(e) => setTicksPerSecond(Number(e.target.value))}
          />
          <span>{ticksPerSecond}</span>
        </div>
      </div>

      <div className="sg-arena" style={arenaStyle}>
        <div className="sg-grid" style={gridStyle} />
        <div className="sg-finish" />

        <div
          className="sg-player sg-red"
          style={{
            ...playerBaseStyle,
            transform: `translate3d(${redPos.x * CELL + 1}px, ${redPos.y * CELL + 1
              }px, 0)`,
            width: PLAYER_SIZE,
            height: PLAYER_SIZE,
          }}
          title={name1}
        />

        <div
          className="sg-player sg-blue"
          style={{
            ...playerBaseStyle,
            transform: `translate3d(${bluePos.x * CELL + 1}px, ${bluePos.y * CELL + 1
              }px, 0)`,
            width: PLAYER_SIZE,
            height: PLAYER_SIZE,
          }}
          title={name2}
        />
      </div>

      {winner && (
        <div className="sg-overlay">
          <div className="sg-dialog">
            <h3>Победил {winner}!</h3>
            <div className="sg-dialogBtns">
              <button onClick={handleRestart}>Старт с красного</button>
              <button
                onClick={() => {
                  handleRestart();
                  handleStart();
                }}
              >
                Старт с зелёного
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="sg-help">
        <div>
          <b>{name1}</b>: WASD — движение (удерживайте), пробел — толкнуть
        </div>
        <div>
          <b>{name2}</b>: стрелки — движение (удерживайте), Enter — толкнуть
        </div>
        <div>
          На <span className="sg-badge sg-redBadge">красный</span> двигаться
          нельзя!
        </div>
      </div>
    </div>
  );
}
