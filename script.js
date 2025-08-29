
 // Page navigation
function showWelcome() {
    document.getElementById('welcomePage').style.display = 'flex';
    document.getElementById('instructionsPage').style.display = 'none';
    document.getElementById('gamePage').style.display = 'none';
}

function showInstructions() {
    document.getElementById('welcomePage').style.display = 'none';
    document.getElementById('instructionsPage').style.display = 'block';
    document.getElementById('gamePage').style.display = 'none';
}

function showGame() {
    document.getElementById('welcomePage').style.display = 'none';
    document.getElementById('instructionsPage').style.display = 'none';
    document.getElementById('gamePage').style.display = 'block';
}

function startGameFromWelcome() {
    showGame();
    document.getElementById('startScreen').style.display = 'block';
}


function startGameFromInstructions() {
    showGame();
    document.getElementById('startScreen').style.display = 'block';
}

function backToMenu() {
    gameRunning = false;
    document.getElementById('gameOver').style.display = 'none';
    showWelcome();
}

// Snowfall effect
function createSnowflakes() {
    const snowflakesContainer = document.getElementById('snowflakes');
    const snowflakeSymbols = ['❄', '❅', '❆', '⋆', '✦', '●'];
            
function createSnowflake() {
    const snowflake = document.createElement('div');
    snowflake.className = 'snowflake';
    snowflake.innerHTML = snowflakeSymbols[Math.floor(Math.random() * snowflakeSymbols.length)];
    snowflake.style.left = Math.random() * 100 + 'vw';
    snowflake.style.animationDuration = Math.random() * 3 + 2 + 's';
    snowflake.style.opacity = Math.random();
    snowflake.style.fontSize = Math.random() * 10 + 10 + 'px';
                
snowflakesContainer.appendChild(snowflake);
                
setTimeout(() => {
    snowflake.remove();
  }, 5000);
}
            
setInterval(createSnowflake, 300)
}

// Game variables
let canvas, ctx;
let gameRunning = false;
let score = 0;
let highScore = localStorage.getItem('penguinHighScore') || 0;
let gameSpeed = 2;
let frameCount = 0;
        
// Game objects
let penguin = {
x: 50,
y: 400,
width: 32,
height: 32,
jumping: false,
jumpVelocity: 0,
gravity: 0.8,
jumpPower: -15
};
        
