import "./footer.css";
import logo from "../header/logo-Cite.jpg"; 
import GitHub from './GitHub.png';
import { Link } from "react-router-dom";
import { useEffect } from "react";

export const Footer = () => {
  useEffect(() => {
    const share = document.querySelector(".share");

    const addHover = setTimeout(() => {
      share.classList.add("hover");
    }, 1000);

    const removeHover = setTimeout(() => {
      share.classList.remove("hover");
    }, 3000);

    return () => {
      clearTimeout(addHover);
      clearTimeout(removeHover);
    };
  }, []);
  return (
    <footer className="footer container">
      <div className="footer-container">
        <div className="footer-logo">
          <img src={logo} alt="Logo" />
        </div>
        <div className="footer-content">
        
          <div>
            <h4>Навигация</h4>
            <ul>
              <li><Link to="/">Главная</Link></li>
              <li><Link to="/about">Разработчики</Link></li>
              
            
             
            </ul>
          </div>
          <div className="btn_wrap">
            <span className="contact-footer">Contacts</span>
            <div className="contacts-container">
              <i className="fab fa-facebook-f"></i>
              <i className="fab fa-twitter"></i>
              <i className="fab fa-instagram"></i>
              <i className="fab fa-github"></i>
            </div>
            <a href="https://github.com/Emirs-Programms" className="dr-url" target="_blank" style={{display: 'grid', fontSize: '10px'}}>
              <img className="dr" src={GitHub} alt="" />Emirs-Programms
            </a>
            <a href="https://github.com/Daniel008-01" className="dr-url" target="_blank" style={{display: 'grid', fontSize: '10px', marginLeft: '10px'}}>
              <img className="dr" src={GitHub} alt="" />Daniel008-01
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

  export default Footer;