// Editor.jsx (отдельный проект)
import React, { useRef, useState, useEffect } from 'react';

export default function Editor({
  width = 900, height = 520, tileSize = 20
}) {
  const canvasRef = useRef(null);
  const [mode, setMode] = useState('draw'); // draw | erase | spawn | finish
  const [drag, setDrag] = useState(null);
  const [spawn, setSpawn] = useState({
    p1: { x: 140, y: 260, angle: 0 },
    p2: { x: 760, y: 260, angle: Math.PI }
  });
  const [finish, setFinish] = useState(null);
  const [colliders, setColliders] = useState([]);

  const snap = v => Math.round(v / tileSize) * tileSize;

  useEffect(() => {
    const c = canvasRef.current;
    c.width = width; c.height = height;
    draw();
  }, []);

  useEffect(draw, [mode, drag, colliders, spawn, finish]);

  function draw() {
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0,0,width,height);
    // bg
    ctx.fillStyle = '#e6eef8'; ctx.fillRect(0,0,width,height);
    // grid
    ctx.strokeStyle = 'rgba(10,20,40,0.08)';
    for (let x=0; x<=width; x+=tileSize) { ctx.beginPath(); ctx.moveTo(x+0.5,0); ctx.lineTo(x+0.5,height); ctx.stroke(); }
    for (let y=0; y<=height; y+=tileSize) { ctx.beginPath(); ctx.moveTo(0,y+0.5); ctx.lineTo(width,y+0.5); ctx.stroke(); }

    // walls
    ctx.fillStyle = '#111827';
    colliders.forEach(r => ctx.fillRect(r.x, r.y, r.w, r.h));

    // finish
    if (finish) { ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.fillRect(finish.x, finish.y, finish.w, finish.h); }

    // spawns
    drawSpawn(ctx, spawn.p1, '#ef4444', 'P1');
    drawSpawn(ctx, spawn.p2, '#3b82f6', 'P2');

    // preview
    if (drag) {
      ctx.fillStyle = mode === 'erase' ? 'rgba(239,68,68,0.5)' : 'rgba(34,197,94,0.5)';
      ctx.fillRect(drag.x, drag.y, drag.w, drag.h);
    }
  }

  function drawSpawn(ctx, s, color, label) {
    ctx.save(); ctx.translate(s.x, s.y);
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0,0,tileSize*0.9,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#fff'; ctx.font=`${Math.max(10,tileSize/1.6)}px sans-serif`;
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(label,0,0);
    ctx.restore();
  }

  function pos(e) {
    const r = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function onDown(e) {
    const p = pos(e), sx = snap(p.x), sy = snap(p.y);
    if (mode === 'spawn') {
      if (e.shiftKey) setSpawn(s => ({ ...s, p2: { x: sx, y: sy, angle: 0 } }));
      else setSpawn(s => ({ ...s, p1: { x: sx, y: sy, angle: 0 } }));
      return;
    }
    if (mode === 'finish') { setDrag({ sx, sy, x: sx, y: sy, w: 0, h: 0 }); return; }
    setDrag({ sx, sy, x: sx, y: sy, w: 0, h: 0 });
  }

  function onMove(e) {
    if (!drag) return;
    const p = pos(e), cx = snap(p.x), cy = snap(p.y);
    const x = Math.min(drag.sx, cx), y = Math.min(drag.sy, cy);
    const w = Math.max(1, Math.abs(cx - drag.sx));
    const h = Math.max(1, Math.abs(cy - drag.sy));
    setDrag(d => ({ ...d, x, y, w, h }));
  }

  function onUp() {
    if (!drag) return;
    if (mode === 'draw') {
      setColliders(prev => mergeRects([...prev, mkRect(drag)]));
    } else if (mode === 'erase') {
      setColliders(prev => prev.filter(r => !intersect(r, drag)));
    } else if (mode === 'finish') {
      setFinish(mkRect(drag));
    }
    setDrag(null);
  }

  const mkRect = r => ({ id: crypto.randomUUID(), type: 'rect', x: r.x, y: r.y, w: r.w, h: r.h });
  const intersect = (a,b) => !(a.x+a.w<=b.x || a.x>=b.x+b.w || a.y+a.h<=b.y || a.y>=b.y+b.h);

  // простое слияние AABB по строкам и столбцам (как в твоём редакторе)
  function mergeRects(arr) {
    // горизонтальное
    const byRow = {};
    arr.forEach(r => {
      const k = `${r.y}|${r.h}`; (byRow[k] ||= []).push(r);
    });
    let merged = [];
    for (const k in byRow) {
      const row = byRow[k].slice().sort((a,b)=>a.x-b.x);
      let cur = row[0];
      for (let i=1;i<row.length;i++) {
        const r = row[i];
        if (r.x <= cur.x + cur.w) {
          const nx = Math.min(cur.x, r.x);
          const nw = Math.max(cur.x+cur.w, r.x+r.w) - nx;
          cur = { ...cur, x:nx, w:nw };
        } else { merged.push(cur); cur = r; }
      }
      merged.push(cur);
    }
    // вертикальное
    const byCol = {};
    merged.forEach(r => { const k = `${r.x}|${r.w}`; (byCol[k] ||= []).push(r); });
    const out = [];
    for (const k in byCol) {
      const col = byCol[k].slice().sort((a,b)=>a.y-b.y);
      let cur = col[0];
      for (let i=1;i<col.length;i++) {
        const r = col[i];
        if (r.y <= cur.y + cur.h) {
          const ny = Math.min(cur.y, r.y);
          const nh = Math.max(cur.y+cur.h, r.y+r.h) - ny;
          cur = { ...cur, y:ny, h:nh };
        } else { out.push(cur); cur = r; }
      }
      out.push(cur);
    }
    // новые id
    return out.map(r => ({ ...r, id: crypto.randomUUID() }));
  }

  function saveToConsole() {
    const data = {
      version: 1,
      name: 'Track Draft',
      size: { width, height },
      grid: { tileSize, snap: true },
      spawn,
      finish,
      colliders
    };
    // 💾 ровно то, что ты хочешь:
    console.log(JSON.stringify(data, null, 2));
    alert('JSON выведен в консоль');
  }

  return (
    <div style={{ fontFamily:'sans-serif' }}>
      <div style={{ display:'flex', gap:8, marginBottom:8 }}>
        <button onClick={()=>setMode('draw')}   style={{ background: mode==='draw'?'#10b981':'#fff' }}>Рисовать</button>
        <button onClick={()=>setMode('erase')}  style={{ background: mode==='erase'?'#f87171':'#fff' }}>Стереть</button>
        <button onClick={()=>setMode('spawn')}  style={{ background: mode==='spawn'?'#60a5fa':'#fff' }}>Спавн (Shift=P2)</button>
        <button onClick={()=>setMode('finish')} style={{ background: mode==='finish'?'#fbbf24':'#fff' }}>Финиш</button>
        <button onClick={saveToConsole}>Сохранить → console.log</button>
      </div>

      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ border:'1px solid #e5e7eb', cursor:'crosshair' }}
        onMouseDown={onDown}
        onMouseMove={onMove}
        onMouseUp={onUp}
      />
    </div>
  );
}
