import React from 'react'
import logo from './logo-Cite.jpg'
import './header.css'
import  { Link } from 'react-router-dom'


export default function Header({ onBack ,  }) {
  return (
    <div className="header">
        <div className='logo'> 
            <Link to="/"><img src={logo} alt="logo"  style={{cursor: 'pointer'}}/></Link>
        </div>
        <div className="header-title">
          <p className='header-title'>TWO PLAYER GAME</p>
        </div>
        <div className='header-btns'>
            <p  className='btn btn-2'><Link to="/">hub</Link></p>
            <p  className='btn btn-2' ><Link to="/change-names">switch</Link></p>
        </div>
    </div>
  )
}
