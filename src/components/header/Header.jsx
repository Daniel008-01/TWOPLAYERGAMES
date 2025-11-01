import React, { useEffect, useState } from 'react'
import logo from './logo-Cite.jpg'
import './header.scss'
import { Link } from 'react-router-dom'

export default function Header({ onToggleTheme, theme }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleThemeChange = (e) => {
    onToggleTheme(e.target.checked ? "dark" : "light")
  }

  return (
    <div className={`header ${scrolled ? "scrolled" : ""}`}>
      <div className='logo'>
        <Link to="/"><img src={logo} alt="logo" style={{ cursor: 'pointer' }} /></Link>
      </div>
      <div className="header-title-div">
        <p className='header-title-text'>TWO PLAYER GAME</p>  
      </div>
      <div className='header-btns'>
        {/* Новый переключатель темы */}
        <input
          type="checkbox"
          role="switch"
          className="dark-2"
          checked={theme === "dark"}
          onChange={handleThemeChange}
        />

        <p className='btn btn-2'><Link to="/">hub</Link></p>
        <p className='btn btn-2'><Link to="/change-names">switch</Link></p>
      </div>
    </div>
  )
}
