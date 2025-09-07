// ReactionDuel.jsx
import React, { useEffect, useRef, useState } from "react";
import "./reactionDuel.scss";
import { Link } from "react-router-dom";

export default function ReactionDuel({ onBack }) {
  const name1 = localStorage.getItem("name1") || "Игрок 1";
  const name2 = localStorage.getItem("name2") || "Игрок 2";

  const [state, setState] = useState("ready"); // ready -> waiting -> go -> result
  const [winner, setWinner] = useState(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    function onKey(e) {
      if (state !== "go") return;
      if (e.code === "Enter") finish(`${name1} (Enter)`);
      if (e.code === "Space") finish(`${name2} (Space)`);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state, name1, name2]);

  function start() {
    setWinner(null);
    setState("waiting");
    const delay = 800 + Math.random() * 2200;
    timeoutRef.current = setTimeout(() => setState("go"), delay);
  }

  function finish(w) {
    if (state !== "go") return;
    setWinner(w);
    setState("result");
    clearTimeout(timeoutRef.current);
  }

  function reset() {
    clearTimeout(timeoutRef.current);
    setState("ready");
    setWinner(null);
  }

  return (
    <div className="reaction-container">
      <div className="reaction-header">
        <h2>Дуэль реакции</h2>
        <Link to="/"><button className="back-btn" >Назад</button></Link>
      </div>

      <div className="reaction-info">
        Управление: <span className="player blue">{name1}</span> — Enter, <span className="player red">{name2}</span> — Space.
      </div>

      <div className="reaction-box">
        {state === "ready" && (
          <div className="reaction-start">
            <div className="reaction-text">Нажми старт и жди сигнала</div>
            <button className="start-btn" onClick={start}>Старт</button>
          </div>
        )}
        {state === "waiting" && <div className="reaction-wait">Жди... скоро будет GO</div>}
        {state === "go" && <div className="reaction-go">GO! Нажимай!</div>}
        {state === "result" && <div className="reaction-result">Победитель: {winner}</div>}
      </div>

      <div className="reaction-footer">
        <button className="reset-btn" onClick={reset}>Сброс</button>
      </div>
    </div>
  );
}
