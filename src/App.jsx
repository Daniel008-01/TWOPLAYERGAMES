import React, { useEffect, useState } from "react"; 
import { Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

// Компоненты
import Header from "./components/header/Header.jsx";
import Footer from "./components/footer/Footer.jsx";

// Страницы
import Home from "./pages/home/Home.jsx";
import About from "./pages/about/About.jsx";
import ChangeNames from "./components/changeNames/ChangeNames.jsx";   


// Игры
import Tanks from "./games/tanks/Tanks.jsx";
import GuessNumber from "./games/guessNumber/GuessNumber.jsx";
import ReactionDuel from "./games/reactionDuel/ReactionDuel.jsx";
import Pictionary from "./games/pictionary/Pictionary.jsx";
import TicTakToe from "./games/ticTakToe/TicTakToe.jsx";
import Cube from "./games/cube/Cube.jsx";
import Snake from "./games/snake/Snake.jsx";
import Race from "./games/Race/Race.jsx";
import SquidGame from "./games/squidGame/SquidGame.jsx";

export default function App() {
  // состояние для темы
  const [theme, setTheme] = useState("light");

  // состояние для проверки имён
  const [isNamesSet, setIsNamesSet] = useState(false);  

  // загружаем тему из localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
    }
  }, []);

  // загружаем имена игроков из localStorage
  useEffect(() => {
    const n1 = localStorage.getItem("name1"); 
    const n2 = localStorage .getItem("name2");
    if (n1 && n2) {
      
      setIsNamesSet(true);
    }
  }, []);

  // функция переключения темы
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  };

  return (
    <div className="container">
      <Header onToggleTheme={toggleTheme} theme={theme} />
    

      <Routes>
        {/* страница изменения имён */}
        <Route path="/change-names" element={<ChangeNames />} />

        {/* главная: если имена есть → Home, если нет → редирект */}
        <Route
          path="/"
          element={
            isNamesSet ? <Home /> : <Navigate to="/change-names" replace />
          }
        />

        {/* игры */}
        <Route path="/tanks" element={<Tanks />} />
        <Route path="/number" element={<GuessNumber />} />
        <Route path="/duel" element={<ReactionDuel />} />
        <Route path="/risunok" element={<Pictionary />} />
        <Route path="/tictak" element={<TicTakToe />} />
        <Route path="/cube" element={<Cube />} />
        <Route path="/snake" element={<Snake />} />
        <Route path="/race" element={<Race />} />
        <Route path="/squid" element={<SquidGame />} />

        {/* инфо */}
        <Route path="/about" element={<About />} />
      </Routes>

      <Footer />
    </div>
  );
}
