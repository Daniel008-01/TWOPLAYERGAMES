import { useEffect, useState } from "react";
import "./guessNumber.scss";
import { Link } from "react-router-dom";

export default function Game({ onBack }) {
  const storedName1 = localStorage.getItem("name1") || "Красный";
  const storedName2 = localStorage.getItem("name2") || "Синий";

  const [secret, setSecret] = useState(null);
  const [secretInput, setSecretInput] = useState("");
  const [guess, setGuess] = useState("");
  const [log, setLog] = useState([]);
  const [attempt, setAttempt] = useState(1);
  const [maxAttempts, setMaxAttempts] = useState(5); // новое: максимальные попытки
  const [name1, setName1] = useState(storedName1);
  const [name2, setName2] = useState(storedName2);
  const [gameOver, setGameOver] = useState(false);

  // Игрок 1 загадывает число и указывает max попытки
  function startSecret() {
    const num = Number(secretInput);
    if (!Number.isInteger(num) || num < 0 || num > 100) {
      alert("Введите целое число от 0 до 100");
      return;
    }
    if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
      alert("Введите корректное количество попыток (от 1 и выше)");
      return;
    }
    setSecret(num);
    setLog([]);
    setAttempt(1);
    setSecretInput("");
    setGameOver(false);
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
      setGameOver(true);
      return;
    }

    if (attempt >= maxAttempts) {
      alert(`${name2} не угадал число! Победил ${name1}`);
      setGameOver(true);
      return;
    }

    setAttempt((a) => a + 1);
    setGuess("");
  }

  function resetGame() {
    setSecret(null);
    setSecretInput("");
    setGuess("");
    setLog([]);
    setAttempt(1);
    setGameOver(false);
    setMaxAttempts(5);
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
          <input
            type="number"
            value={maxAttempts}
            onChange={(e) => setMaxAttempts(Number(e.target.value))}
            placeholder="Количество попыток"
            min={1}
          />
          <button onClick={startSecret} className="done">Загадать</button>
        </div>
      ) : !gameOver ? (
        <div className="game-screen">
          <h3 className="game-title">
            <span className="player red">{name2}</span>, угадай число
          </h3>
          <p>Попытка {attempt} из {maxAttempts}</p>
          <input
            type="number"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            placeholder="0-100"
          />
          <button onClick={tryGuess}>Угадать</button>
        </div>
      ) : (
        <div className="game-screen">
          <h3 className="game-title">
            Игра окончена!
          </h3>
          <button onClick={resetGame} className="done">Играть заново</button>
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

      <Link to="/"><button className="back-btn">Назад</button></Link>
      <button onClick={resetGame} className="done" style={{marginLeft: "10px"}}>Играть заново</button>
    </div>
  );
}
