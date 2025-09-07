import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import Header from './components/header/Header.jsx';
import Home from './pages/home/Home.jsx';
import Footer from './components/footer/Footer.jsx';
import ChangeNames from './components/changeNames/ChangeNames.jsx';
import Tanks from './games/tanks/Tanks.jsx';
import GuessNumber from './games/guessNumber/GuessNumber.jsx';
import ReactionDuel from './games/reactionDuel/ReactionDuel.jsx';
import Pictionary from './games/pictionary/Pictionary.jsx';
import TicTakToe from './games/ticTakToe/TicTakToe.jsx';
import About from './pages/about/About.jsx';
import Cube from './games/cube/Cube.jsx';
import Snake from './games/snake/Snake.jsx';
import Race from './games/Race/Race.jsx'
import SquidGame from './games/squidGame/SquidGame.jsx';



export default function App() {
  return (
    <div className='container'>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/change-names" element={<ChangeNames />} />
        <Route path="/tanks" element={<Tanks />} />
        <Route path="/number" element={<GuessNumber />} />
        <Route path="/duel" element={<ReactionDuel />} />
        <Route path="/risunok" element={<Pictionary />} />
        <Route path="/tictak" element={<TicTakToe />} />
        <Route path="/cube" element={<Cube />} />
        <Route path="/about" element={<About />} />
        <Route path="/snake" element={<Snake />} />
        <Route path="/race" element={<Race />} />
        <Route path="/squid" element={<SquidGame />} />

  
  
      </Routes>
      <Footer />
    </div>
  );
}
