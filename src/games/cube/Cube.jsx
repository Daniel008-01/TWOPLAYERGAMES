import React from 'react'
import { Link } from 'react-router-dom'
import './cube.scss'

export default function Cube() {
    return (
        <div className='container'>
            <div className="box-con"><Link to="/"><button>назад</button></Link></div>
            <div class="box">
                <div class="box-1">1</div>
                <div class="box-2">6</div>
            </div>
        </div>
    )
}
