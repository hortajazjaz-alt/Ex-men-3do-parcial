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
let playerBullets;
let enemyBullets;
let enemies; // todos los enemigos juntos
let lastPlayerShot = 0;
let lastEnemyShot = 0;

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
    this.load.image('sky', 'assets/fondo.png');
    this.load.image('player', 'assets/hongo.png');
    this.load.image('bullet', 'assets/armas.png');
    this.load.image('enemy1', 'assets/enemy_1.png');
    this.load.image('enemy2', 'assets/enemy_2.png');
    this.load.image('life', 'assets/hongo.png');
}

// ===========================
//         CREATE
// ===========================
function create() {
    // Fondo
    let bg = this.add.image(0, 0, 'sky').setOrigin(0, 0);
    bg.displayWidth = this.sys.game.config.width;
    bg.displayHeight = this.sys.game.config.height;

    // Jugador
    player = this.physics.add.image(400, 520, 'player')
        .setScale(2)
        .setCollideWorldBounds(true);

    cursors = this.input.keyboard.createCursorKeys();

    // Balas
    playerBullets = this.physics.add.group();
    enemyBullets = this.physics.add.group();

    // Enemigos
    enemies = this.physics.add.group();
    spawnEnemyGroup(this); // spawn inicial

    // Colisiones
    this.physics.add.overlap(playerBullets, enemies, destroyEnemy, null, this);
    this.physics.add.overlap(enemyBullets, player, hitPlayer, null, this);

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

    // Movimiento jugador
    if (cursors.left.isDown) player.setVelocityX(-250);
    else if (cursors.right.isDown) player.setVelocityX(250);

    // Disparo jugador
    if (cursors.space.isDown && time > lastPlayerShot) {
        shootPlayer(this);
        lastPlayerShot = time + 300;
    }

    // Balas fuera de pantalla
    playerBullets.children.iterate(b => { if (b && b.y < -50) b.destroy(); });
    enemyBullets.children.iterate(b => { if (b && b.y > 650) b.destroy(); });

    // Movimiento enemigos y respawn
    enemies.children.iterate(e => {
        e.y += 0.2; // baja lentamente
        e.x += Math.sin(time / 1000 + e.x) * 0.3; // zigzag leve

        // Si sale por abajo, eliminar y generar nuevo grupo
        if (e.y > 650) {
            e.destroy();
        }
    });

    // Si ya no quedan enemigos, generar un nuevo grupo
    if (enemies.countActive(true) === 0) {
        spawnEnemyGroup(this);
    }

    // Disparo enemigos cada cierto tiempo
    if (time > lastEnemyShot) {
        enemies.children.iterate(e => {
            if (Phaser.Math.Between(0, 100) < 10) { // 10% chance
                shootEnemy(e);
            }
        });
        lastEnemyShot = time + 1000;
    }
}

// ===========================
//         FUNCIONES
// ===========================
function shootPlayer(scene) {
    let b = playerBullets.create(player.x, player.y - player.displayHeight / 2, 'bullet');
    b.setVelocityY(-300);
    b.setScale((player.displayHeight / 2) / b.height);
}

function shootEnemy(enemy) {
    let b = enemyBullets.create(enemy.x, enemy.y + enemy.displayHeight / 2, 'bullet');
    b.setVelocityY(200);
    b.setScale(enemy.displayHeight / 3 / b.height);
}

function spawnEnemyGroup(scene) {
    const groupSize = 3;
    const startX = Phaser.Math.Between(50, 600); // posición horizontal aleatoria
    const startY = -50; // empezar arriba
    const spacingX = 60;

    for (let i = 0; i < groupSize; i++) {
        let type = Phaser.Math.Between(1, 2);
        let enemy = enemies.create(startX + i * spacingX, startY, type === 1 ? 'enemy1' : 'enemy2');
        enemy.setScale(1.5);
    }
}

function destroyEnemy(bullet, enemy) {
    bullet.destroy();
    enemy.destroy();
    score += 10;
    scoreText.setText("Puntos: " + score);
}

function hitPlayer(playerObj, bullet) {
    bullet.destroy(); // solo pierde vida con balas enemigas
    loseLife(this);
}

function loseLife(scene) {
    lives--;
    if (lifeIcons[lives]) lifeIcons[lives].destroy();

    if (lives > 0) return;

    // GAME OVER
    gameOver = true;

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
    playerBullets.clear(true, true);
    enemyBullets.clear(true, true);
    enemies.clear(true, true);

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
