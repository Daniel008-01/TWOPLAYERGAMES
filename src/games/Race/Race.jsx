// Race.jsx
import React, { useState } from 'react';
import MapSelect from './maps/MapSelect.jsx';
import TinyRaces from './TinyRaces.jsx';

export default function Race({ onBack, name1, name2 }) {
  const [trackConfig, setTrackConfig] = useState(null);

  if (!trackConfig) {
    return <MapSelect onChoose={(cfg) => { console.log('Race chose', cfg?.id); setTrackConfig(cfg); }} />;
  }

  return (
    <div>
      <button onClick={() => setTrackConfig(null)} style={{ margin: 8 }}>← Выбрать другую карту</button>
      <TinyRaces onBack={onBack} name1={name1} name2={name2} trackConfig={trackConfig} />
    </div>
  );
}
