import './about.css';
import React from 'react';
import daniel from './daniel.png';
import emir from './emir.png';

export default function About() {
  return (
    <div className="about-container">
      <ul className="about-cards">
        <li>
          <a href="#" className="about-card">
            <img src={daniel} className="about-card__image" alt="Даниел" />
            <div className="about-card__overlay">
              <div className="about-card__header">
                <svg className="about-card__arc" xmlns="http://www.w3.org/2000/svg"><path /></svg>                     
                <img className="about-card__thumb" src={daniel} alt="Даниел" />
                <div className="about-card__header-text">
                  <h3 className="about-card__title">Даниелчик</h3>            
                  <p className="about-card__status">возраст: 1488 лет</p>
                </div>
              </div>
              <p className="about-card__description">
                Доп Инфо: работает на поле 24/7 за нихуя
              </p>
            </div>
          </a>      
        </li>

        <li>
          <a href="#" className="about-card">
            <img src={emir} className="about-card__image" alt="Емир" />
            <div className="about-card__overlay">        
              <div className="about-card__header">
                <svg className="about-card__arc" xmlns="http://www.w3.org/2000/svg"><path /></svg>                 
                <img className="about-card__thumb" src={emir} alt="Емир" />
                <div className="about-card__header-text">
                  <h3 className="about-card__title">Емирчик</h3>
                  <p className="about-card__status">возраст: 卐卐卐 лет</p>
                </div>
              </div>
              <p className="about-card__description">
                Доп Инфо: работает стриптизером в гей клубе
              </p>
            </div>
          </a>
        </li>
      </ul>
    </div>
  );
}
