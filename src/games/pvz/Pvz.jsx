import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './pvz.scss';

export default function PlantsVsZombies() {
    const canvasRef = useRef(null);
    const [gameActive, setGameActive] = useState(true);
    const [sun, setSun] = useState(200);
    const [selectedPlantType, setSelectedPlantType] = useState(null);
    const [gameOver, setGameOver] = useState(false);
    const [cheatMode, setCheatMode] = useState(false);
    const [showCheatNotification, setShowCheatNotification] = useState(false);
    
    // Game constants
    const TILE_W = 80;
    const TILE_H = 100;
    const HOUSE_W = 160; 
    const STREET_W = 100; 
    const GRID_COLS = 9;
    const GRID_ROWS = 5;
    const MARGIN_TOP = 80;
    
    const canvasWidth = HOUSE_W + (GRID_COLS * TILE_W) + STREET_W;
    const canvasHeight = MARGIN_TOP + (GRID_ROWS * TILE_H) + 20;
    
    // Game state refs
    const gridRef = useRef([]);
    const projectilesRef = useRef([]);
    const zombiesRef = useRef([]);
    const particlesRef = useRef([]);
    const sunsRef = useRef([]);
    const mowersRef = useRef([]);
    const frameCountRef = useRef(0);
    const levelTimerRef = useRef(0);
    const zombieSpawnTimerRef = useRef(0);
    const nextZombieTimeRef = useRef(600);
    const nextHugeWaveRef = useRef(3600);
    const isHugeWaveRef = useRef(false);
    const sunSpawnTimerRef = useRef(0);
    const nextSunSpawnRef = useRef(300);
    const shakeTimeRef = useRef(0);
    
    const mouseRef = useRef({ x: 0, y: 0 });
    
    const PLANT_TYPES = {
        peashooter: { cost: 100, hp: 100 },
        sunflower:  { cost: 50,  hp: 80 },
        wallnut:    { cost: 50,  hp: 400 },
        cherry:     { cost: 150, hp: 999 }
    };
    
    // Helper functions - moved before classes to fix ReferenceError
    function drawShadow(ctx, x, y, w) {
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath(); ctx.ellipse(x, y, w, w/4, 0, 0, Math.PI*2); ctx.fill();
    }
    
    function drawDetailedHouse(ctx) {
        const houseH = GRID_ROWS * TILE_H + 40;
        const houseY = MARGIN_TOP - 20;
        
        ctx.fillStyle = '#795548';
        ctx.fillRect(0, houseY, HOUSE_W, houseH);
        
        ctx.fillStyle = '#5D4037';
        for(let y = houseY; y < houseY + houseH; y += 20) {
            ctx.fillRect(0, y, HOUSE_W, 2);
        }
        
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, houseY);
        ctx.lineTo(HOUSE_W, houseY);
        ctx.lineTo(HOUSE_W - 20, houseY - 60);
        ctx.lineTo(0, houseY - 60);
        ctx.closePath();
        ctx.clip();
        
        ctx.fillStyle = '#3E2723';
        ctx.fillRect(0, houseY-60, HOUSE_W, 60);
        
        ctx.fillStyle = '#4E342E';
        for(let ry = houseY - 60; ry < houseY; ry += 10) {
            const offset = (ry % 20 === 0) ? 0 : 10;
            for(let rx = -10; rx < HOUSE_W; rx += 20) {
                ctx.beginPath();
                ctx.arc(rx + offset, ry + 10, 10, Math.PI, 0);
                ctx.fill();
            }
        }
        ctx.restore();
        
        const doorX = 30;
        const doorY = MARGIN_TOP + 120;
        const doorW = 70;
        const doorH = 140;
        
        ctx.fillStyle = '#33691E';
        ctx.beginPath();
        ctx.ellipse(doorX + doorW/2, doorY + doorH + 5, 45, 15, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.strokeStyle = '#1B5E20'; ctx.lineWidth = 2; ctx.stroke();
        
        ctx.fillStyle = '#3E2723';
        ctx.fillRect(doorX - 5, doorY - 5, doorW + 10, doorH + 5);
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(doorX, doorY, doorW, doorH);
        ctx.fillStyle = '#4E342E';
        ctx.fillRect(doorX+10, doorY+10, 50, 50);
        ctx.fillRect(doorX+10, doorY+70, 50, 60);
        ctx.fillStyle = '#FFCA28';
        ctx.beginPath(); ctx.arc(doorX + 60, doorY + 70, 5, 0, Math.PI*2); ctx.fill();
        
        const winX = 30;
        const winY = MARGIN_TOP + 20;
        const winW = 70;
        const winH = 60;
        
        ctx.fillStyle = '#fff';
        ctx.fillRect(winX-4, winY-4, winW+8, winH+8);
        
        const grad = ctx.createLinearGradient(winX, winY, winX, winY+winH);
        grad.addColorStop(0, '#81D4FA');
        grad.addColorStop(1, '#29B6F6');
        ctx.fillStyle = grad;
        ctx.fillRect(winX, winY, winW, winH);
        
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(winX + 10, winY + 50); ctx.lineTo(winX + 40, winY + 10); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(winX + 25, winY + 50); ctx.lineTo(winX + 45, winY + 25); ctx.stroke();
        
        ctx.fillStyle = '#fff';
        ctx.fillRect(winX + winW/2 - 2, winY, 4, winH);
        ctx.fillRect(winX, winY + winH/2 - 2, winW, 4);
        
        ctx.fillStyle = '#9E9E9E';
        ctx.fillRect(HOUSE_W - 15, MARGIN_TOP - 60, 10, houseH + 60);
        ctx.fillStyle = '#616161';
        ctx.fillRect(HOUSE_W - 15, MARGIN_TOP - 60, 3, houseH + 60);
        ctx.beginPath();
        ctx.moveTo(HOUSE_W - 15, houseY + houseH);
        ctx.quadraticCurveTo(HOUSE_W - 15, houseY + houseH + 15, HOUSE_W + 5, houseY + houseH + 15);
        ctx.lineTo(HOUSE_W + 5, houseY + houseH + 5);
        ctx.quadraticCurveTo(HOUSE_W - 5, houseY + houseH + 5, HOUSE_W - 5, houseY + houseH);
        ctx.fill();
    }
    
    function drawPeashooter(ctx, x, y, frame) {
        const breathe = Math.sin(frame * 0.1) * 2;
        drawShadow(ctx, x, y + 25, 18);
        ctx.fillStyle = '#33691E'; 
        ctx.beginPath(); ctx.ellipse(x-12, y+20, 12, 6, -0.5, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x+12, y+20, 12, 6, 0.5, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = '#558B2F'; ctx.lineWidth = 6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x, y+20); ctx.quadraticCurveTo(x-5, y, x, y-15+breathe); ctx.stroke();
        ctx.fillStyle = '#76FF03'; ctx.strokeStyle = '#33691E'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(x-12, y-20+breathe, 15, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x-5, y-25+breathe); ctx.lineTo(x+20, y-25+breathe); ctx.lineTo(x+20, y-10+breathe); ctx.lineTo(x-5, y-10+breathe); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#1B5E20'; ctx.beginPath(); ctx.ellipse(x+20, y-17+breathe, 4, 7, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = 'black'; ctx.beginPath(); ctx.arc(x-6, y-24+breathe, 3, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(x-7, y-25+breathe, 1, 0, Math.PI*2); ctx.fill();
    }
    
    function drawSunflower(ctx, x, y, frame) {
        const sway = Math.sin(frame * 0.05) * 3;
        drawShadow(ctx, x, y + 25, 18);
        ctx.fillStyle = '#33691E';
        ctx.beginPath(); ctx.ellipse(x-10, y+20, 12, 6, -0.4, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x+10, y+20, 12, 6, 0.4, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = '#558B2F'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, y+20); ctx.lineTo(x+sway, y-10); ctx.stroke();
        ctx.translate(x+sway, y-15);
        ctx.fillStyle = '#FFD600'; ctx.strokeStyle = '#F57F17'; ctx.lineWidth = 1;
        const petals = 12;
        for(let i=0; i<petals; i++) { ctx.rotate((Math.PI*2)/petals); ctx.beginPath(); ctx.ellipse(18, 0, 10, 5, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke(); }
        ctx.rotate(-(Math.PI*2));
        ctx.fillStyle = '#795548'; ctx.strokeStyle = '#3E2723'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'black'; ctx.beginPath(); ctx.arc(-5, -3, 2, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(5, -3, 2, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(0, 2, 8, 0.2, Math.PI-0.2); ctx.stroke();
        ctx.translate(-(x+sway), -(y-15));
    }
    
    function drawWallnut(ctx, x, y, hp, maxHp) {
        drawShadow(ctx, x+0, y+25, 20);
        ctx.fillStyle = '#A1887F'; ctx.strokeStyle = '#5D4037'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(x, y, 22, 28, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x-10, y-15); ctx.quadraticCurveTo(x, y-20, x+10, y-15); ctx.stroke();
        const eyeH = (hp < maxHp/2) ? 2 : 5;
        ctx.fillStyle = 'white'; ctx.strokeStyle = 'black';
        ctx.beginPath(); ctx.ellipse(x-7, y-5, 5, eyeH, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(x+7, y-5, 5, eyeH, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'black'; ctx.beginPath(); ctx.arc(x-6, y-5, 1.5, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(x+8, y-5, 1.5, 0, Math.PI*2); ctx.fill();
        if (hp < maxHp * 0.7) { ctx.strokeStyle = '#3E2723'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x-15, y-10); ctx.lineTo(x-5, y); ctx.lineTo(x-15, y+10); ctx.stroke(); }
        if (hp < maxHp * 0.3) { ctx.beginPath(); ctx.moveTo(x+15, y-10); ctx.lineTo(x+5, y); ctx.lineTo(x+15, y+10); ctx.stroke(); }
    }
    
    function drawCherryBomb(ctx, x, y, frame, timer) {
        const scale = 1 + Math.sin(frame * 0.5) * 0.1;
        const red = (timer % 4 < 2) ? '#FF1744' : '#D50000';
        drawShadow(ctx, x, y+25, 20);
        ctx.translate(x, y); ctx.scale(scale, scale);
        ctx.strokeStyle = '#33691E'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-10, -5); ctx.quadraticCurveTo(0, -25, 10, -5); ctx.stroke();
        ctx.fillStyle = red; ctx.strokeStyle = 'black'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(-12, 5, 15, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(12, 8, 15, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.arc(-16, 0, 4, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(8, 3, 4, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = 'white'; ctx.beginPath(); ctx.moveTo(-18, 2); ctx.lineTo(-6, 6); ctx.stroke(); ctx.beginPath(); ctx.moveTo(6, 6); ctx.lineTo(18, 2); ctx.stroke();
        ctx.scale(1/scale, 1/scale); ctx.translate(-x, -y);
    }
    
    function drawZombie(ctx, z) {
        const x = z.x; const y = z.y;
        const wobble = Math.sin(z.walkOffset * 0.1) * 3;
        const legL = Math.sin(z.walkOffset * 0.15) * 10;
        
        drawShadow(ctx, x + 40, y + 90, 25);
        ctx.save(); ctx.translate(x + 40, y + 60); ctx.rotate(wobble * Math.PI/180); ctx.translate(-(x+40), -(y+60));
        ctx.fillStyle = '#37474F'; ctx.strokeStyle = 'black'; ctx.lineWidth = 2;
        ctx.fillRect(x+35 + legL, y+60, 12, 30);
        ctx.fillStyle = '#3E2723'; ctx.fillRect(x+32 + legL, y+90, 18, 8);
        ctx.fillStyle = '#455A64'; ctx.fillRect(x+25 - legL, y+60, 12, 30);
        ctx.fillStyle = '#3E2723'; ctx.fillRect(x+22 - legL, y+90, 18, 8);
        ctx.fillStyle = '#546E7A'; ctx.beginPath(); ctx.moveTo(x+20, y+30); ctx.lineTo(x+60, y+30); ctx.lineTo(x+55, y+70); ctx.lineTo(x+25, y+70); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#D32F2F'; ctx.beginPath(); ctx.moveTo(x+40, y+32); ctx.lineTo(x+45, y+50); ctx.lineTo(x+35, y+50); ctx.fill();
        ctx.fillStyle = '#546E7A'; ctx.beginPath(); ctx.moveTo(x+45, y+35); ctx.lineTo(x+10, y+45); ctx.lineWidth = 8; ctx.stroke(); ctx.lineWidth = 2;
        const hx = x + 40; const hy = y + 10;
        ctx.fillStyle = '#9CCC65'; ctx.beginPath(); ctx.moveTo(hx-10, hy+15); ctx.quadraticCurveTo(hx+15, hy+15, hx+18, hy-10); ctx.bezierCurveTo(hx+15, hy-30, hx-20, hy-30, hx-18, hy-10); ctx.quadraticCurveTo(hx-20, hy+10, hx-10, hy+15); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(hx-8, hy-8, 7, 0, Math.PI*2); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(hx+6, hy-8, 9, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'black'; ctx.beginPath(); ctx.arc(hx-8, hy-8, 1.5, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(hx+7, hy-7, 1.5, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#3E2723'; ctx.beginPath(); ctx.ellipse(hx, hy+8, 6, 3, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#FFF9C4'; ctx.fillRect(hx-2, hy+6, 3, 3);
        ctx.strokeStyle = '#212121'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(hx, hy-25); ctx.lineTo(hx-5, hy-32); ctx.stroke(); ctx.beginPath(); ctx.moveTo(hx+2, hy-24); ctx.lineTo(hx+8, hy-30); ctx.stroke();
        ctx.restore();
        
        if (z.hitFlash > 0) {
            ctx.save(); ctx.globalCompositeOperation = 'source-atop'; ctx.fillStyle = 'rgba(255, 0, 0, 0.4)'; ctx.fillRect(x, y, 80, 100); ctx.restore();
        }
    }
    
    function spawnSplatter(x, y, color, particles) {
        for(let i=0; i<6; i++) particles.push(new Particle(x, y, color, 'splat'));
    }
    
    function createExplosion(x, y, particles) {
        for(let i=0; i<30; i++) particles.push(new Particle(x, y, '#212121', 'smoke')); 
        for(let i=0; i<15; i++) particles.push(new Particle(x, y, '#D50000', 'fire')); 
    }
    
    function drawBackground(ctx) {
        drawDetailedHouse(ctx);
        
        for (let r = 0; r < GRID_ROWS; r++) {
            for (let c = 0; c < GRID_COLS; c++) {
                const x = HOUSE_W + c * TILE_W;
                const y = MARGIN_TOP + r * TILE_H;
                ctx.fillStyle = ((r + c) % 2 === 0) ? '#4CAF50' : '#43A047'; 
                ctx.fillRect(x, y, TILE_W, TILE_H);
            }
        }
        
        const streetX = HOUSE_W + GRID_COLS * TILE_W;
        ctx.fillStyle = '#212121'; ctx.fillRect(streetX, MARGIN_TOP, STREET_W, GRID_ROWS * TILE_H);
        ctx.fillStyle = '#9E9E9E'; ctx.fillRect(streetX, MARGIN_TOP, 15, GRID_ROWS * TILE_H);
    }
    
    function drawProgressBar(ctx, levelTimer, isHugeWave) {
        const w = 200;
        const h = 20;
        const x = canvasWidth - w - 20;
        const y = 20;
        
        ctx.fillStyle = '#3E2723';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);
        
        const pct = Math.min(1, levelTimer / 10800); 
        
        ctx.fillStyle = '#76FF03';
        ctx.fillRect(x + 2, y + 2, (w-4) * pct, h - 4);
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px monospace';
        ctx.fillText("WAVE PROGRESS", x, y - 5);
        
        if (isHugeWave) {
            ctx.fillStyle = '#D50000';
            ctx.font = 'bold 20px Creepster';
            ctx.fillText("HUGE WAVE!", x + 40, y + 45);
        }
    }
    
    function spawnZombie() {
        const r = Math.floor(Math.random() * GRID_ROWS);
        zombiesRef.current.push(new Zombie(r));
    }
    
    // Classes
    class Cell {
        constructor(x, y, row, col) {
            this.x = x;
            this.y = y;
            this.row = row;
            this.col = col;
            this.plant = null;
        }
        
        draw(ctx, mouse, selectedPlantType) {
            if (mouse.x > this.x && mouse.x < this.x + TILE_W &&
                mouse.y > this.y && mouse.y < this.y + TILE_H && selectedPlantType) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.fillRect(this.x, this.y, TILE_W, TILE_H);
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 2;
                ctx.strokeRect(this.x, this.y, TILE_W, TILE_H);
            }
        }
    }
    
    class Lawnmower {
        constructor(row) {
            this.row = row;
            this.w = 60;
            this.h = 50;
            this.x = HOUSE_W - 50;
            this.y = MARGIN_TOP + (row * TILE_H) + (TILE_H - this.h) - 10;
            this.active = false;
            this.speed = 0;
            this.used = false;
        }
        
        update(zombies) {
            if (this.used) return;
            if (this.active) {
                this.x += this.speed;
                this.speed += 1; 
                zombies.forEach(z => {
                    if (z.row === this.row && z.x < this.x + this.w && z.x > this.x - 50) {
                        z.hp = 0;
                        z.hitFlash = 10;
                        spawnSplatter(z.x, z.y + 40, '#000', particlesRef.current);
                    }
                });
                if (this.x > canvasWidth) this.used = true;
            } else {
                const threat = zombies.find(z => z.row === this.row && z.x < this.x + this.w - 20);
                if (threat) {
                    this.active = true;
                    this.speed = 5;
                }
            }
        }
        
        draw(ctx) {
            if (this.used) return;
            const cx = this.x + this.w/2;
            const cy = this.y + this.h/2;
            drawShadow(ctx, cx, this.y + this.h, 30);
            ctx.strokeStyle = '#cfd8dc'; ctx.lineWidth = 4;
            ctx.beginPath(); ctx.moveTo(this.x, this.y + 20); ctx.lineTo(this.x - 20, this.y - 10); ctx.stroke();
            ctx.fillStyle = '#f44336';
            ctx.beginPath(); ctx.moveTo(this.x, this.y + 50); ctx.lineTo(this.x + 60, this.y + 50); ctx.lineTo(this.x + 50, this.y + 20); ctx.lineTo(this.x + 10, this.y + 20); ctx.fill();
            ctx.strokeRect(this.x, this.y+20, 60, 30);
            ctx.fillStyle = '#b0bec5'; ctx.beginPath(); ctx.arc(cx, cy, 10, 0, Math.PI*2); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#212121';
            ctx.beginPath(); ctx.arc(this.x + 10, this.y + 50, 12, 0, Math.PI*2); ctx.fill(); 
            ctx.beginPath(); ctx.arc(this.x + 50, this.y + 50, 12, 0, Math.PI*2); ctx.fill();
        }
    }
    
    class Plant {
        constructor(x, y, type) {
            this.x = x;
            this.y = y;
            this.type = type;
            this.hp = PLANT_TYPES[type].hp;
            this.maxHp = this.hp;
            this.timer = 0;
            this.sway = Math.random() * 100;
            this.dead = false;
            
            if (type === 'cherry') this.timer = 50;
        }
        
        update(zombies, projectiles, suns, particles) {
            this.sway++;
            
            if (this.type === 'sunflower') {
                this.timer++;
                if (this.timer >= 600) {
                    this.timer = 0;
                    suns.push(new Sun(this.x + 10, this.y + 10, false));
                    particles.push(new Particle(this.x+40, this.y+40, '#fff', 'glow'));
                }
            }
            else if (this.type === 'peashooter') {
                this.timer++;
                const hasTarget = zombies.some(z => 
                    z.y > this.y - 10 && z.y < this.y + TILE_H && z.x > this.x
                );
                if (this.timer >= 90 && hasTarget) {
                    this.timer = 0;
                    projectiles.push(new Projectile(this.x + 50, this.y + 20));
                }
            }
            else if (this.type === 'cherry') {
                this.timer--;
                if (this.timer <= 0) {
                    this.explode(zombies, particles);
                }
            }
        }
        
        explode(zombies, particles) {
            shakeTimeRef.current = 20;
            createExplosion(this.x + TILE_W/2, this.y + TILE_H/2, particles);
            
            const cx = this.x + TILE_W/2;
            const cy = this.y + TILE_H/2;
            
            zombies.forEach(z => {
                const zx = z.x + 40;
                const zy = z.y + 50;
                const dist = Math.hypot(cx - zx, cy - zy);
                if (dist < 150) {
                    z.hp -= 2000;
                    z.hitFlash = 15;
                }
            });
            
            this.dead = true;
        }
        
        draw(ctx) {
            const cx = this.x + TILE_W/2;
            const cy = this.y + TILE_H/2 + 10;
            if (this.type === 'peashooter') drawPeashooter(ctx, cx, cy, this.sway);
            else if (this.type === 'sunflower') drawSunflower(ctx, cx, cy, this.sway);
            else if (this.type === 'wallnut') drawWallnut(ctx, cx, cy, this.hp, this.maxHp);
            else if (this.type === 'cherry') drawCherryBomb(ctx, cx, cy, this.sway, this.timer);
        }
    }
    
    class Zombie {
        constructor(row) {
            this.row = row;
            this.y = MARGIN_TOP + (row * TILE_H);
            this.x = canvasWidth + 20;
            this.hp = 120;
            this.maxHp = 120;
            this.speed = 0.2 + Math.random() * 0.25;
            this.eating = false;
            this.delete = false;
            this.hitFlash = 0;
            this.walkOffset = Math.random() * 100;
        }
        
        update(grid) {
            this.walkOffset++;
            this.eating = false;
            if (this.hitFlash > 0) this.hitFlash--;
            
            const hitBoxX = this.x + 30;
            const hitBoxW = 20;
            
            for (let cell of grid) {
                if (cell.plant && cell.row === this.row) {
                    if (hitBoxX < cell.x + TILE_W - 20 && hitBoxX + hitBoxW > cell.x + 20) {
                        this.eating = true;
                        cell.plant.hp -= 0.5;
                        if (cell.plant.hp <= 0) {
                            cell.plant = null;
                            this.eating = false;
                        }
                    }
                }
            }
            
            if (!this.eating) this.x -= this.speed;
            
            if (this.x < HOUSE_W - 70) {
                return true; // Game over
            }
            if (this.hp <= 0) this.delete = true;
            return false;
        }
        
        draw(ctx) { drawZombie(ctx, this); }
    }
    
    class Projectile {
        constructor(x, y) {
            this.x = x; this.y = y; this.speed = 7; this.delete = false;
        }
        
        update() {
            this.x += this.speed;
            if (this.x > canvasWidth) this.delete = true;
        }
        
        draw(ctx) {
            ctx.fillStyle = '#76FF03'; ctx.strokeStyle = '#33691E'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(this.x, this.y, 10, 0, Math.PI*2); ctx.fill(); ctx.stroke();
            ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(this.x - 3, this.y - 3, 3, 0, Math.PI*2); ctx.fill();
        }
    }
    
    class Sun {
        constructor(x, y, fromSky) {
            this.x = x;
            this.y = y;
            this.fromSky = fromSky;
            this.destY = fromSky 
                ? MARGIN_TOP + Math.random() * (GRID_ROWS * TILE_H - 50) 
                : y + (Math.random() * 40) + 20;
            this.timer = 0;
            this.delete = false;
            this.rot = 0;
        }
        
        update(mouse) {
            this.rot += 0.02;
            
            if (this.y < this.destY) {
                this.y += 1.5;
            }
            
            if (!this.fromSky || Math.abs(this.y - this.destY) < 5) {
                this.timer++;
            }
            
            if (this.timer > 800) this.delete = true;
            
            const dx = mouse.x - this.x;
            const dy = mouse.y - this.y;
            if (Math.hypot(dx, dy) < 40) {
                return 25; // Return sun amount
            }
            return 0;
        }
        
        draw(ctx) {
            ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.rot);
            ctx.shadowBlur = 20; ctx.shadowColor = '#FFD700';
            const r = 22;
            ctx.fillStyle = '#fff176'; ctx.strokeStyle = '#f57f17'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI*2); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#fbc02d';
            for(let i=0; i<8; i++) {
                ctx.rotate(Math.PI/4); ctx.beginPath(); ctx.moveTo(r, -5); ctx.lineTo(r+12, 0); ctx.lineTo(r, 5); ctx.fill();
            }
            ctx.restore();
        }
    }
    
    class Particle {
        constructor(x, y, color, type) {
            this.x = x; this.y = y; this.color = color; this.type = type;
            this.life = 1.0;
            this.vx = (Math.random()-0.5)*6;
            this.vy = (Math.random()-0.5)*6;
            this.size = Math.random()*5 + 2;
        }
        
        update() {
            this.x += this.vx; this.y += this.vy; this.life -= 0.03;
        }
        
        draw(ctx) {
            ctx.globalAlpha = Math.max(0, this.life);
            ctx.fillStyle = this.color;
            ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI*2); ctx.fill();
            ctx.globalAlpha = 1.0;
        }
    }
    
    // Art functions
    function drawShadow(ctx, x, y, w) {
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath(); ctx.ellipse(x, y, w, w/4, 0, 0, Math.PI*2); ctx.fill();
    }
    
    function drawDetailedHouse(ctx) {
        const houseH = GRID_ROWS * TILE_H + 40;
        const houseY = MARGIN_TOP - 20;
        
        ctx.fillStyle = '#795548';
        ctx.fillRect(0, houseY, HOUSE_W, houseH);
        
        ctx.fillStyle = '#5D4037';
        for(let y = houseY; y < houseY + houseH; y += 20) {
            ctx.fillRect(0, y, HOUSE_W, 2);
        }
        
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, houseY);
        ctx.lineTo(HOUSE_W, houseY);
        ctx.lineTo(HOUSE_W - 20, houseY - 60);
        ctx.lineTo(0, houseY - 60);
        ctx.closePath();
        ctx.clip();
        
        ctx.fillStyle = '#3E2723';
        ctx.fillRect(0, houseY-60, HOUSE_W, 60);
        
        ctx.fillStyle = '#4E342E';
        for(let ry = houseY - 60; ry < houseY; ry += 10) {
            const offset = (ry % 20 === 0) ? 0 : 10;
            for(let rx = -10; rx < HOUSE_W; rx += 20) {
                ctx.beginPath();
                ctx.arc(rx + offset, ry + 10, 10, Math.PI, 0);
                ctx.fill();
            }
        }
        ctx.restore();
        
        const doorX = 30;
        const doorY = MARGIN_TOP + 120;
        const doorW = 70;
        const doorH = 140;
        
        ctx.fillStyle = '#33691E';
        ctx.beginPath();
        ctx.ellipse(doorX + doorW/2, doorY + doorH + 5, 45, 15, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.strokeStyle = '#1B5E20'; ctx.lineWidth = 2; ctx.stroke();
        
        ctx.fillStyle = '#3E2723';
        ctx.fillRect(doorX - 5, doorY - 5, doorW + 10, doorH + 5);
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(doorX, doorY, doorW, doorH);
        ctx.fillStyle = '#4E342E';
        ctx.fillRect(doorX+10, doorY+10, 50, 50);
        ctx.fillRect(doorX+10, doorY+70, 50, 60);
        ctx.fillStyle = '#FFCA28';
        ctx.beginPath(); ctx.arc(doorX + 60, doorY + 70, 5, 0, Math.PI*2); ctx.fill();
        
        const winX = 30;
        const winY = MARGIN_TOP + 20;
        const winW = 70;
        const winH = 60;
        
        ctx.fillStyle = '#fff';
        ctx.fillRect(winX-4, winY-4, winW+8, winH+8);
        
        const grad = ctx.createLinearGradient(winX, winY, winX, winY+winH);
        grad.addColorStop(0, '#81D4FA');
        grad.addColorStop(1, '#29B6F6');
        ctx.fillStyle = grad;
        ctx.fillRect(winX, winY, winW, winH);
        
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(winX + 10, winY + 50); ctx.lineTo(winX + 40, winY + 10); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(winX + 25, winY + 50); ctx.lineTo(winX + 45, winY + 25); ctx.stroke();
        
        ctx.fillStyle = '#fff';
        ctx.fillRect(winX + winW/2 - 2, winY, 4, winH);
        ctx.fillRect(winX, winY + winH/2 - 2, winW, 4);
        
        ctx.fillStyle = '#9E9E9E';
        ctx.fillRect(HOUSE_W - 15, MARGIN_TOP - 60, 10, houseH + 60);
        ctx.fillStyle = '#616161';
        ctx.fillRect(HOUSE_W - 15, MARGIN_TOP - 60, 3, houseH + 60);
        ctx.beginPath();
        ctx.moveTo(HOUSE_W - 15, houseY + houseH);
        ctx.quadraticCurveTo(HOUSE_W - 15, houseY + houseH + 15, HOUSE_W + 5, houseY + houseH + 15);
        ctx.lineTo(HOUSE_W + 5, houseY + houseH + 5);
        ctx.quadraticCurveTo(HOUSE_W - 5, houseY + houseH + 5, HOUSE_W - 5, houseY + houseH);
        ctx.fill();
    }
    
    function drawPeashooter(ctx, x, y, frame) {
        const breathe = Math.sin(frame * 0.1) * 2;
        drawShadow(ctx, x, y + 25, 18);
        ctx.fillStyle = '#33691E'; 
        ctx.beginPath(); ctx.ellipse(x-12, y+20, 12, 6, -0.5, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x+12, y+20, 12, 6, 0.5, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = '#558B2F'; ctx.lineWidth = 6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x, y+20); ctx.quadraticCurveTo(x-5, y, x, y-15+breathe); ctx.stroke();
        ctx.fillStyle = '#76FF03'; ctx.strokeStyle = '#33691E'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(x-12, y-20+breathe, 15, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x-5, y-25+breathe); ctx.lineTo(x+20, y-25+breathe); ctx.lineTo(x+20, y-10+breathe); ctx.lineTo(x-5, y-10+breathe); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#1B5E20'; ctx.beginPath(); ctx.ellipse(x+20, y-17+breathe, 4, 7, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = 'black'; ctx.beginPath(); ctx.arc(x-6, y-24+breathe, 3, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(x-7, y-25+breathe, 1, 0, Math.PI*2); ctx.fill();
    }
    
    function drawSunflower(ctx, x, y, frame) {
        const sway = Math.sin(frame * 0.05) * 3;
        drawShadow(ctx, x, y + 25, 18);
        ctx.fillStyle = '#33691E';
        ctx.beginPath(); ctx.ellipse(x-10, y+20, 12, 6, -0.4, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x+10, y+20, 12, 6, 0.4, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = '#558B2F'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, y+20); ctx.lineTo(x+sway, y-10); ctx.stroke();
        ctx.translate(x+sway, y-15);
        ctx.fillStyle = '#FFD600'; ctx.strokeStyle = '#F57F17'; ctx.lineWidth = 1;
        const petals = 12;
        for(let i=0; i<petals; i++) { ctx.rotate((Math.PI*2)/petals); ctx.beginPath(); ctx.ellipse(18, 0, 10, 5, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke(); }
        ctx.rotate(-(Math.PI*2));
        ctx.fillStyle = '#795548'; ctx.strokeStyle = '#3E2723'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'black'; ctx.beginPath(); ctx.arc(-5, -3, 2, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(5, -3, 2, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(0, 2, 8, 0.2, Math.PI-0.2); ctx.stroke();
        ctx.translate(-(x+sway), -(y-15));
    }
    
    function drawWallnut(ctx, x, y, hp, maxHp) {
        drawShadow(ctx, x+0, y+25, 20);
        ctx.fillStyle = '#A1887F'; ctx.strokeStyle = '#5D4037'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(x, y, 22, 28, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x-10, y-15); ctx.quadraticCurveTo(x, y-20, x+10, y-15); ctx.stroke();
        const eyeH = (hp < maxHp/2) ? 2 : 5;
        ctx.fillStyle = 'white'; ctx.strokeStyle = 'black';
        ctx.beginPath(); ctx.ellipse(x-7, y-5, 5, eyeH, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(x+7, y-5, 5, eyeH, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'black'; ctx.beginPath(); ctx.arc(x-6, y-5, 1.5, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(x+8, y-5, 1.5, 0, Math.PI*2); ctx.fill();
        if (hp < maxHp * 0.7) { ctx.strokeStyle = '#3E2723'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x-15, y-10); ctx.lineTo(x-5, y); ctx.lineTo(x-15, y+10); ctx.stroke(); }
        if (hp < maxHp * 0.3) { ctx.beginPath(); ctx.moveTo(x+15, y-10); ctx.lineTo(x+5, y); ctx.lineTo(x+15, y+10); ctx.stroke(); }
    }
    
    function drawCherryBomb(ctx, x, y, frame, timer) {
        const scale = 1 + Math.sin(frame * 0.5) * 0.1;
        const red = (timer % 4 < 2) ? '#FF1744' : '#D50000';
        drawShadow(ctx, x, y+25, 20);
        ctx.translate(x, y); ctx.scale(scale, scale);
        ctx.strokeStyle = '#33691E'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-10, -5); ctx.quadraticCurveTo(0, -25, 10, -5); ctx.stroke();
        ctx.fillStyle = red; ctx.strokeStyle = 'black'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(-12, 5, 15, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(12, 8, 15, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.arc(-16, 0, 4, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(8, 3, 4, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = 'white'; ctx.beginPath(); ctx.moveTo(-18, 2); ctx.lineTo(-6, 6); ctx.stroke(); ctx.beginPath(); ctx.moveTo(6, 6); ctx.lineTo(18, 2); ctx.stroke();
        ctx.scale(1/scale, 1/scale); ctx.translate(-x, -y);
    }
    
    function drawZombie(ctx, z) {
        const x = z.x; const y = z.y;
        const wobble = Math.sin(z.walkOffset * 0.1) * 3;
        const legL = Math.sin(z.walkOffset * 0.15) * 10;
        
        drawShadow(ctx, x + 40, y + 90, 25);
        ctx.save(); ctx.translate(x + 40, y + 60); ctx.rotate(wobble * Math.PI/180); ctx.translate(-(x+40), -(y+60));
        ctx.fillStyle = '#37474F'; ctx.strokeStyle = 'black'; ctx.lineWidth = 2;
        ctx.fillRect(x+35 + legL, y+60, 12, 30);
        ctx.fillStyle = '#3E2723'; ctx.fillRect(x+32 + legL, y+90, 18, 8);
        ctx.fillStyle = '#455A64'; ctx.fillRect(x+25 - legL, y+60, 12, 30);
        ctx.fillStyle = '#3E2723'; ctx.fillRect(x+22 - legL, y+90, 18, 8);
        ctx.fillStyle = '#546E7A'; ctx.beginPath(); ctx.moveTo(x+20, y+30); ctx.lineTo(x+60, y+30); ctx.lineTo(x+55, y+70); ctx.lineTo(x+25, y+70); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#D32F2F'; ctx.beginPath(); ctx.moveTo(x+40, y+32); ctx.lineTo(x+45, y+50); ctx.lineTo(x+35, y+50); ctx.fill();
        ctx.fillStyle = '#546E7A'; ctx.beginPath(); ctx.moveTo(x+45, y+35); ctx.lineTo(x+10, y+45); ctx.lineWidth = 8; ctx.stroke(); ctx.lineWidth = 2;
        const hx = x + 40; const hy = y + 10;
        ctx.fillStyle = '#9CCC65'; ctx.beginPath(); ctx.moveTo(hx-10, hy+15); ctx.quadraticCurveTo(hx+15, hy+15, hx+18, hy-10); ctx.bezierCurveTo(hx+15, hy-30, hx-20, hy-30, hx-18, hy-10); ctx.quadraticCurveTo(hx-20, hy+10, hx-10, hy+15); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(hx-8, hy-8, 7, 0, Math.PI*2); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(hx+6, hy-8, 9, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'black'; ctx.beginPath(); ctx.arc(hx-8, hy-8, 1.5, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(hx+7, hy-7, 1.5, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#3E2723'; ctx.beginPath(); ctx.ellipse(hx, hy+8, 6, 3, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#FFF9C4'; ctx.fillRect(hx-2, hy+6, 3, 3);
        ctx.strokeStyle = '#212121'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(hx, hy-25); ctx.lineTo(hx-5, hy-32); ctx.stroke(); ctx.beginPath(); ctx.moveTo(hx+2, hy-24); ctx.lineTo(hx+8, hy-30); ctx.stroke();
        ctx.restore();
        
        if (z.hitFlash > 0) {
            ctx.save(); ctx.globalCompositeOperation = 'source-atop'; ctx.fillStyle = 'rgba(255, 0, 0, 0.4)'; ctx.fillRect(x, y, 80, 100); ctx.restore();
        }
    }
    
    function spawnSplatter(x, y, color, particles) {
        for(let i=0; i<6; i++) particles.push(new Particle(x, y, color, 'splat'));
    }
    
    function createExplosion(x, y, particles) {
        for(let i=0; i<30; i++) particles.push(new Particle(x, y, '#212121', 'smoke')); 
        for(let i=0; i<15; i++) particles.push(new Particle(x, y, '#D50000', 'fire')); 
    }
    
    function drawBackground(ctx) {
        drawDetailedHouse(ctx);
        
        for (let r = 0; r < GRID_ROWS; r++) {
            for (let c = 0; c < GRID_COLS; c++) {
                const x = HOUSE_W + c * TILE_W;
                const y = MARGIN_TOP + r * TILE_H;
                ctx.fillStyle = ((r + c) % 2 === 0) ? '#4CAF50' : '#43A047'; 
                ctx.fillRect(x, y, TILE_W, TILE_H);
            }
        }
        
        const streetX = HOUSE_W + GRID_COLS * TILE_W;
        ctx.fillStyle = '#212121'; ctx.fillRect(streetX, MARGIN_TOP, STREET_W, GRID_ROWS * TILE_H);
        ctx.fillStyle = '#9E9E9E'; ctx.fillRect(streetX, MARGIN_TOP, 15, GRID_ROWS * TILE_H);
    }
    
    function drawProgressBar(ctx, levelTimer, isHugeWave) {
        const w = 200;
        const h = 20;
        const x = canvasWidth - w - 20;
        const y = 20;
        
        ctx.fillStyle = '#3E2723';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);
        
        const pct = Math.min(1, levelTimer / 10800); 
        
        ctx.fillStyle = '#76FF03';
        ctx.fillRect(x + 2, y + 2, (w-4) * pct, h - 4);
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px monospace';
        ctx.fillText("WAVE PROGRESS", x, y - 5);
        
        if (isHugeWave) {
            ctx.fillStyle = '#D50000';
            ctx.font = 'bold 20px Creepster';
            ctx.fillText("HUGE WAVE!", x + 40, y + 45);
        }
    }
    
    function spawnZombie() {
        const r = Math.floor(Math.random() * GRID_ROWS);
        zombiesRef.current.push(new Zombie(r));
    }
    
    function initGame() {
        gridRef.current = [];
        mowersRef.current = [];
        for(let r=0; r<GRID_ROWS; r++) {
            for(let c=0; c<GRID_COLS; c++) {
                gridRef.current.push(new Cell(HOUSE_W + c * TILE_W, MARGIN_TOP + r * TILE_H, r, c));
            }
            mowersRef.current.push(new Lawnmower(r));
        }
    }
    
    function resetGame() {
        setGameActive(true);
        setSun(200);
        setGameOver(false);
        frameCountRef.current = 0;
        levelTimerRef.current = 0;
        nextZombieTimeRef.current = 600;
        zombieSpawnTimerRef.current = 0;
        isHugeWaveRef.current = false;
        zombiesRef.current = [];
        projectilesRef.current = [];
        particlesRef.current = [];
        sunsRef.current = [];
        initGame();
    }
    
    function handleInput() {
        if (!gameActive) return;
        
        const mouse = mouseRef.current;
        if (mouse.x > HOUSE_W && mouse.x < HOUSE_W + GRID_COLS * TILE_W &&
            mouse.y > MARGIN_TOP && mouse.y < MARGIN_TOP + GRID_ROWS * TILE_H) {
            
            const col = Math.floor((mouse.x - HOUSE_W) / TILE_W);
            const row = Math.floor((mouse.y - MARGIN_TOP) / TILE_H);
            const idx = row * GRID_COLS + col;
            const cell = gridRef.current[idx];
            
            if (selectedPlantType && !cell.plant) {
                const cost = cheatMode ? 1 : PLANT_TYPES[selectedPlantType].cost;
                if (sun >= cost) {
                    setSun(prev => prev - cost);
                    cell.plant = new Plant(cell.x, cell.y, selectedPlantType);
                    setSelectedPlantType(null);
                }
            }
        }
    }
    
    // Effects
    useEffect(() => {
        initGame();
    }, []);
    
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const handleMouseMove = (e) => {
            const rect = canvas.getBoundingClientRect();
            mouseRef.current.x = e.clientX - rect.left;
            mouseRef.current.y = e.clientY - rect.top;
        };
        
        const handleMouseDown = () => {
            handleInput();
        };
        
        const handleKeyDown = (e) => {
            // Ctrl+Alt+X для активации чит-кода
            if (e.ctrlKey && e.altKey && e.key === 'x') {
                e.preventDefault();
                setCheatMode(true);
                setSun(10000);
                setShowCheatNotification(true);
                console.log('CHEAT ACTIVATED');
                
                // Скрываем уведомление через 3 секунды
                setTimeout(() => {
                    setShowCheatNotification(false);
                }, 3000);
            }
        };
        
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('keydown', handleKeyDown);
        
        return () => {
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [gameActive, selectedPlantType, sun]);
    
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        
        let animationId;
        
        const gameLoop = () => {
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);
            ctx.fillStyle = '#263238'; 
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            
            if (shakeTimeRef.current > 0) {
                ctx.save();
                const dx = (Math.random() - 0.5) * 10;
                const dy = (Math.random() - 0.5) * 10;
                ctx.translate(dx, dy);
                shakeTimeRef.current--;
            }
            
            drawBackground(ctx);
            drawProgressBar(ctx, levelTimerRef.current, isHugeWaveRef.current);
            
            if (gameActive) {
                frameCountRef.current++;
                levelTimerRef.current++;
                
                // Wave spawn logic
                zombieSpawnTimerRef.current++;
                
                if (frameCountRef.current % 600 === 0 && nextZombieTimeRef.current > 100) {
                    nextZombieTimeRef.current -= 50; 
                }
                
                if (zombieSpawnTimerRef.current > nextZombieTimeRef.current) {
                    spawnZombie();
                    zombieSpawnTimerRef.current = 0;
                }
                
                if (levelTimerRef.current % nextHugeWaveRef.current === 0 && levelTimerRef.current > 0) {
                    isHugeWaveRef.current = true;
                    setTimeout(() => isHugeWaveRef.current = false, 3000);
                    for(let i=0; i<5; i++) {
                        setTimeout(spawnZombie, i * 500);
                    }
                }
                
                // Sun spawn logic
                sunSpawnTimerRef.current++;
                if (sunSpawnTimerRef.current > nextSunSpawnRef.current) {
                    sunsRef.current.push(new Sun(HOUSE_W + Math.random() * (GRID_COLS * TILE_W), -50, true));
                    sunSpawnTimerRef.current = 0;
                    nextSunSpawnRef.current = Math.random() * 300 + 300;
                }
            }
            
            // Update and draw grid
            gridRef.current.forEach(cell => {
                cell.draw(ctx, mouseRef.current, selectedPlantType);
                if (cell.plant) {
                    if (gameActive) {
                        cell.plant.update(zombiesRef.current, projectilesRef.current, sunsRef.current, particlesRef.current);
                    }
                    cell.plant.draw(ctx);
                    if (cell.plant.dead) {
                        cell.plant = null;
                    }
                }
            });
            
            // Update and draw mowers
            mowersRef.current.forEach(m => {
                if (gameActive) m.update(zombiesRef.current);
                m.draw(ctx);
            });
            
            // Update and draw zombies
            zombiesRef.current.sort((a,b) => a.y - b.y);
            zombiesRef.current.forEach((z, i) => {
                if (gameActive) {
                    const shouldGameOver = z.update(gridRef.current);
                    if (shouldGameOver) {
                        const mower = mowersRef.current.find(m => m.row === z.row);
                        if (!mower || mower.used || mower.x > z.x) {
                            setGameActive(false);
                            setGameOver(true);
                        }
                    }
                }
                z.draw(ctx);
                if (z.delete) zombiesRef.current.splice(i, 1);
            });
            
            // Update and draw projectiles
            projectilesRef.current.forEach((p, i) => {
                if (gameActive) p.update();
                p.draw(ctx);
                
                for (let z of zombiesRef.current) {
                    if (p.x > z.x + 20 && p.x < z.x + 60 && p.y > z.y + 10 && p.y < z.y + 90) {
                        z.hp -= 20;
                        z.hitFlash = 5;
                        spawnSplatter(p.x, p.y, '#76FF03', particlesRef.current);
                        p.delete = true;
                        break;
                    }
                }
                if (p.delete) projectilesRef.current.splice(i, 1);
            });
            
            // Update and draw particles
            particlesRef.current.forEach((p, i) => {
                if (gameActive) p.update();
                p.draw(ctx);
                if (p.life <= 0) particlesRef.current.splice(i, 1);
            });
            
            // Update and draw suns
            sunsRef.current.forEach((s, i) => {
                if (gameActive) {
                    const sunAmount = s.update(mouseRef.current);
                    if (sunAmount > 0) {
                        setSun(prev => prev + sunAmount);
                        for(let i=0; i<5; i++) particlesRef.current.push(new Particle(s.x, s.y, '#FFD700', 'sparkle'));
                        s.delete = true;
                    }
                }
                s.draw(ctx);
                if (s.delete) sunsRef.current.splice(i, 1);
            });
            
            if (shakeTimeRef.current >= 0) ctx.restore();
            
            animationId = requestAnimationFrame(gameLoop);
        };
        
        gameLoop();
        
        return () => {
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
        };
    }, [gameActive, selectedPlantType]);
    
    const selectPlant = (type) => {
        const cost = cheatMode ? 1 : PLANT_TYPES[type].cost;
        if (sun >= cost) {
            setSelectedPlantType(type);
        }
    };
    
    return (
        <div className="pvz-container">
            <div className="pvz-header">
                <Link to="/" className="back-button">← Назад</Link>
                <h1>Plants vs Zombies</h1>
            </div>
            
            <div className="pvz-game">
                <div className="ui-layer">
                    <div className="sun-counter">
                        <div className="sun-icon"></div>
                        <span className="sun-text">{sun}</span>
                    </div>
                    
                    <div 
                        className={`pvz-card ${selectedPlantType === 'peashooter' ? 'selected' : ''} ${sun < (cheatMode ? 1 : PLANT_TYPES.peashooter.cost) ? 'disabled' : ''}`}
                        onClick={() => selectPlant('peashooter')}
                    >
                        <div className="plant-name">Peashooter</div>
                        <div className="card-img" id="img-peashooter"></div>
                        <div className="cost">{cheatMode ? 1 : 100}</div>
                        <div className="cooldown-overlay"></div>
                    </div>
                    
                    <div 
                        className={`pvz-card ${selectedPlantType === 'sunflower' ? 'selected' : ''} ${sun < (cheatMode ? 1 : PLANT_TYPES.sunflower.cost) ? 'disabled' : ''}`}
                        onClick={() => selectPlant('sunflower')}
                    >
                        <div className="plant-name">Sunflower</div>
                        <div className="card-img" id="img-sunflower"></div>
                        <div className="cost">{cheatMode ? 1 : 50}</div>
                        <div className="cooldown-overlay"></div>
                    </div>
                    
                    <div 
                        className={`pvz-card ${selectedPlantType === 'wallnut' ? 'selected' : ''} ${sun < (cheatMode ? 1 : PLANT_TYPES.wallnut.cost) ? 'disabled' : ''}`}
                        onClick={() => selectPlant('wallnut')}
                    >
                        <div className="plant-name">Wall-nut</div>
                        <div className="card-img" id="img-wallnut"></div>
                        <div className="cost">{cheatMode ? 1 : 50}</div>
                        <div className="cooldown-overlay"></div>
                    </div>
                    
                    <div 
                        className={`pvz-card ${selectedPlantType === 'cherry' ? 'selected' : ''} ${sun < (cheatMode ? 1 : PLANT_TYPES.cherry.cost) ? 'disabled' : ''}`}
                        onClick={() => selectPlant('cherry')}
                    >
                        <div className="plant-name">Cherry</div>
                        <div className="card-img" id="img-cherry"></div>
                        <div className="cost">{cheatMode ? 1 : 150}</div>
                        <div className="cooldown-overlay"></div>
                    </div>
                </div>
                
                {gameOver && (
                    <div className="game-over">
                        <h1>THE ZOMBIES ATE YOUR BRAINS!</h1>
                        <button onClick={resetGame}>Try Again</button>
                    </div>
                )}
                
                {showCheatNotification && (
                    <div className="cheat-notification">
                        CHEAT ACTIVATED
                    </div>
                )}
                
                <canvas 
                    ref={canvasRef}
                    width={canvasWidth}
                    height={canvasHeight}
                    className="game-canvas"
                />
            </div>
        </div>
    );
}
