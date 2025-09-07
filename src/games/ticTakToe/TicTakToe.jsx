import React, { useEffect, useState } from "react";
import "./ticTakToe.scss";
import { Link } from "react-router-dom";

export default function TicTacToe({ onBack }) {
  const name1 = localStorage.getItem("name1") || "Игрок 1";
  const name2 = localStorage.getItem("name2") || "Игрок 2";

  const [board, setBoard] = useState(Array(9).fill(null));
  const [xTurn, setXTurn] = useState(true);
  const [winner, setWinner] = useState(null);
  const [timeLeft, setTimeLeft] = useState(10);

  useEffect(() => {
    if (winner) return;
    if (timeLeft <= 0) {
      setXTurn((t) => !t);
      setTimeLeft(10);
    }
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timeLeft, winner]);

  useEffect(() => setTimeLeft(10), [xTurn]);

  function handleClick(i) {
    if (board[i] || winner) return;
    const b = board.slice();
    b[i] = xTurn ? "X" : "O";
    setBoard(b);
    setXTurn(!xTurn);
    setTimeLeft(10);
    const w = calcWinner(b);
    if (w) setWinner(w);
  }

  function reset() {
    setBoard(Array(9).fill(null));
    setXTurn(true);
    setWinner(null);
    setTimeLeft(10);
  }

  const currentPlayer = xTurn ? name1 : name2;
  const winnerName =
    winner === "X" ? name1 : winner === "O" ? name2 : winner === "draw" ? "draw" : null;

  return (
    <div className="tic-tac-toe-container">
      <div className="header">
        <h2>Крестики-нолики</h2>
        <div className="buttons">
          <Link to="/"><button>Назад</button></Link>
          <button onClick={reset} className="new-game">Новая</button>
        </div>
      </div>

      <div className="status">
        Ход: <b>{winner ? "—" : currentPlayer}</b> — таймер: {timeLeft}s
      </div>

      <div className="board">
        {board.map((v, i) => (
          <button key={i} className="cell" onClick={() => handleClick(i)}>
            {v}
          </button>
        ))}
      </div>

      {winner && (
        <div className="result">
          Результат: {winner === "draw" ? "Ничья" : `Победил ${winnerName}`}
        </div>
      )}
    </div>
  );
}

function calcWinner(b) {
  const lines = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for (const [a, c, d] of lines) {
    if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
  }
  if (b.every(Boolean)) return "draw";
  return null;
}
