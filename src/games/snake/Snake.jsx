import React, { useState, useEffect, useRef } from "react";
import "./snake.scss"; // импорт стилей 
import { Link } from "react-router-dom";

const CELL_SIZE = 20;
const WIDTH = 600;
const HEIGHT = 400;
const DEFAULT_LENGTH = 3;

export default function SnakeTwoPlayers() {
  const [snake1, setSnake1] = useState([]);
  const [snake2, setSnake2] = useState([]);
  const [apple, setApple] = useState({ x: 0, y: 0 });
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(200);
  const [wrap, setWrap] = useState(false);
  const [roundWinner, setRoundWinner] = useState(null);
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);

  const canvasRef = useRef(null);
  const dir1Ref = useRef("RIGHT");
  const dir2Ref = useRef("LEFT");

  const player1Name = localStorage.getItem("name1") || "Красный";
  const player2Name = localStorage.getItem("name2") || "Синий";

  const initPositions = () => {
    const startY = Math.floor(HEIGHT / CELL_SIZE / 2);
    const s1 = Array.from({ length: DEFAULT_LENGTH }, (_, i) => ({ x: 5 - i, y: startY }));
    const s2 = Array.from({ length: DEFAULT_LENGTH }, (_, i) => ({ x: 25 + i, y: startY }));
    setSnake1(s1);
    setSnake2(s2);
    dir1Ref.current = "RIGHT";
    dir2Ref.current = "LEFT";
    setApple(randomApple());
    setRoundWinner(null);
  };

  const randomApple = () => {
    const x = Math.floor(Math.random() * (WIDTH / CELL_SIZE));
    const y = Math.floor(Math.random() * (HEIGHT / CELL_SIZE));
    return { x, y };
  };

  useEffect(() => initPositions(), []);

  useEffect(() => {
    const handleKey = (e) => {
      switch (e.key) {
        case "w": if (dir1Ref.current !== "DOWN") dir1Ref.current = "UP"; break;
        case "s": if (dir1Ref.current !== "UP") dir1Ref.current = "DOWN"; break;
        case "a": if (dir1Ref.current !== "RIGHT") dir1Ref.current = "LEFT"; break;
        case "d": if (dir1Ref.current !== "LEFT") dir1Ref.current = "RIGHT"; break;
        case "ArrowUp": if (dir2Ref.current !== "DOWN") dir2Ref.current = "UP"; e.preventDefault(); break;
        case "ArrowDown": if (dir2Ref.current !== "UP") dir2Ref.current = "DOWN"; e.preventDefault(); break;
        case "ArrowLeft": if (dir2Ref.current !== "RIGHT") dir2Ref.current = "LEFT"; e.preventDefault(); break;
        case "ArrowRight": if (dir2Ref.current !== "LEFT") dir2Ref.current = "RIGHT"; e.preventDefault(); break;
        default: break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    if (!running || roundWinner) return;
    const interval = setInterval(() => moveSnakes(), speed);
    return () => clearInterval(interval);
  }, [running, speed, roundWinner, snake1, snake2]);

  const moveSnakes = () => {
    const newSnake1 = moveSnake(snake1, dir1Ref.current, snake2);
    const newSnake2 = moveSnake(snake2, dir2Ref.current, newSnake1);
    setSnake1(newSnake1);
    setSnake2(newSnake2);
    checkCollision(newSnake1, newSnake2);
  };

  const moveSnake = (snake, dir, otherSnake) => {
    const head = { ...snake[0] };
    switch (dir) {
      case "RIGHT": head.x += 1; break;
      case "LEFT": head.x -= 1; break;
      case "UP": head.y -= 1; break;
      case "DOWN": head.y += 1; break;
      default: break;
    }

    if (wrap) {
      if (head.x < 0) head.x = WIDTH / CELL_SIZE - 1;
      if (head.x >= WIDTH / CELL_SIZE) head.x = 0;
      if (head.y < 0) head.y = HEIGHT / CELL_SIZE - 1;
      if (head.y >= HEIGHT / CELL_SIZE) head.y = 0;
    }

    let newSnake = [head, ...snake];

    if (head.x === apple.x && head.y === apple.y) {
      setApple(randomApple());
    } else {
      newSnake.pop();
    }

    return newSnake;
  };

  const checkCollision = (s1, s2) => {
    const head1 = s1[0];
    const head2 = s2[0];

    if (head1.x === head2.x && head1.y === head2.y) {
      const randWinner = Math.random() < 0.5 ? player1Name : player2Name;
      endRound(randWinner);
      return;
    }

    const collided1 =
      s1.slice(1).some(seg => seg.x === head1.x && seg.y === head1.y) ||
      s2.some(seg => seg.x === head1.x && seg.y === head1.y) ||
      (!wrap && (head1.x < 0 || head1.x >= WIDTH / CELL_SIZE || head1.y < 0 || head1.y >= HEIGHT / CELL_SIZE));

    const collided2 =
      s2.slice(1).some(seg => seg.x === head2.x && seg.y === head2.y) ||
      s1.some(seg => seg.x === head2.x && seg.y === head2.y) ||
      (!wrap && (head2.x < 0 || head2.x >= WIDTH / CELL_SIZE || head2.y < 0 || head2.y >= HEIGHT / CELL_SIZE));

    if (collided1 && collided2) {
      const randWinner = Math.random() < 0.5 ? player1Name : player2Name;
      endRound(randWinner);
    } else if (collided1) {
      endRound(player2Name);
    } else if (collided2) {
      endRound(player1Name);
    }
  };

  const endRound = (winnerName) => {
    setRoundWinner(winnerName);
    if (winnerName === player1Name) setScore1(s => s + 1);
    else setScore2(s => s + 1);
    setRunning(false);
  };

  const draw = () => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = "green";
    ctx.fillRect(apple.x * CELL_SIZE, apple.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);

    snake1.forEach(seg => {
      ctx.fillStyle = "red";
      ctx.fillRect(seg.x * CELL_SIZE, seg.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      ctx.strokeStyle = "black";
      ctx.strokeRect(seg.x * CELL_SIZE, seg.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    });

    snake2.forEach(seg => {
      ctx.fillStyle = "blue";
      ctx.fillRect(seg.x * CELL_SIZE, seg.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      ctx.strokeStyle = "black";
      ctx.strokeRect(seg.x * CELL_SIZE, seg.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    });
  };

  useEffect(() => draw(), [snake1, snake2, apple]);


return (
  <div className="snake-game-container">
    <canvas
      ref={canvasRef}
      width={WIDTH}
      height={HEIGHT}
      className="snake-canvas"
    />
    <div className="snake-menu">
      <button
        onClick={() => {
          if (!running) setRunning(true);
          if (!snake1.length || roundWinner) initPositions();
        }}
      >
        Start
      </button>
      <button
        onClick={() => {
          initPositions();
          setRunning(false);
        }}
      >
        Restart
      </button>
      <button
        onClick={() => {
          setScore1(0);
          setScore2(0);
        }}
      >
        Reset Score
      </button>
      <Link to="/"><button>назад</button></Link>
      <div>
        <label>
          Wrap walls:{" "}
          <input type="checkbox" checked={wrap} onChange={(e) => setWrap(e.target.checked)} />
        </label>
      </div>
      <div>
        <label>
          Speed:{" "}
          <input
            type="range"
            min="50"
            max="400"
            value={400 - speed + 50}
            onChange={(e) => setSpeed(400 - parseInt(e.target.value) + 50)}
          />
        </label>
      </div>
      <div className="score">
        <p>{player1Name}: {score1}</p>
        <p>{player2Name}: {score2}</p>
        {roundWinner && <h3>Winner: {roundWinner}</h3>}
      </div>
    </div>
  </div>
); }
