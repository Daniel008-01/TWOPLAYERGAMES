import './about.css';
import React from 'react';
import daniel from './daniel.jpg';
import emir from './emir.jpg';

export default function About() {
  return (
    <div className="about-container">
      <ul className="about-cards">
        <li>
          <a href="#" className="about-card">
            <img src={daniel} className="about-card__image" alt="Daniel" />
            <div className="about-card__overlay">
              <div className="about-card__header">
                <svg className="about-card__arc" xmlns="http://www.w3.org/2000/svg"><path /></svg>                     
                <img className="about-card__thumb" src={daniel} alt="Daniel" />
                <div className="about-card__header-text">
                  <h3 className="about-card__title">Даниель</h3>            
                  <p className="about-card__status">возраст: 17 лет</p>
                </div>
              </div>
              <p className="about-card__description">
                Доп Инфо: разработка стилей всего проекта создание игр : кубик(залипаем), игра в кальмара , змейка 2 на 2 <br/> tg: @erfs_cm
              </p>
            </div>
          </a>      
        </li>

        <li>
          <a href="#" className="about-card">
            <img src={emir} className="about-card__image" alt="Emir" />
            <div className="about-card__overlay">        
              <div className="about-card__header">
                <svg className="about-card__arc" xmlns="http://www.w3.org/2000/svg"><path /></svg>                 
                <img className="about-card__thumb" src={emir} alt="Emir" />
                <div className="about-card__header-text">
                  <h3 className="about-card__title">Emir</h3>
                  <p className="about-card__status">возраст: 14 лет</p>
                </div>
              </div>
              <p className="about-card__description">
                Доп Инфо: создание игр : танчики, угадай число, гонки, Reaction Duel, Pictionary , крестики нолики а также деплой проекта <br/> tg: @marashtg
              </p>
            </div>
          </a>
        </li>
      </ul>
    </div>
  );
}
