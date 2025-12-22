import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './redball.scss';

export default function RedBall() {
    const canvasRef = useRef(null);
    const [gameActive, setGameActive] = useState(true);
    const [showVictory, setShowVictory] = useState(false);
    
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // --- КОНФИГУРАЦИЯ ---
        const CANVAS_WIDTH = 800;
        const CANVAS_HEIGHT = 600;
        const GRAVITY = 0.6;
        const FRICTION = 0.85;
        const ACCELERATION = 0.8;
        const JUMP_FORCE = -14;
        const BALL_RADIUS = 25;
        
        // --- СИСТЕМА УПРАВЛЕНИЯ ---
        let keys = { space: false, a: false, d: false, s: false };
        let currentLevelIdx = 0;
        let cameraX = 0;
        let player;
        let entities = [];
        let particles = [];
        let globalHP = 3; // Глобальные жизни, не сбрасываются между уровнями
        
        // --- ОБРАБОТЧИКИ СОБЫТИЙ ---
        const handleKeyDown = (e) => {
            let code = e.code;
            if(code === "Space") {
                e.preventDefault(); // Предотвращаем скроллинг страницы
                keys.space = true;
            }
            if(code === "KeyA") keys.a = true;
            if(code === "KeyD") keys.d = true;
            if(code === "KeyS") keys.s = true;
        };
        
        const handleKeyUp = (e) => {
            let code = e.code;
            if(code === "Space") {
                e.preventDefault(); // Предотвращаем скроллинг страницы
                keys.space = false;
            }
            if(code === "KeyA") keys.a = false;
            if(code === "KeyD") keys.d = false;
            if(code === "KeyS") keys.s = false;
        };
        
        // --- КЛАССЫ СУЩНОСТЕЙ ---
        class Vector {
            constructor(x, y) { this.x = x; this.y = y; }
        }
        
        class Entity {
            constructor(x, y, w, h, type) {
                this.pos = new Vector(x, y);
                this.vel = new Vector(0, 0);
                this.w = w;
                this.h = h;
                this.type = type;
                this.active = true;
                this.seed = Math.random();
            }
        }
        
        class Player extends Entity {
            constructor(x, y) {
                super(x, y, BALL_RADIUS * 2, BALL_RADIUS * 2, 'player');
                this.radius = BALL_RADIUS;
                this.rotation = 0;
                this.hp = globalHP; // Используем глобальные жизни
                this.invulnerable = 0;
                this.grounded = false;
                this.coyoteTime = 0;
            }
            
            update() {
                // Горизонтальное движение
                if (keys.d) this.vel.x += ACCELERATION;
                if (keys.a) this.vel.x -= ACCELERATION;
                this.vel.x *= FRICTION;
                this.pos.x += this.vel.x;
                this.rotation += this.vel.x / this.radius;
                
                // Вертикальное движение и гравитация
                this.vel.y += GRAVITY;
                this.pos.y += this.vel.y;
                
                // Простая проверка земли - проверяем позицию относительно платформ
                this.checkGrounded();
                
                // ПРОСТОЙ ПРЫЖОК: если на земле и нажат пробел
                if (keys.space && this.grounded) {
                    this.vel.y = JUMP_FORCE;
                    this.grounded = false;
                }
                
                // Обновляем неуязвимость
                if (this.invulnerable > 0) this.invulnerable--;
                
                // Проверка падения - отнимаем жизнь
                if (this.pos.y > CANVAS_HEIGHT + 300) {
                    this.takeDamage();
                    resetLevel();
                }
            }
            
            takeDamage() {
                if (this.invulnerable === 0) {
                    this.hp--;
                    globalHP = this.hp; // Обновляем глобальные жизни
                    this.invulnerable = 60;
                    
                    if (this.hp <= 0) {
                        globalHP = 3; // Сбрасываем глобальные жизни при полной смерти
                        resetLevel();
                    }
                }
            }
            
            checkGrounded() {
                this.grounded = false;
                
                // Проверяем все платформы и ящики
                for (let entity of entities) {
                    if (entity.type === 'ground' || entity.type === 'crate') {
                        // Проверяем горизонтальное пересечение
                        if (this.pos.x + this.radius > entity.pos.x && 
                            this.pos.x - this.radius < entity.pos.x + entity.w) {
                            
                            // Проверяем вертикальное пересечение (касание земли)
                            let playerBottom = this.pos.y + this.radius;
                            let entityTop = entity.pos.y;
                            
                            // Если игрок находится на платформе/ящике или очень близко к ней
                            if (playerBottom >= entityTop - 2 && playerBottom <= entityTop + 10) {
                                // Корректируем позицию чтобы не проваливался
                                if (playerBottom > entityTop) {
                                    this.pos.y = entityTop - this.radius;
                                }
                                this.vel.y = 0;
                                this.grounded = true;
                                break; // Нашли землю - выходим из цикла
                            }
                        }
                    }
                }
            }
        }
        
        class Enemy extends Entity {
            constructor(x, y, range) {
                super(x, y, 50, 50, 'enemy');
                this.startPos = x;
                this.range = range;
                this.speed = 2;
                this.dir = 1;
            }
            
            update() {
                if (!this.active) return;
                this.pos.x += this.speed * this.dir;
                if (this.pos.x > this.startPos + this.range) this.dir = -1;
                if (this.pos.x < this.startPos) this.dir = 1;
            }
        }
        
        class Crate extends Entity {
            constructor(x, y, w = 60, h = 60) {
                super(x, y, w, h, 'crate');
            }
            
            update() {
                this.vel.x *= 0.85;
                this.vel.y += GRAVITY;
                this.pos.x += this.vel.x;
                this.pos.y += this.vel.y;
            }
        }
        
        // --- УРОВНИ ---
        const LEVELS = [
            {
                // Уровень 1: Обучение - простая платформа
                init: () => {
                    entities = [];
                    entities.push(new Entity(0, 500, 400, 100, 'ground'));
                    entities.push(new Entity(550, 450, 400, 150, 'ground'));
                    entities.push(new Entity(1050, 500, 800, 100, 'ground'));
                    entities.push(new Entity(-50, 0, 50, 600, 'ground'));
                    entities.push(new Entity(1700, 400, 50, 100, 'flag'));
                    player = new Player(100, 300);
                }
            },
            {
                // Уровень 2: Первый враг
                init: () => {
                    entities = [];
                    entities.push(new Entity(0, 500, 300, 100, 'ground'));
                    entities.push(new Entity(350, 500, 100, 100, 'ground'));
                    entities.push(new Entity(450, 450, 100, 150, 'ground'));
                    entities.push(new Entity(550, 400, 600, 200, 'ground'));
                    entities.push(new Enemy(600, 350, 400));
                    entities.push(new Entity(1200, 500, 400, 100, 'ground'));
                    entities.push(new Entity(1500, 400, 50, 100, 'flag'));
                    player = new Player(50, 300);
                }
            },
            {
                // Уровень 3: Прыжки через ящик
                init: () => {
                    entities = [];
                    entities.push(new Entity(0, 500, 800, 100, 'ground'));
                    entities.push(new Crate(400, 400, 90, 90));
                    entities.push(new Entity(700, 250, 100, 350, 'ground'));
                    entities.push(new Entity(800, 250, 600, 350, 'ground'));
                    entities.push(new Entity(1300, 150, 50, 100, 'flag'));
                    player = new Player(100, 300);
                }
            },
            {
                // Уровень 4: Два врага и ящик
                init: () => {
                    entities = [];
                    entities.push(new Entity(0, 500, 400, 100, 'ground'));
                    entities.push(new Crate(350, 400, 75, 75));
                    entities.push(new Entity(500, 450, 200, 150, 'ground'));
                    entities.push(new Enemy(550, 400, 150));
                    entities.push(new Entity(750, 350, 300, 250, 'ground'));
                    entities.push(new Enemy(800, 300, 200));
                    entities.push(new Entity(1100, 500, 500, 100, 'ground'));
                    entities.push(new Entity(1500, 400, 50, 100, 'flag'));
                    player = new Player(50, 300);
                }
            },
            {
                // Уровень 5: Лабиринт из ящиков
                init: () => {
                    entities = [];
                    entities.push(new Entity(0, 500, 300, 100, 'ground'));
                    entities.push(new Entity(350, 500, 100, 100, 'ground')); // Платформа для первого ящика
                    entities.push(new Crate(380, 440, 60, 60));
                    entities.push(new Entity(500, 450, 100, 100, 'ground')); // Платформа для второго ящика
                    entities.push(new Crate(530, 390, 60, 60));
                    entities.push(new Entity(650, 400, 100, 100, 'ground')); // Платформа для третьего ящика
                    entities.push(new Crate(680, 340, 60, 60));
                    entities.push(new Entity(800, 500, 400, 100, 'ground'));
                    entities.push(new Enemy(900, 450, 300));
                    entities.push(new Entity(1250, 500, 500, 100, 'ground'));
                    entities.push(new Entity(1650, 400, 50, 100, 'flag'));
                    player = new Player(50, 300);
                }
            },
            {
                // Уровень 6: Башня из ящиков
                init: () => {
                    entities = [];
                    entities.push(new Entity(0, 500, 400, 100, 'ground'));
                    entities.push(new Crate(300, 440, 50, 50));
                    entities.push(new Crate(300, 390, 50, 50));
                    entities.push(new Crate(300, 340, 50, 50));
                    entities.push(new Entity(500, 500, 300, 100, 'ground'));
                    entities.push(new Enemy(550, 450, 200));
                    entities.push(new Entity(800, 400, 400, 200, 'ground'));
                    entities.push(new Crate(900, 340, 70, 70));
                    entities.push(new Crate(900, 270, 70, 70));
                    entities.push(new Entity(1200, 500, 500, 100, 'ground'));
                    entities.push(new Entity(1600, 400, 50, 100, 'flag'));
                    player = new Player(50, 300);
                }
            },
            {
                // Уровень 7: Много врагов
                init: () => {
                    entities = [];
                    entities.push(new Entity(0, 500, 300, 100, 'ground'));
                    entities.push(new Enemy(100, 450, 150));
                    entities.push(new Entity(350, 500, 200, 100, 'ground'));
                    entities.push(new Enemy(400, 450, 100));
                    entities.push(new Entity(600, 450, 200, 150, 'ground'));
                    entities.push(new Enemy(650, 400, 100));
                    entities.push(new Entity(800, 500, 400, 100, 'ground'));
                    entities.push(new Enemy(900, 450, 300));
                    entities.push(new Enemy(950, 450, 200));
                    entities.push(new Entity(1250, 500, 500, 100, 'ground'));
                    entities.push(new Entity(1650, 400, 50, 100, 'flag'));
                    player = new Player(50, 300);
                }
            },
            {
                // Уровень 8: Сложные платформы
                init: () => {
                    entities = [];
                    entities.push(new Entity(0, 500, 200, 100, 'ground'));
                    entities.push(new Entity(250, 450, 100, 150, 'ground'));
                    entities.push(new Crate(280, 400, 40, 40));
                    entities.push(new Entity(400, 400, 100, 200, 'ground'));
                    entities.push(new Enemy(450, 350, 50));
                    entities.push(new Entity(550, 350, 100, 250, 'ground'));
                    entities.push(new Crate(580, 300, 45, 45));
                    entities.push(new Entity(700, 300, 150, 300, 'ground'));
                    entities.push(new Enemy(750, 250, 100));
                    entities.push(new Entity(900, 400, 200, 200, 'ground'));
                    entities.push(new Enemy(950, 350, 100));
                    entities.push(new Entity(1150, 500, 600, 100, 'ground'));
                    entities.push(new Entity(1650, 400, 50, 100, 'flag'));
                    player = new Player(50, 300);
                }
            },
            {
                // Уровень 9: Финальный вызов
                init: () => {
                    entities = [];
                    entities.push(new Entity(0, 500, 250, 100, 'ground'));
                    entities.push(new Enemy(100, 450, 100));
                    entities.push(new Crate(200, 440, 60, 60));
                    entities.push(new Entity(300, 450, 150, 150, 'ground'));
                    entities.push(new Enemy(350, 400, 100));
                    entities.push(new Entity(480, 400, 120, 200, 'ground'));
                    entities.push(new Enemy(520, 350, 70));
                    entities.push(new Entity(650, 350, 150, 250, 'ground'));
                    entities.push(new Enemy(700, 300, 100));
                    entities.push(new Entity(850, 300, 200, 300, 'ground'));
                    entities.push(new Enemy(900, 250, 150));
                    entities.push(new Enemy(950, 250, 100));
                    entities.push(new Crate(980, 250, 70, 70));
                    entities.push(new Entity(1100, 400, 250, 200, 'ground'));
                    entities.push(new Enemy(1150, 350, 200));
                    entities.push(new Entity(1400, 500, 400, 100, 'ground'));
                    entities.push(new Enemy(1500, 450, 100));
                    entities.push(new Entity(1700, 400, 50, 100, 'flag'));
                    player = new Player(50, 300);
                }
            },
            {
                // Уровень 10: Босс
                init: () => {
                    entities = [];
                    entities.push(new Entity(0, 500, 300, 100, 'ground'));
                    entities.push(new Entity(400, 450, 200, 150, 'ground'));
                    entities.push(new Enemy(450, 400, 100));
                    entities.push(new Entity(650, 400, 200, 200, 'ground'));
                    entities.push(new Enemy(700, 350, 100));
                    entities.push(new Crate(750, 350, 90, 90));
                    entities.push(new Crate(850, 350, 90, 90));
                    entities.push(new Entity(950, 350, 200, 250, 'ground'));
                    entities.push(new Enemy(1000, 300, 100));
                    entities.push(new Enemy(1050, 300, 100));
                    entities.push(new Crate(1100, 300, 100, 100));
                    entities.push(new Entity(1250, 400, 300, 200, 'ground'));
                    entities.push(new Enemy(1300, 350, 200));
                    entities.push(new Enemy(1350, 350, 150));
                    entities.push(new Crate(1400, 350, 120, 120));
                    entities.push(new Entity(1550, 500, 400, 100, 'ground'));
                    entities.push(new Entity(1850, 400, 50, 100, 'flag'));
                    player = new Player(50, 300);
                }
            }
        ];
        
        function loadLevel(idx) {
            if (idx >= LEVELS.length) {
                // Показываем красивое поздравление вместо alert
                setShowVictory(true);
                setTimeout(() => {
                    setShowVictory(false);
                    idx = 0;
                    currentLevelIdx = idx;
                    LEVELS[idx].init();
                    cameraX = 0;
                }, 5000);
                return;
            }
            currentLevelIdx = idx;
            LEVELS[idx].init();
            cameraX = 0;
            // НЕ восстанавливаем жизни между уровнями
        }
        
        function resetLevel() {
            loadLevel(currentLevelIdx);
        }
        
        // --- ФИЗИЧЕСКИЙ ДВИЖОК ---
        function checkRectCollision(rect1, rect2) {
            return (rect1.pos.x < rect2.pos.x + rect2.w &&
                    rect1.pos.x + rect1.w > rect2.pos.x &&
                    rect1.pos.y < rect2.pos.y + rect2.h &&
                    rect1.pos.y + rect1.h > rect2.pos.y);
        }
        
        function resolveCircleRect(circle, rect, isMovableCrate = false) {
            let closestX = Math.max(rect.pos.x, Math.min(circle.pos.x, rect.pos.x + rect.w));
            let closestY = Math.max(rect.pos.y, Math.min(circle.pos.y, rect.pos.y + rect.h));
            let dx = circle.pos.x - closestX;
            let dy = circle.pos.y - closestY;
            let distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < circle.radius) {
                let overlap = circle.radius - distance;
                let nx = dx / distance;
                let ny = dy / distance;
                
                // Обработка центрального случая
                if (distance === 0) { nx = 0; ny = -1; overlap = circle.radius; }
                
                // Логика для толкаемых ящиков
                if (isMovableCrate && Math.abs(nx) > 0.7) {
                    rect.vel.x += circle.vel.x * 0.5;
                    circle.vel.x *= 0.5;
                    circle.pos.x += nx * (overlap * 0.2);
                    return;
                }
                
                // Разделяем объекты
                circle.pos.x += nx * overlap;
                circle.pos.y += ny * overlap;
                
                // Устанавливаем grounded при контакте с верхней поверхностью
                if (ny < -0.5) {
                    circle.vel.y = 0;
                    if (circle === player) {
                        circle.grounded = true;
                        circle.coyoteTime = 10;
                    }
                }
                // Контакт с потолком
                else if (ny > 0.5) {
                    circle.vel.y = 0;
                }
                
                // Стены
                if (Math.abs(nx) > 0.7) {
                    circle.vel.x = 0;
                }
            }
        }
        
        function resolveRectRect(r1, r2) {
            if (checkRectCollision(r1, r2)) {
                let overlapX = (r1.w/2 + r2.w/2) - Math.abs((r1.pos.x + r1.w/2) - (r2.pos.x + r2.w/2));
                let overlapY = (r1.h/2 + r2.h/2) - Math.abs((r1.pos.y + r1.h/2) - (r2.pos.y + r2.h/2));
                
                if (overlapX < overlapY) {
                    if (r1.pos.x < r2.pos.x) r1.pos.x -= overlapX;
                    else r1.pos.x += overlapX;
                    r1.vel.x = 0;
                } else {
                    if (r1.pos.y < r2.pos.y) {
                        r1.pos.y -= overlapY;
                    } else {
                        r1.pos.y += overlapY;
                    }
                    r1.vel.y = 0;
                }
            }
        }
        
        function isGrounded() {
            // Простая и надежная проверка земли через raycasting
            for (let entity of entities) {
                if (entity.type === 'ground') {
                    // Проверяем, находится ли шар над платформой
                    if (player.pos.x > entity.pos.x - player.radius && 
                        player.pos.x < entity.pos.x + entity.w + player.radius) {
                        // Проверяем расстояние до верхней границы платформы
                        let distanceToGround = entity.pos.y - (player.pos.y + player.radius);
                        
                        // Отладка - раскомментируй для проверки
                        // console.log(`Distance to ground: ${distanceToGround}, Player Y: ${player.pos.y}, Ground Y: ${entity.pos.y}`);
                        
                        if (distanceToGround >= -3 && distanceToGround <= 8) {
                            // console.log("GROUNDED!");
                            return true;
                        }
                    }
                }
            }
            // console.log("NOT GROUNDED");
            return false;
        }
        
        function updatePhysics() {
            // 1. Обновляем состояние игрока (включая новую систему прыжка)
            player.update();
            
            // 2. Обновляем другие сущности
            entities.forEach(e => {
                if (e.type === 'crate') e.update();
                if (e.type === 'enemy') e.update();
            });
            
            // 3. Обрабатываем столкновения игрока со всеми объектами (включая стены)
            entities.forEach(e => {
                if (e.type === 'ground' || e.type === 'crate') {
                    resolveCircleRect(player, e, e.type === 'crate');
                }
            });
            
            // 4. Обрабатываем столкновения ящиков с землей
            entities.forEach(crate => {
                if (crate.type === 'crate') {
                    entities.forEach(ground => {
                        if (ground.type === 'ground') {
                            resolveRectRect(crate, ground);
                        }
                    });
                }
            });
            
            // 4.1. Обрабатываем столкновения ящиков друг с другом
            entities.forEach((crate1, i) => {
                if (crate1.type === 'crate') {
                    entities.forEach((crate2, j) => {
                        if (crate2.type === 'crate' && i !== j) {
                            resolveRectRect(crate1, crate2);
                        }
                    });
                }
            });
            
            // 5. Обрабатываем столкновения игрока с ящиками (дополнительно)
            entities.forEach(crate => {
                if (crate.type === 'crate') {
                    resolveCircleRect(player, crate, true);
                }
            });
            
            // 6. Обрабатываем столкновения с врагами
            entities.forEach(enemy => {
                if (enemy.type === 'enemy' && enemy.active) {
                    if (player.pos.x + player.radius > enemy.pos.x &&
                        player.pos.x - player.radius < enemy.pos.x + enemy.w &&
                        player.pos.y + player.radius > enemy.pos.y &&
                        player.pos.y - player.radius < enemy.pos.y + enemy.h) {
                        
                        // Проверка удара сверху
                        if (player.vel.y > 0 && player.pos.y < enemy.pos.y + 20) {
                            enemy.active = false;
                            player.vel.y = -8;
                            for(let i=0; i<10; i++) particles.push({x: enemy.pos.x+25, y:enemy.pos.y+25, vx: (Math.random()-0.5)*10, vy: (Math.random()-0.5)*10, life: 30, color: '#212121'});
                        } else {
                            player.takeDamage();
                            player.vel.x = (player.pos.x < enemy.pos.x) ? -10 : 10;
                            player.vel.y = -5;
                        }
                    }
                }
            });
            
            // 7. Проверка флага (финиш)
            entities.forEach(flag => {
                if (flag.type === 'flag') {
                    if (Math.abs(player.pos.x - flag.pos.x) < 50 && Math.abs(player.pos.y - flag.pos.y) < 100) {
                        loadLevel(currentLevelIdx + 1);
                    }
                }
            });
            
            // 8. Обновление камеры
            let targetCamX = player.pos.x - CANVAS_WIDTH * 0.4;
            if (targetCamX < 0) targetCamX = 0;
            cameraX += (targetCamX - cameraX) * 0.1;
            
            // 9. Обновление частиц
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.life--;
            });
            particles = particles.filter(p => p.life > 0);
        }
        
        // --- ОТРИСОВКА ---
        function drawSky() {
            let grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
            grad.addColorStop(0, '#1E88E5');
            grad.addColorStop(1, '#87CEEB');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            
            ctx.save();
            ctx.shadowBlur = 40;
            ctx.shadowColor = "yellow";
            ctx.fillStyle = "#FFEB3B";
            ctx.beginPath();
            ctx.arc(700, 80, 50, 0, Math.PI*2);
            ctx.fill();
            ctx.restore();
            
            ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
            const drawCloud = (x, y, scale) => {
                ctx.save();
                ctx.translate(x, y);
                ctx.scale(scale, scale);
                ctx.beginPath();
                ctx.arc(0, 0, 30, 0, Math.PI * 2);
                ctx.arc(25, -10, 35, 0, Math.PI * 2);
                ctx.arc(50, 0, 30, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            };
            drawCloud(100, 100, 1);
            drawCloud(300, 150, 0.8);
            drawCloud(600, 80, 1.2);
        }
        
        function drawTerrain(entity) {
            let x = entity.pos.x - cameraX;
            let y = entity.pos.y;
            let w = entity.w;
            let h = entity.h;
            
            if (x + w < 0 || x > CANVAS_WIDTH) return;
            
            ctx.fillStyle = "#5D4037";
            ctx.fillRect(x, y, w, h);
            
            ctx.fillStyle = "#3E2723";
            let r = entity.seed * 1000;
            for(let i=0; i<w/20; i++) {
                for(let j=0; j<h/20; j++) {
                    if (Math.sin(r + i*13 + j*7) > 0.8) {
                        let px = x + i*20 + Math.cos(r)*10;
                        let py = y + j*20 + Math.sin(r)*10;
                        if(px < x+w && py < y+h && px > x && py > y + 20) {
                             ctx.beginPath();
                             ctx.arc(px, py, 4, 0, Math.PI*2);
                             ctx.fill();
                        }
                    }
                }
            }
            
            ctx.fillStyle = "#76FF03";
            ctx.beginPath();
            ctx.moveTo(x, y);
            let waveWidth = 20;
            for (let i = 0; i < w; i += waveWidth) {
                ctx.quadraticCurveTo(x + i + waveWidth/2, y - 10, x + i + waveWidth, y);
            }
            ctx.lineTo(x + w, y + 20);
            ctx.lineTo(x, y + 20);
            ctx.fill();
        }
        
        function drawCrate(crate) {
            let x = crate.pos.x - cameraX;
            let y = crate.pos.y;
            
            ctx.fillStyle = "#8D6E63";
            ctx.fillRect(x, y, crate.w, crate.h);
            
            ctx.lineWidth = 4;
            ctx.strokeStyle = "#4E342E";
            ctx.strokeRect(x, y, crate.w, crate.h);
            
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + crate.w, y + crate.h);
            ctx.moveTo(x + crate.w, y);
            ctx.lineTo(x, y + crate.h);
            ctx.stroke();
            
            ctx.strokeRect(x+10, y+10, crate.w-20, crate.h-20);
        }
        
        function drawEnemy(enemy) {
            if (!enemy.active) return;
            let x = enemy.pos.x - cameraX;
            let y = enemy.pos.y;
            
            ctx.fillStyle = "#212121";
            ctx.fillRect(x, y, enemy.w, enemy.h);
            
            ctx.fillStyle = "white";
            ctx.beginPath();
            ctx.arc(x + 15, y + 20, 8, 0, Math.PI*2);
            ctx.arc(x + 35, y + 20, 8, 0, Math.PI*2);
            ctx.fill();
            
            ctx.fillStyle = "black";
            ctx.beginPath();
            ctx.arc(x + 15 + enemy.dir*2, y + 20, 3, 0, Math.PI*2);
            ctx.arc(x + 35 + enemy.dir*2, y + 20, 3, 0, Math.PI*2);
            ctx.fill();
            
            ctx.strokeStyle = "white";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x + 5, y + 12);
            ctx.lineTo(x + 20, y + 20);
            ctx.moveTo(x + 45, y + 12);
            ctx.lineTo(x + 30, y + 20);
            ctx.stroke();
            
            ctx.fillStyle = "white";
            ctx.beginPath();
            ctx.moveTo(x + 15, y + 35);
            ctx.lineTo(x + 20, y + 45);
            ctx.lineTo(x + 25, y + 35);
            ctx.lineTo(x + 30, y + 45);
            ctx.lineTo(x + 35, y + 35);
            ctx.fill();
        }
        
        function drawFlag(flag) {
            let x = flag.pos.x - cameraX;
            let y = flag.pos.y;
            
            ctx.fillStyle = "#555";
            ctx.fillRect(x, y, 5, 100);
            
            ctx.fillStyle = "#D32F2F";
            ctx.beginPath();
            ctx.moveTo(x+5, y);
            ctx.lineTo(x+50, y+25);
            ctx.lineTo(x+5, y+50);
            ctx.fill();
        }
        
        function drawPlayer() {
            let cx = player.pos.x - cameraX;
            let cy = player.pos.y;
            
            if (player.invulnerable > 0 && Math.floor(Date.now() / 50) % 2 === 0) return;
            
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(player.rotation);
            
            ctx.fillStyle = "#F44336";
            ctx.beginPath();
            ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = "#000";
            ctx.lineWidth = 4;
            ctx.stroke();
            
            ctx.fillStyle = "white";
            ctx.beginPath();
            ctx.arc(10, -5, 8, 0, Math.PI*2);
            ctx.arc(-5, -5, 8, 0, Math.PI*2);
            ctx.fill();
            
            ctx.fillStyle = "black";
            ctx.beginPath();
            ctx.arc(12, -5, 3, 0, Math.PI*2);
            ctx.arc(-3, -5, 3, 0, Math.PI*2);
            ctx.fill();
            
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(5, 5, 10, 0.2, Math.PI - 0.2);
            ctx.stroke();
            
            ctx.restore();
        }
        
        function drawUI() {
            ctx.fillStyle = "#F44336";
            for(let i=0; i<player.hp; i++) {
                let hx = 30 + i * 35;
                let hy = 30;
                ctx.beginPath();
                let topCurveHeight = 10;
                ctx.moveTo(hx, hy + topCurveHeight);
                ctx.bezierCurveTo(hx, hy, hx - 15, hy, hx - 15, hy + topCurveHeight);
                ctx.bezierCurveTo(hx - 15, hy + (topCurveHeight + 10), hx, hy + (topCurveHeight + 20), hx, hy + (topCurveHeight + 20));
                ctx.bezierCurveTo(hx, hy + (topCurveHeight + 20), hx + 15, hy + (topCurveHeight + 10), hx + 15, hy + topCurveHeight);
                ctx.bezierCurveTo(hx + 15, hy, hx, hy, hx, hy + topCurveHeight);
                ctx.fill();
            }
            
            ctx.fillStyle = "black";
            ctx.font = "bold 20px Arial";
            ctx.fillText("Уровень: " + (currentLevelIdx + 1), 680, 40);
        }
        
        function draw() {
            drawSky();
            entities.forEach(e => {
                if (e.type === 'ground') drawTerrain(e);
                if (e.type === 'flag') drawFlag(e);
                if (e.type === 'crate') drawCrate(e);
                if (e.type === 'enemy') drawEnemy(e);
            });
            drawPlayer();
            particles.forEach(p => {
                ctx.fillStyle = p.color;
                ctx.fillRect(p.x - cameraX, p.y, 5, 5);
            });
            drawUI();
        }
        
        // --- ГЛАВНЫЙ ЦИКЛ ---
        function gameLoop() {
            updatePhysics();
            draw();
            requestAnimationFrame(gameLoop);
        }
        
        // Инициализация
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        loadLevel(0);
        gameLoop();
        
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [gameActive]);
    
    return (
        <div className="redball-container">
            <div className="redball-header">
                <Link to="/" className="back-button">← Назад</Link>
                <h1>Red Ball</h1>
            </div>
            
            <div className="redball-game">
                <canvas 
                    ref={canvasRef}
                    width={800}
                    height={600}
                    className="game-canvas"
                />
                
                <div className="controls-info">
                    <h3>Управление:</h3>
                    <p>Пробел - Прыжок</p>
                    <p>A - Влево</p>
                    <p>D - Вправо</p>
                    <p>S - Вниз</p>
                </div>
            </div>
                            {showVictory && (
                    <div className="victory-overlay">
                        <div className="victory-modal">
                            <h2>ПОЗДРАВЛЯЮ!</h2>
                            <p>Все 10 уровней пройдены!</p>
                            <p>Ты настоящий герой!</p>
                        </div>
                    </div>
                )}
        </div>
    );
}
