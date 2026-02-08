const cursorDot = document.querySelector('.cursor-dot');
const cursorCircle = document.querySelector('.cursor-circle');

const updateCursor = (x, y) => {
    if (cursorDot) {
        cursorDot.style.left = x + 'px';
        cursorDot.style.top = y + 'px';
    }
    
    if (cursorCircle) {
        cursorCircle.style.left = x + 'px';
        cursorCircle.style.top = y + 'px';
    }
}

window.addEventListener('mousemove', (e) => {
    updateCursor(e.clientX, e.clientY);
});

window.addEventListener('touchmove', (e) => {
    const touch = e.touches[0];
    updateCursor(touch.clientX, touch.clientY);
});

document.querySelectorAll('a, button, .game-item, .crew-card, .sidebar-icon').forEach(el => {
    el.addEventListener('mouseenter', () => {
        if(cursorCircle) cursorCircle.classList.add('active');
    });
    el.addEventListener('mouseleave', () => {
        if(cursorCircle) cursorCircle.classList.remove('active');
    });
});

const card = document.getElementById('tilt-card');
const container = document.querySelector('.app-container');

if (card && container && window.innerWidth > 768) {
    container.addEventListener('mousemove', (e) => {
        const xAxis = (window.innerWidth / 2 - e.pageX) / 25;
        const yAxis = (window.innerHeight / 2 - e.pageY) / 25;
        card.style.transform = `rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
    });

    container.addEventListener('mouseenter', () => {
        card.style.transition = 'none';
    });

    container.addEventListener('mouseleave', () => {
        card.style.transition = 'all 0.5s ease';
        card.style.transform = `rotateY(0deg) rotateX(0deg)`;
    });
}

const canvas = document.getElementById('bg-canvas');
if (canvas) {
    const ctx = canvas.getContext('2d');
    let width, height;

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    }
    window.addEventListener('resize', resize);
    resize();

    function getMousePos() {
        if (cursorDot && cursorDot.style.left) {
             return {
                 x: parseFloat(cursorDot.style.left),
                 y: parseFloat(cursorDot.style.top)
             };
        }
        return { x: width/2, y: height/2 };
    }

    function initNeuralNetwork() {
        const nodes = [];
        const nodeCount = 100; // More nodes
        const connectionDist = 150;
        const mouseDist = 350; // Larger interaction radius

        class Node {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * 1.5;
                this.vy = (Math.random() - 0.5) * 1.5;
                this.size = Math.random() * 2 + 1;
                this.baseColor = Math.random() > 0.5 ? '#00f3ff' : '#bc13fe'; 
                this.color = this.baseColor;
            }

            update(mx, my) {
                this.x += this.vx;
                this.y += this.vy;

                // Bounce
                if (this.x < 0 || this.x > width) this.vx *= -1;
                if (this.y < 0 || this.y > height) this.vy *= -1;

                const dx = mx - this.x;
                const dy = my - this.y;
                const dist = Math.sqrt(dx*dx + dy*dy);

                // Stronger repulsion
                if (dist < mouseDist) {
                    const force = (mouseDist - dist) / mouseDist;
                    const angle = Math.atan2(dy, dx);
                    // Push away
                    this.vx -= Math.cos(angle) * force * 0.8;
                    this.vy -= Math.sin(angle) * force * 0.8;
                    this.color = '#ffffff';
                } else {
                    this.color = this.baseColor;
                }
                
                // Friction / Speed Limit
                const speed = Math.sqrt(this.vx*this.vx + this.vy*this.vy);
                if (speed > 4) {
                    this.vx *= 0.9;
                    this.vy *= 0.9;
                }
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();
            }
        }

        for(let i=0; i<nodeCount; i++) nodes.push(new Node());

        function animate() {
            ctx.fillStyle = 'rgba(2, 2, 2, 0.2)'; // Longer trails
            ctx.fillRect(0, 0, width, height);

            const {x: mx, y: my} = getMousePos();

            nodes.forEach((node, i) => {
                node.update(mx, my);
                node.draw();

                for(let j=i; j<nodes.length; j++) {
                    const dx = node.x - nodes[j].x;
                    const dy = node.y - nodes[j].y;
                    const dist = Math.sqrt(dx*dx + dy*dy);

                    if (dist < connectionDist) {
                        ctx.beginPath();
                        ctx.moveTo(node.x, node.y);
                        ctx.lineTo(nodes[j].x, nodes[j].y);
                        const opacity = 1 - (dist / connectionDist);
                        ctx.strokeStyle = `rgba(0, 243, 255, ${opacity * 0.4})`;
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                }

                // Mouse connections
                const dx = node.x - mx;
                const dy = node.y - my;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < mouseDist) {
                    ctx.beginPath();
                    ctx.moveTo(node.x, node.y);
                    ctx.lineTo(mx, my);
                    const opacity = 1 - (dist / mouseDist);
                    ctx.strokeStyle = `rgba(188, 19, 254, ${opacity})`;
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }
            });

            requestAnimationFrame(animate);
        }
        animate();
    }

    function initMatrixRain() {
        const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const fontSize = 14;
        const columns = width / fontSize;
        const drops = [];

        for(let i = 0; i < columns; i++) {
            drops[i] = Math.random() * height/fontSize;
        }

        function animate() {
            ctx.fillStyle = 'rgba(2, 2, 2, 0.08)';
            ctx.fillRect(0, 0, width, height);

            ctx.font = fontSize + 'px monospace';
            const {x: mx, y: my} = getMousePos();

            for(let i = 0; i < drops.length; i++) {
                const text = characters.charAt(Math.floor(Math.random() * characters.length));
                const x = i * fontSize;
                const y = drops[i] * fontSize;

                const dx = x - mx;
                const dy = y - my;
                const dist = Math.sqrt(dx*dx + dy*dy);

                // Mouse interaction: Explode/Scatter or Brighten
                if (dist < 100) {
                    ctx.fillStyle = '#fff';
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = '#00f3ff';
                    // Slight vertical scatter
                    if(Math.random() > 0.5) drops[i] -= 0.5;
                } else {
                    ctx.fillStyle = '#0F0';
                    ctx.shadowBlur = 0;
                    if (Math.random() > 0.98) ctx.fillStyle = '#00f3ff'; 
                }

                ctx.fillText(text, x, y);

                if(y > height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
            requestAnimationFrame(animate);
        }
        animate();
    }

    function initCyberWarp() {
        const stars = [];
        const numStars = 600;

        class Star {
            constructor() {
                this.x = Math.random() * width - width/2;
                this.y = Math.random() * height - height/2;
                this.z = Math.random() * width;
                this.pz = this.z;
            }

            update(speed, mx, my) {
                this.z = this.z - speed;
                
                // Steer stars based on mouse
                const steerX = (mx - width/2) / 20;
                const steerY = (my - height/2) / 20;
                this.x -= steerX;
                this.y -= steerY;

                if (this.z < 1) {
                    this.z = width;
                    this.x = Math.random() * width - width/2;
                    this.y = Math.random() * height - height/2;
                    this.pz = this.z;
                }
                
                // Keep stars in bounds logic roughly
                if (Math.abs(this.x) > width) this.x = (Math.random() * width - width/2);
                if (Math.abs(this.y) > height) this.y = (Math.random() * height - height/2);
            }

            draw() {
                const sx = (this.x / this.z) * width + width/2;
                const sy = (this.y / this.z) * height + height/2;

                const r = (1 - this.z / width) * 3;
                
                const px = (this.x / this.pz) * width + width/2;
                const py = (this.y / this.pz) * height + height/2;

                this.pz = this.z;

                ctx.beginPath();
                ctx.moveTo(px, py);
                ctx.lineTo(sx, sy);
                
                const opacity = (1 - this.z / width);
                ctx.strokeStyle = `rgba(188, 19, 254, ${opacity})`;
                ctx.lineWidth = r;
                ctx.stroke();
            }
        }

        for (let i = 0; i < numStars; i++) stars.push(new Star());

        function animate() {
            ctx.fillStyle = 'rgba(2, 2, 2, 0.5)'; 
            ctx.fillRect(0, 0, width, height);

            const {x: mx, y: my} = getMousePos();
            const cx = width / 2;
            const cy = height / 2;
            
            const distFromCenter = Math.sqrt((mx - cx)**2 + (my - cy)**2);
            // Speed increases as mouse moves away from center
            const speed = 5 + (distFromCenter / width) * 60;

            stars.forEach(star => {
                star.update(speed, mx, my);
                star.draw();
            });

            requestAnimationFrame(animate);
        }
        animate();
    }

    function initGravityGrid() {
        const points = [];
        const spacing = 40;
        const rows = Math.ceil(height / spacing) + 1;
        const cols = Math.ceil(width / spacing) + 1;

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                points.push({
                    x: x * spacing,
                    y: y * spacing,
                    originX: x * spacing,
                    originY: y * spacing
                });
            }
        }

        function animate() {
            ctx.fillStyle = 'rgba(2, 2, 2, 0.3)';
            ctx.fillRect(0, 0, width, height);

            const {x: mx, y: my} = getMousePos();

            ctx.beginPath();
            points.forEach(p => {
                const dx = p.x - mx;
                const dy = p.y - my;
                const dist = Math.sqrt(dx*dx + dy*dy);
                const maxDist = 200;

                // Physics: Points are attracted to origin but repelled by mouse
                // Repel effect
                if (dist < maxDist) {
                    const angle = Math.atan2(dy, dx);
                    const force = (maxDist - dist) / maxDist;
                    const push = force * 40; // Push distance
                    
                    p.x = p.originX + Math.cos(angle) * push;
                    p.y = p.originY + Math.sin(angle) * push;
                } else {
                    // Return to origin
                    p.x += (p.originX - p.x) * 0.1;
                    p.y += (p.originY - p.y) * 0.1;
                }

                // Draw dots
                ctx.moveTo(p.x + 1, p.y);
                ctx.arc(p.x, p.y, 1, 0, Math.PI * 2);
            });
            
            ctx.fillStyle = '#00f3ff';
            ctx.fill();

            // Draw lines
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(188, 19, 254, 0.15)';
            for (let i = 0; i < points.length; i++) {
                const p = points[i];
                // Connect to right neighbor
                if ((i + 1) % cols !== 0) {
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(points[i+1].x, points[i+1].y);
                }
                // Connect to bottom neighbor
                if (i + cols < points.length) {
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(points[i+cols].x, points[i+cols].y);
                }
            }
            ctx.stroke();

            requestAnimationFrame(animate);
        }
        animate();
    }

    function initNeonHexagons() {
        const hexSize = 30;
        const hexHeight = hexSize * Math.sqrt(3);
        const hexWidth = hexSize * 2;
        const vertDist = hexHeight;
        const horizDist = hexWidth * 0.75;
        
        const hexs = [];
        const cols = Math.ceil(width / horizDist) + 2;
        const rows = Math.ceil(height / vertDist) + 2;

        class Hex {
            constructor(x, y) {
                this.x = x;
                this.y = y;
                this.life = 0; // 0 to 1, opacity
            }
            
            draw() {
                if (this.life <= 0.01) return;
                
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = 2 * Math.PI / 6 * i;
                    const x_i = this.x + hexSize * Math.cos(angle);
                    const y_i = this.y + hexSize * Math.sin(angle);
                    if (i === 0) ctx.moveTo(x_i, y_i);
                    else ctx.lineTo(x_i, y_i);
                }
                ctx.closePath();
                
                ctx.fillStyle = `rgba(0, 243, 255, ${this.life * 0.5})`;
                ctx.strokeStyle = `rgba(0, 243, 255, ${this.life})`;
                ctx.lineWidth = 2;
                ctx.fill();
                ctx.stroke();
            }
        }

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const xOffset = (c % 2) * (hexHeight / 2);
                const x = c * horizDist;
                const y = r * vertDist + (c % 2 === 0 ? 0 : hexHeight / 2);
                hexs.push(new Hex(x, y));
            }
        }

        function animate() {
            ctx.fillStyle = 'rgba(2, 2, 2, 0.3)';
            ctx.fillRect(0, 0, width, height);

            const {x: mx, y: my} = getMousePos();

            hexs.forEach(hex => {
                // Check distance to mouse
                const dx = hex.x - mx;
                const dy = hex.y - my;
                const dist = Math.sqrt(dx*dx + dy*dy);

                // Activate if close
                if (dist < 100) {
                    hex.life = 1;
                } else {
                    hex.life *= 0.95; // Decay
                }
                
                hex.draw();
            });

            requestAnimationFrame(animate);
        }
        animate();
    }

    function initDigitalWaves() {
        const lines = 40;
        const step = height / lines;
        let time = 0;

        function animate() {
            ctx.fillStyle = 'rgba(2, 2, 2, 0.2)';
            ctx.fillRect(0, 0, width, height);

            const {x: mx, y: my} = getMousePos();
            
            time += 0.05;

            ctx.lineWidth = 2;
            
            for(let i=0; i<lines; i++) {
                const yBase = i * step + step/2;
                
                ctx.beginPath();
                ctx.moveTo(0, yBase);

                // Draw sine wave across width
                for(let x=0; x<width; x+=10) {
                    // Calculate distance to mouse for local distortion
                    const distX = Math.abs(x - mx);
                    const distY = Math.abs(yBase - my);
                    const dist = Math.sqrt(distX*distX + distY*distY);
                    
                    // Interaction factor
                    let amp = 10;
                    let freq = 0.02;
                    
                    if (dist < 300) {
                        const force = (300 - dist) / 300;
                        amp += force * 40; // Higher waves near mouse
                        freq += force * 0.05; // Faster frequency
                    }

                    const y = yBase + Math.sin(x * freq + time + (i*0.5)) * amp;
                    ctx.lineTo(x, y);
                }

                const distToMouseLine = Math.abs(yBase - my);
                if (distToMouseLine < 100) {
                    ctx.strokeStyle = '#bc13fe';
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = '#bc13fe';
                } else {
                    ctx.strokeStyle = 'rgba(0, 243, 255, 0.3)';
                    ctx.shadowBlur = 0;
                }
                
                ctx.stroke();
            }

            requestAnimationFrame(animate);
        }
        animate();
    }

    function initCyberCircuit() {
        const paths = [];
        const pathCount = 50;
        
        class Path {
            constructor() {
                this.reset();
            }
            
            reset() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.history = [];
                this.maxLength = Math.random() * 50 + 20;
                this.dir = Math.floor(Math.random() * 4); // 0: up, 1: right, 2: down, 3: left
                this.speed = Math.random() * 2 + 2;
                this.color = Math.random() > 0.5 ? '#00f3ff' : '#bc13fe';
                this.width = Math.random() * 2 + 0.5;
                this.life = 1;
            }

            update(mx, my) {
                this.life -= 0.005;
                if(this.life <= 0) this.reset();

                // Change direction randomly
                if(Math.random() > 0.95) {
                    this.dir = Math.floor(Math.random() * 4);
                }

                if(this.dir === 0) this.y -= this.speed;
                if(this.dir === 1) this.x += this.speed;
                if(this.dir === 2) this.y += this.speed;
                if(this.dir === 3) this.x -= this.speed;

                // Mouse interaction: Sparks/Lightning
                const dx = mx - this.x;
                const dy = my - this.y;
                const dist = Math.sqrt(dx*dx + dy*dy);

                if(dist < 100) {
                    this.color = '#ffffff';
                    this.width = 3;
                    // Jitter
                    this.x += (Math.random() - 0.5) * 5;
                    this.y += (Math.random() - 0.5) * 5;
                } else {
                    if (this.color === '#ffffff') this.color = Math.random() > 0.5 ? '#00f3ff' : '#bc13fe';
                    this.width = Math.max(0.5, this.width - 0.1);
                }

                // Bounds
                if(this.x < 0 || this.x > width || this.y < 0 || this.y > height) this.reset();

                this.history.push({x: this.x, y: this.y});
                if(this.history.length > this.maxLength) this.history.shift();
            }

            draw() {
                ctx.beginPath();
                if(this.history.length > 0) ctx.moveTo(this.history[0].x, this.history[0].y);
                for(let i=1; i<this.history.length; i++) {
                    ctx.lineTo(this.history[i].x, this.history[i].y);
                }
                ctx.strokeStyle = this.color;
                ctx.lineWidth = this.width;
                ctx.stroke();

                // Draw head
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.width * 1.5, 0, Math.PI * 2);
                ctx.fillStyle = '#fff';
                ctx.fill();
            }
        }

        for(let i=0; i<pathCount; i++) paths.push(new Path());

        function animate() {
            ctx.fillStyle = 'rgba(2, 2, 2, 0.1)';
            ctx.fillRect(0, 0, width, height);
            
            const {x: mx, y: my} = getMousePos();

            paths.forEach(p => {
                p.update(mx, my);
                p.draw();
            });
            requestAnimationFrame(animate);
        }
        animate();
    }

    function initVortexTunnel() {
        let angle = 0;
        
        function animate() {
            ctx.fillStyle = 'rgba(2, 2, 2, 0.2)';
            ctx.fillRect(0, 0, width, height);
            
            const {x: mx, y: my} = getMousePos();
            const cx = width / 2;
            const cy = height / 2;
            
            const distFromCenter = Math.sqrt((mx - cx)**2 + (my - cy)**2);
            // Speed based on mouse distance
            const speed = 0.02 + (distFromCenter / width) * 0.1;
            angle += speed;

            const layers = 15;
            const maxRadius = Math.max(width, height) * 0.8;

            ctx.lineWidth = 2;
            
            for(let i=0; i<layers; i++) {
                const progress = (i / layers + (Date.now() * 0.0002)) % 1;
                const radius = progress * maxRadius;
                const opacity = progress; // Fade in as it grows

                ctx.beginPath();
                const points = 6; // Hexagon tunnel
                for(let j=0; j<=points; j++) {
                    const theta = (j / points) * Math.PI * 2 + angle * (i%2===0 ? 1 : -1);
                    const x = cx + Math.cos(theta) * radius;
                    const y = cy + Math.sin(theta) * radius;
                    if(j===0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                
                // Color shift based on mouse angle
                const mouseAngle = Math.atan2(my - cy, mx - cx);
                const hue = (progress * 360 + mouseAngle * 50) % 360;
                
                ctx.strokeStyle = `hsla(${hue}, 100%, 50%, ${opacity})`;
                ctx.shadowBlur = 10;
                ctx.shadowColor = ctx.strokeStyle;
                ctx.stroke();
            }

            requestAnimationFrame(animate);
        }
        animate();
    }

    function initNeonRain() {
        const drops = [];
        const dropCount = 150;

        class Drop {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height - height;
                this.len = Math.random() * 20 + 10;
                this.speed = Math.random() * 10 + 10;
                this.color = Math.random() > 0.5 ? '#00f3ff' : '#bc13fe';
            }

            update(mx, my) {
                this.y += this.speed;

                // Mouse deflection
                const dx = this.x - mx;
                const dy = this.y - my;
                const dist = Math.sqrt(dx*dx + dy*dy);

                if (dist < 80) {
                    // Bounce off mouse
                    this.y -= this.speed * 1.5;
                    this.x += dx * 0.5;
                    this.color = '#ffffff';
                }

                if (this.y > height) {
                    this.y = -this.len;
                    this.x = Math.random() * width;
                    this.color = Math.random() > 0.5 ? '#00f3ff' : '#bc13fe';
                }
            }

            draw() {
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(this.x, this.y + this.len);
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }

        for(let i=0; i<dropCount; i++) drops.push(new Drop());

        function animate() {
            ctx.fillStyle = 'rgba(2, 2, 2, 0.3)';
            ctx.fillRect(0, 0, width, height);
            
            const {x: mx, y: my} = getMousePos();

            drops.forEach(d => {
                d.update(mx, my);
                d.draw();
            });
            requestAnimationFrame(animate);
        }
        animate();
    }

    const backgrounds = [initNeuralNetwork, initMatrixRain, initCyberWarp, initGravityGrid, initNeonHexagons, initDigitalWaves, initCyberCircuit, initVortexTunnel, initNeonRain];
    const randomIndex = Math.floor(Math.random() * backgrounds.length);
    backgrounds[randomIndex]();
}

const gamesData = {
    'neon-shock': {
        title: 'GamerShock: Neon Protocol',
        desc: `"Survive the Glitch. Master the Grid."\n\nGamerShock is a high-octane, cyberpunk survival shooter where you pilot the Neon Interceptor against endless waves of viral entities.\n\nFeaturing 5 unique "Seasons" (from the Crimson Waste of Mars to the physics-breaking Void Core), deep weapon customization (Shotguns, Railguns, Bee-Seekers), and massive boss battles that warp the screen itself.\n\nBuilt with a custom 60FPS engine, it pushes browser gaming to the limit with thousands of particles, dynamic lighting, and a thumping synthwave aesthetic.\n\nCan you survive Protocol Omega?`,
        link: 'https://neon-shock.vercel.app'
    }
};

const modal = document.getElementById('game-modal');
const modalTitle = document.getElementById('modal-title');
const modalDesc = document.getElementById('modal-desc');
const modalPlayBtn = document.getElementById('modal-play-btn');

function openGameDetails(gameId) {
    const game = gamesData[gameId];
    if (!game) return;

    modalTitle.textContent = game.title;
    modalDesc.textContent = game.desc;
    modalPlayBtn.href = game.link;
    
    modal.classList.add('active');
}

function closeGameDetails() {
    modal.classList.remove('active');
}

modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeGameDetails();
    }
});

function toggleAbdoSidebar() {
    const sidebarLink = document.getElementById('abdo-sidebar');
    if (sidebarLink) {
        sidebarLink.classList.toggle('hidden');
    }
}