let obstacles = [];
let clouds = [];
let snowParticles = [];
let currentObstacleType = 0;

        // Obstacle types
        const obstacleTypes = [
            { name: 'ice_spike', width: 24, height: 48, groundLevel: true },
            { name: 'snowball', width: 20, height: 20, groundLevel: true },
            { name: 'icicle', width: 16, height: 32, groundLevel: false },
            { name: 'ice_block', width: 32, height: 32, groundLevel: true },
            { name: 'frozen_fish', width: 28, height: 16, groundLevel: false }
        ];

        // Sound effects using Web Audio API
        let audioContext;
        let soundEnabled = true;

        function initAudio() {
            try {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                soundEnabled = false;
                console.log('Web Audio API not supported');
            }
        }

        function playSound(frequency, duration, type = 'sine', volume = 0.1) {
            if (!soundEnabled || !audioContext) return;
            
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
            oscillator.type = type;
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
        }

        function playJumpSound() {
            // Quick ascending chirp for jump
            playSound(400, 0.1, 'square', 0.08);
            setTimeout(() => playSound(600, 0.05, 'square', 0.05), 50);
        }

        function playScoreSound() {
            // Pleasant bell sound for scoring
            playSound(800, 0.2, 'sine', 0.06);
            setTimeout(() => playSound(1000, 0.15, 'sine', 0.04), 100);
        }

        function playGameOverSound() {
            // Descending sad sound
            playSound(400, 0.3, 'sawtooth', 0.1);
            setTimeout(() => playSound(300, 0.3, 'sawtooth', 0.1), 200);
            setTimeout(() => playSound(200, 0.5, 'sawtooth', 0.1), 400);
        }

        function playLevelUpSound() {
            // Rising triumphant sound
            const notes = [523, 659, 784, 1047]; // C, E, G, C octave
            notes.forEach((note, i) => {
                setTimeout(() => playSound(note, 0.2, 'triangle', 0.08), i * 100);
            });
        }
        
        // Initialize game
        function init() {
            canvas = document.getElementById('gameCanvas');
            ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            
            initAudio();
            updateHighScore();
            setupEventListeners();
            createSnowflakes();
            gameLoop();
        }
        
        function setupEventListeners() {
            document.addEventListener('keydown', function(e) {
                if (e.code === 'Space') {
                    e.preventDefault();
                    if (gameRunning) {
                        jump();
                    }
                }
            });
            
            canvas.addEventListener('click', function() {
                if (gameRunning) {
                    jump();
                }
            });
        }
        
        function startGame() {
            document.getElementById('startScreen').style.display = 'none';
            gameRunning = true;
            score = 0;
            gameSpeed = 2;
            frameCount = 0;
            obstacles = [];
            clouds = [];
            snowParticles = [];
            penguin.y = 400;
            penguin.jumping = false;
            penguin.jumpVelocity = 0;
            
            // Add initial clouds
            for (let i = 0; i < 3; i++) {
                clouds.push({
                    x: Math.random() * 800,
                    y: 50 + Math.random() * 100,
                    speed: 0.5 + Math.random() * 0.5
                });
            }

            // Add initial snow particles
            for (let i = 0; i < 50; i++) {
                snowParticles.push({
                    x: Math.random() * 800,
                    y: Math.random() * 500,
                    speed: 0.5 + Math.random(),
                    size: Math.random() * 3 + 1
                });
            }
        }
        
        function restartGame() {
            document.getElementById('gameOver').style.display = 'none';
            startGame();
        }
        
        function jump() {
            if (!penguin.jumping) {
                penguin.jumping = true;
                penguin.jumpVelocity = penguin.jumpPower;
                playJumpSound();
            }
        }
        
        function updatePenguin() {
            if (penguin.jumping) {
                penguin.y += penguin.jumpVelocity;
                penguin.jumpVelocity += penguin.gravity;
                
                if (penguin.y >= 400) {
                    penguin.y = 400;
                    penguin.jumping = false;
                    penguin.jumpVelocity = 0;
                }
            }
        }
        
        function updateObstacles() {
            // Determine obstacle type based on score
            let obstacleTypeIndex = Math.floor(score / 100) % obstacleTypes.length;
            if (obstacleTypeIndex !== currentObstacleType) {
                currentObstacleType = obstacleTypeIndex;
                playLevelUpSound();
            }
            
            // Spawn obstacles
            if (frameCount % Math.max(60, 120 - Math.floor(gameSpeed * 8)) === 0) {
                const obstacleType = obstacleTypes[obstacleTypeIndex];
                const yPos = obstacleType.groundLevel ? 400 : 350 + Math.random() * 50;
                
                obstacles.push({
                    x: 800,
                    y: yPos,
                    width: obstacleType.width,
                    height: obstacleType.height,
                    type: obstacleType.name
                });
            }
            
            // Update obstacle positions
            for (let i = obstacles.length - 1; i >= 0; i--) {
                obstacles[i].x -= gameSpeed;
                
                if (obstacles[i].x + obstacles[i].width < 0) {
                    obstacles.splice(i, 1);
                    score += 10;
                    playScoreSound();
                }
            }
        }
        
        function updateClouds() {
            // Spawn clouds occasionally
            if (Math.random() < 0.003) {
                clouds.push({
                    x: 800,
                    y: 30 + Math.random() * 80,
                    speed: 0.3 + Math.random() * 0.4
                });
            }
            
            // Update cloud positions
            for (let i = clouds.length - 1; i >= 0; i--) {
                clouds[i].x -= clouds[i].speed;
                
                if (clouds[i].x + 48 < 0) {
                    clouds.splice(i, 1);
                }
            }
        }

        function updateSnow() {
            // Update snow particles
            for (let i = snowParticles.length - 1; i >= 0; i--) {
                snowParticles[i].x -= snowParticles[i].speed * 0.3;
                snowParticles[i].y += snowParticles[i].speed;
                
                if (snowParticles[i].x < -10 || snowParticles[i].y > 500) {
                    snowParticles[i].x = 800 + Math.random() * 100;
                    snowParticles[i].y = -Math.random() * 100;
                }
            }
        }
        
        function checkCollisions() {
            for (let obstacle of obstacles) {
                if (penguin.x < obstacle.x + obstacle.width &&
                    penguin.x + penguin.width > obstacle.x &&
                    penguin.y < obstacle.y + obstacle.height &&
                    penguin.y + penguin.height > obstacle.y) {
                    gameOver();
                    return;
                }
            }
        }
        
        function gameOver() {
            gameRunning = false;
            playGameOverSound();
            
            let newRecord = false;
            if (score > highScore) {
                highScore = score;
                localStorage.setItem('penguinHighScore', highScore);
                newRecord = true;
            }
            
            document.getElementById('finalScore').textContent = `FINAL SCORE: ${score.toString().padStart(5, '0')}`;
            document.getElementById('newRecord').style.display = newRecord ? 'block' : 'none';
            document.getElementById('gameOver').style.display = 'block';
            updateHighScore();
        }
        
        function updateScore() {
            document.getElementById('score').textContent = score.toString().padStart(5, '0');
        }
        
        function updateHighScore() {
            document.getElementById('highScore').textContent = highScore.toString().padStart(5, '0');
        }
        
        // Enhanced pixel art drawing functions
        function drawPixelRect(x, y, width, height, color) {
            ctx.fillStyle = color;
            ctx.fillRect(Math.floor(x), Math.floor(y), width, height);
        }
        
        function drawPenguin() {
            const x = Math.floor(penguin.x);
            const y = Math.floor(penguin.y);
            
            // Body (black)
            drawPixelRect(x + 8, y + 4, 16, 20, '#000');
            
            // Belly (white)
            drawPixelRect(x + 12, y + 8, 8, 12, '#FFF');
            
            // Head (black)
            drawPixelRect(x + 6, y, 20, 12, '#000');
            
            // Beak (orange)
            drawPixelRect(x + 14, y + 4, 6, 4, '#FF8C00');
            
            // Eyes (white)
            drawPixelRect(x + 10, y + 2, 4, 4, '#FFF');
            drawPixelRect(x + 18, y + 2, 4, 4, '#FFF');
            
            // Eye pupils (black)
            drawPixelRect(x + 12, y + 3, 2, 2, '#000');
            drawPixelRect(x + 19, y + 3, 2, 2, '#000');
            
            // Feet (orange)
            drawPixelRect(x + 8, y + 24, 6, 4, '#FF8C00');
            drawPixelRect(x + 18, y + 24, 6, 4, '#FF8C00');
            
            // Wings/flippers
            drawPixelRect(x + 4, y + 8, 6, 12, '#000');
            drawPixelRect(x + 22, y + 8, 6, 12, '#000');

            // Winter scarf (new!)
            drawPixelRect(x + 8, y + 12, 16, 4, '#FF0000');
            drawPixelRect(x + 10, y + 13, 2, 2, '#FFF');
            drawPixelRect(x + 14, y + 13, 2, 2, '#FFF');
            drawPixelRect(x + 18, y + 13, 2, 2, '#FFF');
        }
        
        function drawObstacle() {
            for (let obstacle of obstacles) {
                const x = Math.floor(obstacle.x);
                const y = Math.floor(obstacle.y);
                
                switch (obstacle.type) {
                    case 'ice_spike':
                        // Original ice spike
                        drawPixelRect(x, y, obstacle.width, obstacle.height, '#B8E6FF');
                        drawPixelRect(x, y, 4, obstacle.height, '#FFF');
                        drawPixelRect(x + 8, y, 4, obstacle.height, '#E0F6FF');
                        drawPixelRect(x + 16, y, 4, obstacle.height, '#FFF');
                        drawPixelRect(x + 20, y, 4, obstacle.height, '#D0E8FF');
                        
                        for (let i = 0; i < obstacle.height; i += 12) {
                            drawPixelRect(x + 2, y + i, 2, 6, '#87CEEB');
                            drawPixelRect(x + 10, y + i + 3, 2, 6, '#87CEEB');
                            drawPixelRect(x + 18, y + i, 2, 6, '#87CEEB');
                        }
                        drawPixelRect(x + 10, y - 4, 4, 4, '#FFF');
                        break;
                        
                    case 'snowball':
                        // Round snowball
                        drawPixelRect(x + 2, y, 16, 4, '#FFF');
                        drawPixelRect(x, y + 4, 20, 8, '#FFF');
                        drawPixelRect(x + 2, y + 12, 16, 8, '#FFF');
                        // Snowball texture
                        drawPixelRect(x + 4, y + 2, 2, 2, '#E8E8E8');
                        drawPixelRect(x + 12, y + 6, 2, 2, '#E8E8E8');
                        drawPixelRect(x + 8, y + 14, 2, 2, '#E8E8E8');
                        break;
                        
                    case 'icicle':
                        // Hanging icicle (floating)
                        drawPixelRect(x + 6, y, 4, obstacle.height, '#E0F6FF');
                        drawPixelRect(x + 4, y + 4, 8, obstacle.height - 8, '#B8E6FF');
                        drawPixelRect(x + 2, y + 8, 12, obstacle.height - 16, '#87CEEB');
                        // Sharp point
                        drawPixelRect(x + 7, y + obstacle.height, 2, 4, '#FFF');
                        // Crystal shine
                        drawPixelRect(x + 5, y + 4, 2, obstacle.height - 8, '#FFF');
                        break;
                        
                    case 'ice_block':
                        // Large ice block
                        drawPixelRect(x, y, obstacle.width, obstacle.height, '#B8E6FF');
                        drawPixelRect(x, y, obstacle.width, 8, '#FFF');
                        drawPixelRect(x, y, 8, obstacle.height, '#FFF');
                        drawPixelRect(x + obstacle.width - 8, y, 8, obstacle.height, '#87CEEB');
                        drawPixelRect(x, y + obstacle.height - 8, obstacle.width, 8, '#87CEEB');
                        // Ice cracks
                        drawPixelRect(x + 8, y + 8, 2, 16, '#87CEEB');
                        drawPixelRect(x + 16, y + 12, 2, 12, '#87CEEB');
                        drawPixelRect(x + 24, y + 6, 2, 20, '#87CEEB');
                        break;
                        
                    case 'frozen_fish':
                        // Frozen fish (floating)
                        drawPixelRect(x + 4, y + 6, 16, 8, '#4682B4');
                        drawPixelRect(x + 20, y + 8, 4, 4, '#4682B4'); // tail
                        drawPixelRect(x + 2, y + 8, 4, 4, '#5F9EA0'); // head
                        drawPixelRect(x + 24, y + 6, 4, 2, '#4682B4'); // tail fin
                        drawPixelRect(x + 24, y + 12, 4, 2, '#4682B4'); // tail fin
                        // Eye
                        drawPixelRect(x + 3, y + 9, 2, 2, '#FFF');
                        drawPixelRect(x + 4, y + 10, 1, 1, '#000');
                        // Ice coating
                        drawPixelRect(x + 6, y + 5, 12, 2, '#E0F6FF');
                        drawPixelRect(x + 6, y + 13, 12, 2, '#E0F6FF');
                        break;
                }
            }
        }
        
        function drawClouds() {
            for (let cloud of clouds) {
                const x = Math.floor(cloud.x);
                const y = Math.floor(cloud.y);
                
                // Storm clouds with gray tints
                drawPixelRect(x + 8, y, 32, 8, '#F0F0F0');
                drawPixelRect(x + 4, y + 4, 40, 8, '#E8E8E8');
                drawPixelRect(x, y + 8, 48, 8, '#E0E0E0');
                drawPixelRect(x + 8, y + 12, 32, 8, '#D8D8D8');
                
                // Cloud shadows (darker for winter mood)
                drawPixelRect(x + 2, y + 16, 44, 4, '#C0C0C0');
            }
        }

        function drawSnow() {
            ctx.fillStyle = '#FFF';
            for (let particle of snowParticles) {
                ctx.beginPath();
                ctx.arc(Math.floor(particle.x), Math.floor(particle.y), particle.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        function drawWinterGround() {
            // Snow-covered ground
            ctx.fillStyle = '#FFF';
            ctx.fillRect(0, 430, 800, 70);
            
            // Snow drifts
            ctx.fillStyle = '#F0F8FF';
            for (let x = 0; x < 800; x += 32) {
                ctx.fillRect(x, 430, 16, 8);
                ctx.fillRect(x + 8, 434, 20, 6);
            }
            
            // Ice patches on ground
            ctx.fillStyle = '#E0F6FF';
            for (let x = 0; x < 800; x += 48) {
                ctx.fillRect(x + 4, 438, 12, 4);
            }
            
            // Moving ground line (footprints in snow)
            ctx.fillStyle = '#DDD';
            let groundOffset = (frameCount * gameSpeed) % 24;
            for (let x = -groundOffset; x < 800; x += 24) {
                ctx.fillRect(x, 432, 4, 2);
                ctx.fillRect(x + 6, 434, 4, 2);
            }
        }

        function drawWinterBackground() {
            // Winter sky gradient
            const gradient = ctx.createLinearGradient(0, 0, 0, 500);
            gradient.addColorStop(0, '#1e3c72');
            gradient.addColorStop(0.3, '#2a5298');
            gradient.addColorStop(0.7, '#87ceeb');
            gradient.addColorStop(1, '#e0f6ff');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 800, 500);

            // Distant mountains
            ctx.fillStyle = '#4682B4';
            ctx.fillRect(0, 300, 800, 130);
            
            // Mountain peaks
            ctx.fillStyle = '#5F9EA0';
            for (let x = 0; x < 800; x += 100) {
                ctx.beginPath();
                ctx.moveTo(x, 300);
                ctx.lineTo(x + 50, 250 + Math.sin(x * 0.01) * 20);
                ctx.lineTo(x + 100, 300);
                ctx.fill();
            }

            // Snow caps on mountains
            ctx.fillStyle = '#FFF';
            for (let x = 0; x < 800; x += 100) {
                ctx.beginPath();
                ctx.moveTo(x + 20, 280);
                ctx.lineTo(x + 50, 250 + Math.sin(x * 0.01) * 20);
                ctx.lineTo(x + 80, 280);
                ctx.fill();
            }
        }
        
        function draw() {
            drawWinterBackground();
            drawClouds();
            drawSnow();
            drawWinterGround();
            drawPenguin();
            drawObstacle();
        }
        
        function gameLoop() {
            if (gameRunning) {
                frameCount++;
                
                updatePenguin();
                updateObstacles();
                updateClouds();
                updateSnow();
                checkCollisions();
                
                // Increase game speed gradually
                if (frameCount % 600 === 0) {
                    gameSpeed += 0.2;
                }
                
                // Continuous scoring
                if (frameCount % 10 === 0) {
                    score += 1;
                }
                
                updateScore();
            }
            
            draw();
            requestAnimationFrame(gameLoop);
        }
        
        // Initialize game when page loads
        window.addEventListener('load', init);
    