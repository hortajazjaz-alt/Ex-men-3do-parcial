let config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },
    scene: { preload, create, update }
};

let game = new Phaser.Game(config);

let player;
let cursors;
let bullets;
let enemies;
let lastShot = 0;

let score = 0;
let scoreText;

let lifeIcons = [];
let lives = 3;

let gameOver = false;
let highScore = Number(localStorage.getItem("highScore")) || 0;
let highScoreText;

// ===========================
//        PRELOAD
// ===========================
function preload() {
    // Fondo
    this.load.image('sky', 'assets/fondo.png');

    // Jugador
    this.load.image('player', 'assets/hongo.png');

    // Bala
    this.load.image('bullet', 'assets/armas.png');

    // Enemigos
    this.load.image('enemy1', 'assets/enemy_1.png');
    this.load.image('enemy2', 'assets/enemy_2.png');

    // Icono de vida
    this.load.image('life', 'assets/hongo.png');
}

// ===========================
//         CREATE
// ===========================
function create() {
    // Fondo adaptado al tamaño del canvas
    let bg = this.add.image(0, 0, 'sky').setOrigin(0, 0);
    bg.displayWidth = this.sys.game.config.width;
    bg.displayHeight = this.sys.game.config.height;

    // Jugador
    player = this.physics.add.image(400, 520, 'player')
        .setScale(2) // jugador más grande
        .setCollideWorldBounds(true);

    // Controles
    cursors = this.input.keyboard.createCursorKeys();

    // Balas
    bullets = this.physics.add.group();

    // Enemigos
    enemies = this.physics.add.group();
    spawnEnemy(this);

    // Colisiones
    this.physics.add.overlap(bullets, enemies, destroyEnemy, null, this);
    this.physics.add.overlap(player, enemies, hitPlayer, null, this);

    // Score
    scoreText = this.add.text(20, 20, "Puntos: 0", { fontSize: '24px', fill: '#fff' });
    highScoreText = this.add.text(20, 50, "High Score: " + highScore, { fontSize: '24px', fill: '#fff' });

    // VIDAS
    lifeIcons = [];
    for (let i = 0; i < lives; i++) {
        let icon = this.add.image(750 - i * 40, 30, 'life').setScale(0.5);
        lifeIcons.push(icon);
    }
}

// ===========================
//          UPDATE
// ===========================
function update(time) {
    if (gameOver) return;

    player.setVelocityX(0);

    // Movimiento horizontal
    if (cursors.left.isDown) player.setVelocityX(-250);
    else if (cursors.right.isDown) player.setVelocityX(250);

    // Disparo
    if (cursors.space.isDown && time > lastShot) {
        shoot(this);
        lastShot = time + 300;
    }

    // Balas fuera de pantalla
    bullets.children.iterate(b => { if (b && b.y < -50) b.destroy(); });

    // Enemigos que caen
    enemies.children.iterate(e => {
        if (e && e.y > 650) {
            e.destroy();
            spawnEnemy(this);
            loseLife(this);
        }
    });
}

// ===========================
//         FUNCIONES
// ===========================
function shoot(scene) {
    // Bala más grande (aprox mitad del jugador)
    let b = bullets.create(player.x, player.y - player.displayHeight / 2, 'bullet');
    b.setVelocityY(-300);
    b.setScale(player.displayHeight / 2 / b.height);
}

function spawnEnemy(scene) {
    let type = Phaser.Math.Between(1, 2);
    let x = Phaser.Math.Between(50, 750);
    let enemy = enemies.create(x, -50, type === 1 ? 'enemy1' : 'enemy2');
    enemy.setVelocityY(Phaser.Math.Between(180, 270));
    enemy.setScale(1.5); // tamaño enemigos
}

function destroyEnemy(bullet, enemy) {
    bullet.destroy();
    score += calcularPuntosPorDistancia(player, enemy);
    scoreText.setText("Puntos: " + score);
    enemy.destroy();
    spawnEnemy(this);
}

function calcularPuntosPorDistancia(player, enemy) {
    let d = Phaser.Math.Distance.Between(player.x, player.y, enemy.x, enemy.y);
    return Math.max(5, Math.floor(300 - d));
}

function hitPlayer(playerObj, enemy) {
    enemy.destroy();
    loseLife(this);
    spawnEnemy(this);
}

function loseLife(scene) {
    lives--;
    if (lifeIcons[lives]) lifeIcons[lives].destroy();

    if (lives > 0) return;

    // GAME OVER
    gameOver = true;

    // Guardar high score
    if (score > highScore) {
        highScore = score;
        localStorage.setItem("highScore", highScore);
    }
    highScoreText.setText("High Score: " + highScore);

    let goText = scene.add.text(
        400, 300,
        "GAME OVER\nPresiona ESPACIO para reiniciar",
        { fontSize: '32px', fill: '#ff0000', align: 'center' }
    ).setOrigin(0.5);

    player.setVelocity(0, 0);
    enemies.children.iterate(e => e.setVelocityY(0));

    scene.input.keyboard.once("keydown-SPACE", () => {
        restartGame(scene);
        goText.destroy();
    });
}

function restartGame(scene) {
    score = 0;
    lives = 3;
    gameOver = false;
    lifeIcons = [];
    scene.scene.restart();
}
