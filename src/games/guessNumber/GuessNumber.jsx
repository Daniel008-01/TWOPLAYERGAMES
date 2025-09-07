// Game.jsx
import { useEffect, useState } from "react";
import "./GuessNumber.scss";
import { Link } from "react-router-dom";

export default function Game({ onBack }) {
  const storedName1 = localStorage.getItem("name1") || "Красный";
  const storedName2 = localStorage.getItem("name2") || "Синий";

  const [secret, setSecret] = useState(null); 
  const [secretInput, setSecretInput] = useState(""); 
  const [guess, setGuess] = useState(""); 
  const [log, setLog] = useState([]); 
  const [attempt, setAttempt] = useState(1); 
  const [name1, setName1] = useState(storedName1);
  const [name2, setName2] = useState(storedName2);

  // Игрок 1 загадывает число
  function startSecret() {
    const num = Number(secretInput);
    if (!Number.isInteger(num) || num < 0 || num > 100) {
      alert("Введите целое число от 0 до 100");
      return;
    }
    setSecret(num);
    setLog([]);
    setAttempt(1);
    setSecretInput("");
  }

  // Игрок 2 угадывает
  function tryGuess() {
    if (secret === null) {
      alert(`${name1} должен сначала загадать число!`);
      return;
    }

    const g = Number(guess);
    if (Number.isNaN(g)) return;

    const res = g === secret ? "Верно!" : g < secret ? "Больше" : "Меньше";

    setLog((l) => [{ attempt, guess: g, res }, ...l]);

    if (res === "Верно!") {
      alert(`${name2} угадал число за ${attempt} попыток!`);
      setSecret(null);
      setGuess("");
      setLog([]);
      return;
    }

    setAttempt((a) => a + 1);
    setGuess("");
  }

  return (
    <div className="game-container">
      <h2 className="title">
        <span className="player blue">Игрок: {name1}</span> загадывает,{" "}
        <br />
        <span className="player red">Игрок: {name2}</span> угадывает
      </h2>

      {secret === null ? (
        <div className="game-screen">
          <h3 className="game-title">
            <span className="player blue">{name1}</span>, загадай число
          </h3>
          <input
            type="number"
            value={secretInput}
            onChange={(e) => setSecretInput(e.target.value)}
            placeholder="0-100"
          />
          <button onClick={startSecret}>Загадать</button>
        </div>
      ) : (
        <div className="game-screen">
          <h3 className="game-title">
            <span className="player red">{name2}</span>, угадай число
          </h3>
          <input
            type="number"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            placeholder="0-100"
          />
          <button onClick={tryGuess}>Угадать</button>
        </div>
      )}

      <h3>История ходов:</h3>
      <ul className="log">
        {log.map((entry, i) => (
          <li key={i}>
            Попытка {entry.attempt}: {entry.guess} → {entry.res}
          </li>
        ))}
      </ul>

      <Link to="/"><button className="back-btn" >
        Назад
      </button></Link>
    </div>
  );
}
