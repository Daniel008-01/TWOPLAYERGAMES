// Pictionary.jsx
import React, { useEffect, useRef, useState } from "react";
import "./pictionary.scss";
import { Link } from "react-router-dom";

export default function Pictionary({ onBack }) {
  const name1 = localStorage.getItem("name1") || "Игрок 1";
  const name2 = localStorage.getItem("name2") || "Игрок 2";

  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [guess, setGuess] = useState("");
  const [message, setMessage] = useState("");

  const [color, setColor] = useState("#111");
  const [eraser, setEraser] = useState(false);
  const [lineWidth, setLineWidth] = useState(3);
  const [eraserWidth, setEraserWidth] = useState(20);

  const colors = ["#111","#ef4444","#3b82f6","#10b981","#f59e0b","#8b5cf6","#ec4899","#f97316","#22c55e","#6366f1","#f43f5e","#06b6d4"];

  useEffect(() => {
    setMessage(`${name1} рисует, ${name2} угадывает. Нажми «Очистить», чтобы стереть.`);
  }, [name1, name2]);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    c.width = 900;
    c.height = 520;
    const ctx = c.getContext("2d");
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.strokeStyle = color;
  }, []);

  function startDraw(e) {
    setDrawing(true);
    const ctx = canvasRef.current.getContext("2d");
    const rect = canvasRef.current.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  }

  function draw(e) {
    if (!drawing) return;
    const ctx = canvasRef.current.getContext("2d");
    const rect = canvasRef.current.getBoundingClientRect();
    ctx.lineWidth = eraser ? eraserWidth : lineWidth;
    ctx.strokeStyle = eraser ? "#fff" : color;
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  }

  function endDraw() {
    setDrawing(false);
  }

  function clearCanvas() {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  }

  function submitGuess() {
    setMessage(`${name2} ответил: ${guess}`);
    setGuess("");
  }

  return (
    <div className="pictionary-container">
      <div className="pictionary-header">
        <h2>Pictionary</h2>
        <Link to="/"><button className="back-btn">Назад</button></Link>
      </div>

      <div className="pictionary-info">
        Рисуй мышью. <span className="player blue">{name1}</span> — художник, <span className="player red">{name2}</span> — угадывающий.
      </div>

      <div className="pictionary-tools">
  {colors.map((c) => (
    <button
      key={c}
      onClick={() => { setColor(c); setEraser(false); }}
      className={`color-btn ${color === c && !eraser ? "selected" : ""}`}
      style={{ backgroundColor: c }}
    />
  ))}
  <button
    onClick={() => setEraser(true)}
    className={`eraser-btn ${eraser ? "selected" : ""}`}
  >
    Ластик
  </button>

  <label>
    Толщина {eraser ? "ластика" : "кисти"}: 
    <input 
      type="range" 
      min="1" 
      max="30" 
      value={eraser ? eraserWidth : lineWidth} 
      onChange={e => {
        const val = Number(e.target.value);
        if (eraser) setEraserWidth(val);
        else setLineWidth(val);
      }} 
    />
  </label>
</div>


      <div className="pictionary-canvas">
        <canvas
          ref={canvasRef}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
        />
      </div>

      <div className="pictionary-controls">
        <button onClick={clearCanvas}>Очистить</button>
        <input
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          placeholder={`Ответ от ${name2}`}
        />
        <button onClick={submitGuess}>Отправить</button>
      </div>

      <div className="pictionary-message">{message}</div>
    </div>
  );
}
