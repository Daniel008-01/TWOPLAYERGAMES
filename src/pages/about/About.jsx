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
                  <p className="about-card__status">Возраст: 17 лет</p>
                </div>
              </div>
              <p className="about-card__description">
                Полностью разработал и собрал проект, включая все игры и функциональные страницы. Автор игр "Кубик", "Змейка 1 на 1", "Игра в кальмара". Создал полностью дизайн проекта, включая хедер, футер и главную страницу, реализовал смену ников.
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
                  <h3 className="about-card__title">Эмир</h3>
                  <p className="about-card__status">Возраст: 14 лет</p>
                </div>
              </div>
              <p className="about-card__description">
                Разработал игры "Танчики", "Угадай число", "Дуель реакции", "Pictionary", "Крестики-нолики". Отвечал за деплой проекта и оформление игровых интерфейсов, а также логику созданных игр.
              </p>
            </div>
          </a>
        </li>
      </ul>
    </div>
  );
}
