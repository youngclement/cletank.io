import { GameEnum } from '../consts/GameEnum.js';
import { UpgradeConfig } from '../consts/UpgradeConfig.js';

// Phaser is loaded globally via <script> in index.html

export class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.player = null;
        this.cursors = null;
        this.keys = {};
        this.bullets = null;
        this.enemies = null;
        this.lastFired = 0;
        this.xp = 0;
        this.level = 1;
        this.xpToLevel = GameEnum.XP.LEVEL_UP;
        this.maxLevel = GameEnum.XP.MAX_LEVEL;
        this.upgradePoints = 0;
    }

    preload() {
        // Âm thanh (user tự thêm file sau)
        this.load.audio('shoot', 'assets/sfx/shoot.mp3');
        this.load.audio('explosion', 'assets/sfx/explosion.mp3');
        // Hiệu ứng nổ (spritesheet hoặc ảnh động, user tự thêm file sau)
        this.load.spritesheet('explosion_anim', 'assets/sfx/explosion_anim.png', { frameWidth: 64, frameHeight: 64 });
        this.load.image('bg', 'assets/space.png');
        this.load.image('player', 'assets/spaceship.png');
        this.load.image('bullet', 'assets/bullet.png');
        this.load.image('enemy', 'assets/block.png');
    }

    create() {
        // Tạo animation nổ
        this.anims.create({
            key: 'explosion',
            frames: this.anims.generateFrameNumbers('explosion_anim', { start: 0, end: 15 }),
            frameRate: 20,
            repeat: 0
        });

        // Tạo âm thanh
        this.sfxShoot = this.sound.add('shoot');
        this.sfxExplosion = this.sound.add('explosion');
        // Background
        this.bg = this.add.image(640, 360, 'bg');
        this.bg.setDepth(-10);
        // Tank Stats UI
        this.statsText = this.add.text(16, 100, '', { fontSize: '18px', fill: '#fff' });
        this.skillText = this.add.text(16, 260, '', { fontSize: '18px', fill: '#0ff' });
        // Player tank vẽ bằng graphics
        this.player = this.physics.add.image(640, 360, null);
        this.player.setSize(60, 60);
        this.player.setCollideWorldBounds(true);
        this.player.tankClass = 'Basic';
        this.player.canPierce = false;
        this.player.health = GameEnum.PLAYER.MAX_HEALTH;
        this.player.maxHealth = GameEnum.PLAYER.MAX_HEALTH;
        this.player.speed = GameEnum.PLAYER.SPEED;
        this.player.lastShot = 0;
        this.player.bulletSpeed = GameEnum.PLAYER.BULLET_SPEED;
        this.player.bulletDamage = GameEnum.PLAYER.BULLET_DAMAGE;
        this.player.reloadSpeed = GameEnum.PLAYER.RELOAD_SPEED;
        this.player.healthRegen = GameEnum.PLAYER.HEALTH_REGEN;
        this.player.bodyDamage = GameEnum.PLAYER.BODY_DAMAGE;
        // Graphics layer cho tank
        this.playerGraphics = this.add.graphics();
        this.playerGraphics.setDepth(1);

        // Player Health Bar
        this.playerHealthBar = this.add.graphics();
        this.playerHealthBar.setDepth(2);
        // Bullets
        this.bullets = this.physics.add.group({
            classType: Phaser.Physics.Arcade.Image,
            maxSize: 30,
            runChildUpdate: true
        });

        // Enemies
        this.enemies = this.physics.add.group();
        this.spawnEnemy();

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys('W,A,S,D,ONE,TWO,THREE,FOUR');
        this.input.on('pointerdown', this.shoot, this);

        // XP/Level UI
        this.xpText = this.add.text(16, 16, 'XP: 0 / 100', { fontSize: '20px', fill: '#fff' });
        this.levelText = this.add.text(16, 40, 'Level: 1', { fontSize: '20px', fill: '#fff' });

        // Upgrade UI (ẩn mặc định)
        this.upgradePanel = this.add.container(640, 360).setVisible(false);
        const panelBg = this.add.rectangle(0, 0, 500, 300, 0x222244, 0.95).setStrokeStyle(4, 0xffffff);
        this.upgradeText = this.add.text(0, -120, 'Chọn nâng cấp (1-4):', { fontSize: '28px', fill: '#fff' }).setOrigin(0.5);
        this.upgradeOptions = [];
        for (let i = 0; i < 4; i++) {
            const t = this.add.text(0, -40 + i * 60, '', { fontSize: '24px', fill: '#ff0' }).setOrigin(0.5);
            this.upgradeOptions.push(t);
            this.upgradePanel.add(t);
        }
        this.upgradePanel.add([panelBg, this.upgradeText, ...this.upgradeOptions]);

        // Collisions
        this.physics.add.overlap(this.bullets, this.enemies, this.hitEnemy, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.playerHit, null, this);

        // Listen for upgrade keys
        this.input.keyboard.on('keydown-ONE', () => this.chooseUpgrade(0));
        this.input.keyboard.on('keydown-TWO', () => this.chooseUpgrade(1));
        this.input.keyboard.on('keydown-THREE', () => this.chooseUpgrade(2));
        this.input.keyboard.on('keydown-FOUR', () => this.chooseUpgrade(3));
    }

    update(time, delta) {
        // Player Health Bar
        this.playerHealthBar.clear();
        const barWidth = 200, barHeight = 18;
        const hpPercent = Phaser.Math.Clamp(this.player.health / this.player.maxHealth, 0, 1);
        this.playerHealthBar.fillStyle(0x000000);
        this.playerHealthBar.fillRect(16, 70, barWidth, barHeight);
        this.playerHealthBar.fillStyle(0x00ff00);
        this.playerHealthBar.fillRect(16, 70, barWidth * hpPercent, barHeight);
        this.playerHealthBar.lineStyle(2, 0xffffff);
        this.playerHealthBar.strokeRect(16, 70, barWidth, barHeight);

        // Update Tank Stats UI
        let stats = `Class: ${this.player.tankClass}\n`;
        stats += `HP: ${Math.floor(this.player.health)} / ${this.player.maxHealth}\n`;
        stats += `Speed: ${this.player.speed}\n`;
        stats += `Bullet Speed: ${this.player.bulletSpeed}\n`;
        stats += `Bullet Damage: ${this.player.bulletDamage}\n`;
        stats += `Reload: ${this.player.reloadSpeed}ms\n`;
        stats += `Regen: ${this.player.healthRegen}/s\n`;
        stats += `Body Damage: ${this.player.bodyDamage}`;
        this.statsText.setText(stats);

        // Hiện kỹ năng đặc biệt nếu có
        let skill = '';
        if (this.player.canPierce) skill += '- Đạn xuyên\n';
        if (this.player.tankClass === 'Machine Gun' || this.player.tankClass === 'Gunner') skill += '- Bắn siêu nhanh\n';
        if (this.player.tankClass === 'Sniper') skill += '- Tầm xa\n';
        if (this.player.tankClass === 'Overseer') skill += '- Gọi drone (chưa code)\n';
        if (this.player.tankClass === 'Necromancer') skill += '- Gọi minion (chưa code)\n';
        if (this.player.tankClass === 'Hybrid') skill += '- Toàn diện\n';
        if (skill) {
            this.skillText.setText('Kỹ năng đặc biệt:\n' + skill);
            this.skillText.setVisible(true);
        } else {
            this.skillText.setVisible(false);
        }

        // Vẽ tank bằng graphics
        this.playerGraphics.clear();
        this.playerGraphics.setPosition(this.player.x, this.player.y);
        this.playerGraphics.setRotation(this.player.rotation);
        this.drawTankShape(this.player.tankClass, this.playerGraphics);

        // Health regen
        if (this.player.health < this.player.maxHealth && this.player.healthRegen > 0) {
            this.player.health += this.player.healthRegen * (delta / 1000);
            if (this.player.health > this.player.maxHealth) this.player.health = this.player.maxHealth;
        }

        // Luôn update health bar cho enemy (UI), kể cả khi panel nâng cấp hiện
        this.enemies.children.iterate(enemy => {
            if (!enemy) return;
            // Draw health bar
            if (!enemy.healthBar) {
                enemy.healthBar = this.add.graphics();
            }
            enemy.healthBar.clear();
            const barWidth = 40, barHeight = 6;
            const hpPercent = enemy.health / enemy.maxHealth;
            enemy.healthBar.fillStyle(0x000000);
            enemy.healthBar.fillRect(enemy.x - barWidth / 2, enemy.y - 40, barWidth, barHeight);
            enemy.healthBar.fillStyle(enemy.enemyColor || 0xff0000);
            enemy.healthBar.fillRect(enemy.x - barWidth / 2, enemy.y - 40, barWidth * hpPercent, barHeight);
        });

        // Nếu đang hiện panel nâng cấp thì dừng update game logic (di chuyển, AI, bắn...)
        if (this.upgradePanel.visible) return;

        // Player movement
        let vx = 0, vy = 0;
        if (this.keys.W.isDown) vy = -1;
        if (this.keys.S.isDown) vy = 1;
        if (this.keys.A.isDown) vx = -1;
        if (this.keys.D.isDown) vx = 1;
        const len = Math.hypot(vx, vy);
        if (len > 0) {
            vx /= len; vy /= len;
            this.player.setVelocity(vx * this.player.speed, vy * this.player.speed);
        } else {
            this.player.setVelocity(0, 0);
        }

        // Player rotation
        const pointer = this.input.activePointer;
        this.player.rotation = Phaser.Math.Angle.Between(
            this.player.x, this.player.y, pointer.worldX, pointer.worldY
        );

        // Update enemies (AI)
        this.enemies.children.iterate(enemy => {
            if (!enemy) return;
            // Simple AI: move toward player
            const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
            this.physics.velocityFromRotation(angle, 80, enemy.body.velocity);
        });
    }

    // Vẽ hình tank theo class
    drawTankShape(tankClass, g) {
        // Basic: 1 nòng
        g.fillStyle(0x2e86c1);
        g.fillCircle(0, 0, 28);
        g.lineStyle(6, 0x154360);
        g.strokeCircle(0, 0, 28);
        // Nòng
        g.fillStyle(0xcccccc);
        if (tankClass === 'Basic') {
            g.fillRect(-7, -8, 14, 36);
        } else if (tankClass === 'Twin') {
            g.fillRect(-16, -8, 12, 36);
            g.fillRect(4, -8, 12, 36);
        } else if (tankClass === 'Triplet') {
            g.fillRect(-16, -8, 12, 36);
            g.fillRect(4, -8, 12, 36);
            g.fillRect(-6, -14, 12, 42);
        } else if (tankClass === 'Sniper') {
            g.fillRect(-4, -10, 8, 48);
        } else if (tankClass === 'Machine Gun') {
            g.fillRect(-7, -8, 14, 36);
            g.fillRect(-2, -12, 4, 40);
        } else if (tankClass === 'Destroyer') {
            g.fillRect(-10, -12, 20, 44);
        } else if (tankClass === 'Overseer') {
            g.fillStyle(0x27ae60);
            g.fillCircle(0, 0, 28);
            g.lineStyle(6, 0x145a32);
            g.strokeCircle(0, 0, 28);
        } else if (tankClass === 'Hybrid') {
            g.fillRect(-16, -8, 12, 36);
            g.fillRect(4, -8, 12, 36);
            g.fillRect(-6, -14, 12, 42);
            g.fillRect(-4, -18, 8, 50);
        } else if (tankClass === 'Necromancer') {
            g.fillStyle(0x76448a);
            g.fillCircle(0, 0, 28);
            g.lineStyle(6, 0x512e5f);
            g.strokeCircle(0, 0, 28);
        } else if (tankClass === 'Gunner') {
            g.fillRect(-16, -8, 12, 36);
            g.fillRect(4, -8, 12, 36);
            g.fillRect(-6, -14, 12, 42);
            g.fillRect(-4, -18, 8, 50);
            g.fillRect(-2, -22, 4, 54);
        }
    }

    shoot(pointer) {
        const now = this.time.now;
        if (now - this.player.lastShot < this.player.reloadSpeed) return; // fire rate
        // Phát âm thanh bắn
        if (this.sfxShoot) this.sfxShoot.play({ volume: 0.3 });
        const bullet = this.bullets.get(this.player.x, this.player.y, 'bullet');
        if (bullet) {
            bullet.setActive(true);
            bullet.setVisible(true);
            bullet.body.reset(this.player.x, this.player.y);
            bullet.hitEnemies = new Set(); // Reset mỗi lần bắn
            const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.worldX, pointer.worldY);
            this.physics.velocityFromRotation(angle, this.player.bulletSpeed, bullet.body.velocity);
            bullet.lifespan = 1000;
            bullet.update = function (time, delta) {
                this.lifespan -= delta;
                if (this.lifespan <= 0) this.setActive(false).setVisible(false);
            };
            this.player.lastShot = now;
        }
    }

    spawnEnemy() {
        const maxOnField = GameEnum.ENEMY.MAX_ON_FIELD;
        const spawnAttempt = GameEnum.ENEMY.SPAWN_ATTEMPT || 2;
        for (let i = 0; i < spawnAttempt; i++) {
            if (this.enemies.countActive(true) >= maxOnField) break;
            // Random loại bot theo weight
            const types = GameEnum.ENEMY.TYPES;
            const totalWeight = types.reduce((sum, t) => sum + t.weight, 0);
            let r = Phaser.Math.Between(1, totalWeight);
            let chosen = types[0];
            for (let t of types) {
                if (r <= t.weight) { chosen = t; break; }
                r -= t.weight;
            }
            const x = Phaser.Math.Between(100, 1180);
            const y = Phaser.Math.Between(100, 620);
            // Tạo graphics cho enemy
            const g = this.add.graphics();
            g.fillStyle(chosen.color, 1);
            if (chosen.level === 1) {
                g.fillRect(-18, -18, 36, 36);
            } else if (chosen.level === 2) {
                g.fillCircle(0, 0, 22);
            } else if (chosen.level === 3) {
                g.fillRect(-24, -12, 48, 24);
            } else if (chosen.level === 4) {
                g.fillCircle(0, 0, 28);
                g.lineStyle(4, 0x000000);
                g.strokeCircle(0, 0, 28);
            }
            // Tạo container enemy
            const enemy = this.add.container(x, y, [g]);
            this.physics.world.enable(enemy);
            enemy.body.setCollideWorldBounds(true);
            // Nếu là hình tròn thì setCircle, còn lại setSize
            if (chosen.level === 2) {
                enemy.body.setCircle(22);
            } else if (chosen.level === 4) {
                enemy.body.setCircle(28);
            } else {
                enemy.body.setSize(36, 36);
            }
            enemy.health = chosen.maxHealth;
            enemy.maxHealth = chosen.maxHealth;
            enemy.enemyDamage = chosen.damage;
            enemy.enemyLevel = chosen.level;
            enemy.enemyColor = chosen.color;
            this.enemies.add(enemy);
        }
    }

    hitEnemy(bullet, enemy) {
        // Đảm bảo mỗi viên đạn chỉ gây dame 1 lần cho mỗi enemy
        if (!bullet.hitEnemies) bullet.hitEnemies = new Set();
        if (bullet.hitEnemies.has(enemy)) return;
        bullet.hitEnemies.add(enemy);
        enemy.health -= this.player.bulletDamage;
        if (!this.player.canPierce) {
            bullet.setActive(false).setVisible(false);
        }
        if (enemy.health <= 0) {
            // Âm thanh nổ
            if (this.sfxExplosion) this.sfxExplosion.play({ volume: 0.5 });
            if (enemy.healthBar) enemy.healthBar.destroy();
            enemy.destroy();
            this.gainXP(GameEnum.XP.PER_ENEMY);
            // Spawn new enemy
            this.time.delayedCall(1000, () => this.spawnEnemy(), [], this);
        }
    }

    playerHit(player, enemy) {
        // Chỉ trừ máu nếu hết thời gian miễn thương
        if (!player.lastHitTime || this.time.now - player.lastHitTime > 600) {
            // Lấy damage theo loại bot
            let dmg = enemy.enemyDamage || GameEnum.ENEMY.TYPES[0].damage;
            player.health -= dmg;
            player.lastHitTime = this.time.now;
            if (player.health <= 0) {
                this.scene.restart();
            }
        }
    }

    gainXP(amount) {
        this.xp += amount;
        if (this.xp >= this.xpToLevel && this.level < this.maxLevel) {
            this.xp -= this.xpToLevel;
            this.level++;
            this.upgradePoints++;
            this.xpToLevel = Math.floor(this.xpToLevel * 1.15);
            // Thêm mốc chọn class tank ở level 5
            if (this.level === 5) {
                this.showClassUpgradeUI(5);
            } else if (this.level === 15) {
                this.showClassUpgradeUI(15);
            } else if (this.level === 30) {
                this.showClassUpgradeUI(30);
            } else if (this.level === 45) {
                this.showClassUpgradeUI(45);
            } else {
                this.showUpgradeUI();
            }
        }
        this.xpText.setText(`XP: ${Math.floor(this.xp)} / ${this.xpToLevel}`);
        this.levelText.setText(`Level: ${this.level}`);
    }

    // UI chọn class tank khi đạt mốc level
    showClassUpgradeUI(level) {
        const classOptions = UpgradeConfig.classUpgrades[level] || [];
        for (let i = 0; i < 4; i++) {
            if (classOptions[i]) {
                this.upgradeOptions[i].setText(`${i + 1}. ${classOptions[i].name}: ${classOptions[i].desc}`);
            } else {
                this.upgradeOptions[i].setText('');
            }
        }
        // Gán hàm apply đúng context
        this.currentUpgrades = classOptions.map(opt => ({
            name: opt.name,
            desc: opt.desc,
            apply: () => opt.effect(this.player)
        }));
        this.upgradePanel.setVisible(true);
    }

    showUpgradeUI() {
        // Lấy 4 nâng cấp ngẫu nhiên từ UpgradeConfig
        const upgrades = Phaser.Utils.Array.Shuffle(UpgradeConfig.upgrades).slice(0, 4);
        this.currentUpgrades = upgrades.map(up => {
            return {
                name: up.name,
                desc: up.desc,
                apply: () => {
                    if (up.key === 'maxHealth') {
                        this.player.maxHealth += up.value;
                        this.player.health += up.value;
                    } else if (up.key === 'reloadSpeed') {
                        this.player.reloadSpeed = Math.max(up.min || 80, this.player.reloadSpeed + up.value);
                    } else {
                        this.player[up.key] += up.value;
                    }
                }
            };
        });
        for (let i = 0; i < 4; i++) {
            const up = this.currentUpgrades[i];
            this.upgradeOptions[i].setText(`${i + 1}. ${up.name}: ${up.desc}`);
        }
        this.upgradePanel.setVisible(true);
    }

    chooseUpgrade(idx) {
        if (!this.upgradePanel.visible) return;
        if (this.currentUpgrades && this.currentUpgrades[idx]) {
            this.currentUpgrades[idx].apply();
            this.upgradePanel.setVisible(false);
        }
    }
}
