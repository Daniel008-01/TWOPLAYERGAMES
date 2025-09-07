// MapSelect.jsx
import React from 'react';
import map1 from './mapCircle.json';
import map2 from './map2.json';
import sCurve from './S_curv.json';
import map3 from './map3.json'

// собрать массив треков вручную — удобно и надёжно
const MAPS = [
  { id: 'map1', meta: map1 },
  { id: 'map2', meta: map2 },
  { id: 's_curve', meta: sCurve },
  { id: 'map3', meta: map3 },

];

export default function MapSelect({ onChoose, onBack }) {
  return (
    <div style={{ padding: 12 }}>
      <h3>Выберите карту</h3>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {MAPS.map(m => (
          <div key={m.id} style={{ border: '1px solid #ddd', padding: 10, borderRadius: 8, width: 220 }}>
            <div style={{ fontWeight: '600' }}>{m.meta.name || m.id}</div>
            <div style={{ fontSize: 12, color: '#666', margin: '6px 0' }}>
              {m.meta.arena ? `${m.meta.arena.w}×${m.meta.arena.h}` : ''}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
            type="button"
            onClick={() => {
              console.log('MapSelect click', m.id);
              if (typeof onChoose === 'function') {
                onChoose(m.meta);
              } else {
                console.error('MapSelect: onChoose is not a function', onChoose);
              }
            }}
            style={{ flex: 1 }}
          >
            Выбрать
          </button>
              <button onClick={onBack} style={{ flex: 1 }} >Отмена</button>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
