import React from "react";
import { Link } from "react-router-dom";
import tanki from "../../img/tankmayhem.jpg";
import chislo from "../../img/chislo.jpg";
import race from "../../img/race.jpg";
import eye from "../../img/eye.jpg";
import find from "../../img/find.jpg";
import tictac from "../../img/tictac.jpg";
import cube from "../../img/cube.jpg";
import snake from "../../img/snake.jpg";
import game from '../../img/game.jpg'

import "./home.scss";

export default function Home() {
  const name1 = localStorage.getItem("name1") || "Красный";
  const name2 = localStorage.getItem("name2") || "Синий";

  const games = [
    { title: "Танчики", description: "WASD + стрелки", color: "#2563eb", path: "/tanks", img: game },
    { title: "Угадай число", description: "Соревнуйтесь", color: "#16a34a", path: "/number", img: game },
    { title: "Гонки", description: "Выбери трек", color: "#dc2626", path: "/race", img:game  },
    { title: "Reaction Duel", description: "Проверка реакции", color: "#f59e0b", path: "/duel", img:game },
    { title: "Pictionary", description: "Рисуйте слова", color: "#8b5cf6", path: "/risunok", img:game  },
    { title: "Крестики-нолики", description: "Играем вдвоём", color: "#0d31e4ff", path: "/tictak", img: game },
    { title: "Кубик", description: "Залипаем", color: "lightgreen", path: "/cube", img: game },
    { title: "змейка", description: "Играем в змейку 1 х 1", color: "lightpink", path: "/snake", img: game },
    { title: "squid", description: "Игра в кальмара", color: "lightyellow", path: "/squid", img:game },
   

  ];

  return (
    <div className="container">
      <h2 className="home-title">Привет, {name1} и {name2}!</h2>
      

      <ul className="cards">
        {games.map((game) => (
          <li key={game.title}>
            <div className="card">
              <img src={game.img} className="card__image" alt={game.title} />
              <div className="card__overlay">
                <div className="card__header">
                  <svg className="card__arc" xmlns="http://www.w3.org/2000/svg">
                    <path />
                  </svg>
                  <img className="card__thumb" src={game.img} alt={game.title} />
                  <div className="card__header-text">
                    <h3 className="card__title">{game.title}</h3>
                    <p className="card__status">{game.description}</p>
                  </div>
                </div>
                <div className="stage">
                <Link to={game.path}>
                  <button className="card__description" style={{ background: game.color }}>
                    Играть
                  </button>
                </Link>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// отделение 

// ipomport React from "react"; 
// imrt { Link } from "react-router-dom";
// import tanki from "../../img/tanki.jpg";
// import chislo from "../../img/chislo.jpg";
// import race from "../../img/race.jpg";
// import eye from "../../img/eye.jpg";
// import find from "../../img/find.jpg";
// import tictac from "../../img/tictac.jpg";
// import cube from "../../img/cube.jpg";
// import "./home.scss";

// export default function Home() {
//   const name1 = localStorage.getItem("name1") || "Красный";
//   const name2 = localStorage.getItem("name2") || "Синий";

//   const games = [
//     { title: "Танчики", description: "WASD + стрелки", color: "#2563eb", path: "/tanks", img: tanki },
//     { title: "Угадай число", description: "Соревнуйтесь", color: "#16a34a", path: "/number", img: chislo },
//     { title: "Гонки", description: "Выбери трек", color: "#dc2626", path: "/race", img: race },
//     { title: "Reaction Duel", description: "Проверка реакции", color: "#f59e0b", path: "/duel", img: eye },
//     { title: "Pictionary", description: "Рисуйте слова", color: "#8b5cf6", path: "/risunok", img: find },
//     { title: "Крестики-нолики", description: "Играем вдвоём", color: "#0d31e4ff", path: "/tictak", img: tictac },
//     { title: "Кубик", description: "Залипаем", color: "lightgreen", path: "/cube", img: cube },
//   ];

//   return (
//     <div className="home-container">
//       <h2 className="home-title">Привет, {name1} и {name2}!</h2>
//       <ul className="cards">
//         {games.map((game) => (
//           <li key={game.title} className="card-wrapper">
//             <div className="card">
//               <img src={game.img} className="card__image" alt={game.title} />
//               <div className="card__overlay">
//                 <div className="card__header">
//                   <img className="card__thumb" src={game.img} alt={game.title} />
//                   <div className="card__header-text">
//                     <h3 className="card__title">{game.title}</h3>
//                     <p className="card__status">{game.description}</p>
//                   </div>
//                 </div>
//                 <div className="card__stage">
//                   <Link to={game.path}>
//                     <button className="card__description" style={{ background: game.color }}>
//                       Играть
//                     </button>
//                   </Link>
//                 </div>
//               </div>
//             </div>
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// }
