import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./changeNames.scss";

export default function ChangeNames() {
  const [name1, setName1] = useState("Красный");
  const [name2, setName2] = useState("Синий");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name1.trim() && name2.trim()) {
      localStorage.setItem("name1", name1);
      localStorage.setItem("name2", name2);
      navigate("/"); 
    }
  };

  return (
    <div className="name-form-container">
      <form onSubmit={handleSubmit} className="name-form">
        <h2>Настройте имена игроков</h2>
        <label className="animated-label">
          <input
            type="text"
            value={name1}
            onChange={(e) => setName1(e.target.value)}
            required
          />
          <span>Игрок 1</span>
        </label>
        <label className="animated-label">
          <input
            type="text"
            value={name2}
            onChange={(e) => setName2(e.target.value)}
            required
          />
          <span>Игрок 2</span>
        </label>
        <button type="submit" className="submit-btn">Сохранить</button>
      </form>
    </div>
  );
}
