import { GameEnum } from '../consts/GameEnum.js';
import { UpgradeConfig } from '../consts/UpgradeConfig.js';

// Phaser is loaded globally via <script> in index.html

export class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.displayedHealth = 0;
        this.displayedXP = 0;
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
        // Thanh máu (HP bar) ở góc trên trái
        this.playerHealthBarX = 16;
        this.playerHealthBarY = 28;
        this.playerHealthBarWidth = 200;
        this.playerHealthBarHeight = 18;
        this.playerHealthBar = this.add.graphics();
        this.playerHealthBar.setDepth(10);
        this.playerHealthBarText = this.add.text(this.playerHealthBarX + this.playerHealthBarWidth / 2, this.playerHealthBarY + this.playerHealthBarHeight / 2, '', { fontSize: '15px', fontFamily: 'Montserrat', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);

        // Thanh XP (và level) ở dưới màn hình, kéo dài 80% chiều rộng
        this.xpBarWidth = Math.floor(this.sys.game.config.width * 0.8);
        this.xpBarHeight = 18;
        this.xpBarX = Math.floor((this.sys.game.config.width - this.xpBarWidth) / 2);
        this.xpBarY = this.sys.game.config.height - 70; // Đẩy lên trên một chút
        this.xpBar = this.add.graphics();
        this.xpBar.setDepth(10);
        this.xpBarText = this.add.text(this.xpBarX + this.xpBarWidth / 2, this.xpBarY + this.xpBarHeight / 2 + 10, '', { fontSize: '15px', fontFamily: 'Montserrat', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
        this.levelBarText = this.add.text(this.xpBarX + this.xpBarWidth / 2, this.xpBarY + 2, '', { fontSize: '16px', fontFamily: 'Montserrat', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5, 0);
        if (this.xpBarTextSmall) this.xpBarTextSmall.destroy();
        // UI nâng cấp chỉ số (góc dưới trái)
        this.statList = [
            { key: 'healthRegen', label: 'Health Regen', color: 0xffc266 },
            { key: 'maxHealth', label: 'Max Health', color: 0xe066ff },
            { key: 'bodyDamage', label: 'Body Damage', color: 0xff66c2 },
            { key: 'bulletSpeed', label: 'Bullet Speed', color: 0x66b3ff },
            { key: 'bulletPen', label: 'Bullet Penetration', color: 0xffe066 },
            { key: 'bulletDamage', label: 'Bullet Damage', color: 0xff6666 },
            { key: 'reloadSpeed', label: 'Reload', color: 0x66ffd9 },
            { key: 'speed', label: 'Movement Speed', color: 0x66ff99 },
        ];
        this.statUpgradePanel = this.add.container(180, 540).setVisible(false); // Góc dưới trái
        // Nền panel nhỏ gọn hơn
        const statBg = this.add.rectangle(0, 0, 220, 310, 0x232347, 0.98).setOrigin(0.5).setStrokeStyle(3, 0x00ffd0);
        this.statUpgradePanel.add(statBg);
        // Hiển thị số điểm nâng cấp còn lại ở góc trên phải, nhỏ hơn
        this.upgradePointText = this.add.text(90, -140, '', {
            fontFamily: 'Montserrat, Arial, sans-serif', fontSize: '28px', fontStyle: 'bold', color: '#fff', stroke: '#232347', strokeThickness: 5
        }).setOrigin(1, 0);
        this.statUpgradePanel.add(this.upgradePointText);
        // Tạo từng dòng chỉ số
        this.statRows = [];
        for (let i = 0; i < this.statList.length; i++) {
            const y = -100 + i * 32;
            // Nền dòng
            const rowBg = this.add.rectangle(0, y, 195, 26, 0x232347, 0.7).setOrigin(0.5).setStrokeStyle(2, 0x222222);
            this.statUpgradePanel.add(rowBg);
            // Label
            const label = this.add.text(-70, y, this.statList[i].label, {
                fontFamily: 'Montserrat, Arial, sans-serif', fontSize: '13px', color: '#fff', fontStyle: 'bold'
            }).setOrigin(0, 0.5);
            this.statUpgradePanel.add(label);
            // Phím tắt
            const keyNum = `[${i + 1}]`;
            const keyText = this.add.text(25, y, keyNum, {
                fontFamily: 'Montserrat, Arial, sans-serif', fontSize: '12px', color: '#fff', fontStyle: 'bold', backgroundColor: '#222', padding: { left: 3, right: 3, top: 1, bottom: 1 }
            }).setOrigin(0.5);
            this.statUpgradePanel.add(keyText);
            // Nút +
            const plusBtn = this.add.rectangle(60, y, 22, 22, this.statList[i].color, 1).setOrigin(0.5).setStrokeStyle(2, 0xffffff).setInteractive({ useHandCursor: true });
            const plusIcon = this.add.text(60, y, '+', { fontFamily: 'Montserrat, Arial, sans-serif', fontSize: '16px', color: '#232347', fontStyle: 'bold' }).setOrigin(0.5);
            plusBtn.on('pointerdown', () => this.tryUpgradeStat(i));
            this.statUpgradePanel.add(plusBtn);
            this.statUpgradePanel.add(plusIcon);
            this.statRows.push({ rowBg, label, keyText, plusBtn, plusIcon });
        }
        // Lắng nghe phím tắt nâng cấp chỉ số (1-8)
        for (let i = 0; i < 8; i++) {
            this.input.keyboard.on(`keydown-${i + 1}`, () => this.tryUpgradeStat(i));
        }
        // Hàm nâng cấp chỉ số qua bảng nhỏ


        // Cập nhật UI bảng nâng cấp chỉ số

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
        this.statsText = this.add.text(16, 100, '', { fontSize: '18px', fill: '#fff', fontFamily: 'Montserrat' });
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

        // Thanh máu (HP bar)
        this.playerHealthBar = this.add.graphics();
        this.playerHealthBar.setDepth(10);
        this.playerHealthBarText = this.add.text(116, 80, '', { fontSize: '15px', fontFamily: 'Montserrat', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
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

        // Ẩn vùng ví ở góc trên khi vào GameScene
        const infoBar = document.getElementById('wallet-info-bar');
        if (infoBar) infoBar.style.display = 'none';
        const walletAddrDiv = document.getElementById('wallet-address');
        if (walletAddrDiv) walletAddrDiv.style.display = 'none';

        // XP/Level UI + Avatar + Địa chỉ ví
        let walletAddress = '';
        if (window.solana && window.solana.isPhantom && window.solana.publicKey) {
            walletAddress = window.solana.publicKey.toString();
        }
        const shortAddr = walletAddress ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}` : '';
        // Avatar Dicebear
        const avatarUrl = walletAddress ? `https://api.dicebear.com/7.x/pixel-art/svg?seed=${walletAddress}` : '';
        // ...existing code...

        // Upgrade UI (ẩn mặc định)
        this.upgradePanel = this.add.container(640, 360).setVisible(false);
        // Nền panel bo góc, bóng đổ
        // Vẽ bóng đổ phía sau panel
        const shadowBg = this.add.rectangle(8, 12, 440, 280, 0x000000, 0.28)
            .setOrigin(0.5)
            .setDepth(9);
        const panelBg = this.add.rectangle(0, 0, 440, 280, 0x232347, 0.98)
            .setStrokeStyle(3, 0x00ffd0)
            .setOrigin(0.5)
            .setDepth(10);

        // Tiêu đề
        this.upgradeText = this.add.text(0, -110, 'Chọn nâng cấp (1-4):', {
            fontFamily: 'Montserrat, Arial, sans-serif',
            fontSize: '26px',
            fontStyle: 'bold',
            color: '#fff',
            align: 'center',
            padding: { left: 0, right: 0, top: 8, bottom: 8 },
            shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 4, fill: true }
        }).setOrigin(0.5);

        // Các lựa chọn nâng cấp
        this.upgradeOptions = [];
        this.upgradeOptionBgs = [];
        for (let i = 0; i < 4; i++) {
            const optBg = this.add.rectangle(0, -35 + i * 55, 370, 44, 0x2e2e5a, 0.92)
                .setStrokeStyle(2, 0x00ffd0)
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true });
            const t = this.add.text(0, -35 + i * 55, '', {
                fontFamily: 'Montserrat, Arial, sans-serif',
                fontSize: '22px',
                color: '#fffa90',
                align: 'center',
                padding: { left: 0, right: 0, top: 6, bottom: 6 },
                wordWrap: { width: 340, useAdvancedWrap: true },
                shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 2, fill: true }
            }).setOrigin(0.5);
            optBg.on('pointerover', () => {
                optBg.setFillStyle(0x00ffd0, 0.18);
                optBg.setStrokeStyle(3, 0xffffff);
                t.setColor('#fff');
            });
            optBg.on('pointerout', () => {
                optBg.setFillStyle(0x2e2e5a, 0.92);
                optBg.setStrokeStyle(2, 0x00ffd0);
                t.setColor('#fffa90');
            });
            optBg.on('pointerdown', () => this.chooseUpgrade(i));
            this.upgradeOptions.push(t);
            this.upgradeOptionBgs.push(optBg);
        }
        // Thêm các thành phần vào đúng thứ tự: shadowBg, panelBg, tiêu đề, các option bg, các option text
        this.upgradePanel.add([shadowBg, panelBg, this.upgradeText, ...this.upgradeOptionBgs, ...this.upgradeOptions]);

        // Collisions
        this.physics.add.overlap(this.bullets, this.enemies, this.hitEnemy, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.playerHit, null, this);

        // Listen for upgrade keys
        this.input.keyboard.on('keydown-ONE', () => this.chooseUpgrade(0));
        this.input.keyboard.on('keydown-TWO', () => this.chooseUpgrade(1));
        this.input.keyboard.on('keydown-THREE', () => this.chooseUpgrade(2));
        this.input.keyboard.on('keydown-FOUR', () => this.chooseUpgrade(3));
    }
    tryUpgradeStat(idx) {
        if (this.upgradePoints > 0 && this.statList[idx]) {
            const key = this.statList[idx].key;
            if (key === 'maxHealth') {
                this.player.maxHealth += 20;
                this.player.health += 20;
            } else if (key === 'reloadSpeed') {
                this.player.reloadSpeed = Math.max(80, this.player.reloadSpeed - 20);
            } else if (key === 'bulletPen') {
                this.player.canPierce = true;
            } else {
                if (typeof this.player[key] === 'number') this.player[key] += 2;
            }
            this.upgradePoints--;
            this.updateStatUpgradePanel();
        }
    }
    updateStatUpgradePanel() {
        if (this.upgradePoints > 0) {
            this.statUpgradePanel.setVisible(true);
            this.upgradePointText.setText('x' + this.upgradePoints);
        } else {
            this.statUpgradePanel.setVisible(false);
        }
    }
    update(time, delta) {
        // Không còn XP text nhỏ dưới thanh
        // Cập nhật địa chỉ ví nếu có thay đổi
        let walletAddress = '';
        if (window.solana && window.solana.isPhantom && window.solana.publicKey) {
            walletAddress = window.solana.publicKey.toString();
        }
        const shortAddr = walletAddress ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}` : '';
        // Hiệu ứng mượt cho máu và xp
        // Thanh máu
        const barWidth = this.playerHealthBarWidth;
        const barHeight = this.playerHealthBarHeight;
        // Tween máu
        if (this.displayedHealth === undefined) this.displayedHealth = this.player.health;
        if (Math.abs(this.displayedHealth - this.player.health) > 0.5) {
            this.displayedHealth += (this.player.health - this.displayedHealth) * Math.min(0.18, delta / 200);
        } else {
            this.displayedHealth = this.player.health;
        }
        // Tween XP
        if (this.displayedXP === undefined) this.displayedXP = this.xp;
        if (Math.abs(this.displayedXP - this.xp) > 0.5) {
            this.displayedXP += (this.xp - this.displayedXP) * Math.min(0.18, delta / 200);
        } else {
            this.displayedXP = this.xp;
        }
        // HP Bar (trên)
        const hpPercent = Phaser.Math.Clamp(this.displayedHealth / this.player.maxHealth, 0, 1);
        this.playerHealthBar.clear();
        this.playerHealthBar.fillStyle(0x000000);
        this.playerHealthBar.fillRect(this.playerHealthBarX, this.playerHealthBarY, barWidth, barHeight);
        this.playerHealthBar.fillStyle(0x00ff00);
        this.playerHealthBar.fillRect(this.playerHealthBarX, this.playerHealthBarY, barWidth * hpPercent, barHeight);
        this.playerHealthBar.lineStyle(2, 0xffffff);
        this.playerHealthBar.strokeRect(this.playerHealthBarX, this.playerHealthBarY, barWidth, barHeight);
        this.playerHealthBarText.setText(`HP: ${Math.floor(this.displayedHealth)} / ${this.player.maxHealth}`);
        this.playerHealthBarText.setPosition(this.playerHealthBarX + barWidth / 2, this.playerHealthBarY + barHeight / 2);

        // XP Bar (dưới)
        const xpPercent = Phaser.Math.Clamp(this.displayedXP / this.xpToLevel, 0, 1);
        this.xpBar.clear();
        this.xpBar.fillStyle(0x222244);
        this.xpBar.fillRect(this.xpBarX, this.xpBarY, this.xpBarWidth, this.xpBarHeight);
        this.xpBar.fillStyle(0x00bfff);
        this.xpBar.fillRect(this.xpBarX, this.xpBarY, this.xpBarWidth * xpPercent, this.xpBarHeight);
        this.xpBar.lineStyle(2, 0xffffff);
        this.xpBar.strokeRect(this.xpBarX, this.xpBarY, this.xpBarWidth, this.xpBarHeight);
        this.xpBarText.setText(`XP: ${Math.floor(this.displayedXP)} / ${this.xpToLevel}`);
        this.xpBarText.setPosition(this.xpBarX + this.xpBarWidth / 2, this.xpBarY + this.xpBarHeight / 2 + 24);
        this.levelBarText.setText(`LV ${this.level}`);
        this.levelBarText.setPosition(this.xpBarX + this.xpBarWidth / 2, this.xpBarY - 24);

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
            // Hiệu ứng đặc biệt theo class
            if (this.player.bulletEffect === 'trail') {
                bullet.setTint(0x00ffff);
                if (!bullet.trailEmitter) {
                    bullet.trailEmitter = this.add.particles('bullet').createEmitter({
                        speed: 0,
                        scale: { start: 0.3, end: 0 },
                        alpha: { start: 0.5, end: 0 },
                        lifespan: 250,
                        follow: bullet,
                        frequency: 30,
                        tint: 0x00ffff
                    });
                }
                bullet.trailEmitter.start();
            } else if (this.player.bulletEffect === 'glow') {
                bullet.setTint(0x00ff00);
                bullet.setAlpha(1);
                bullet.setScale(1.1);
                bullet.setBlendMode(Phaser.BlendModes.ADD);
            } else if (this.player.bulletEffect === 'heavy') {
                bullet.setTint(0xff9900);
                bullet.setScale(1.4);
                bullet.setAlpha(1);
                bullet.setBlendMode(Phaser.BlendModes.NORMAL);
                // Hiệu ứng rung nhẹ
                this.tweens.add({
                    targets: bullet,
                    x: bullet.x + Phaser.Math.Between(-2, 2),
                    y: bullet.y + Phaser.Math.Between(-2, 2),
                    duration: 60,
                    yoyo: true,
                    repeat: 2
                });
            } else {
                bullet.clearTint();
                bullet.setAlpha(1);
                bullet.setScale(1);
                bullet.setBlendMode(Phaser.BlendModes.NORMAL);
                if (bullet.trailEmitter) bullet.trailEmitter.stop();
            }
            bullet.update = function (time, delta) {
                this.lifespan -= delta;
                if (this.lifespan <= 0) {
                    this.setActive(false).setVisible(false);
                    if (this.trailEmitter) this.trailEmitter.stop();
                }
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
            // EXP theo cấp bot
            let exp = 20;
            if (enemy.enemyLevel === 2) exp = 40;
            else if (enemy.enemyLevel === 3) exp = 60;
            else if (enemy.enemyLevel === 4) exp = 100;
            this.gainXP(exp);
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
            // Chỉ hiện dialog chọn class ở các mốc đặc biệt
            if (this.level === 5) {
                this.showClassUpgradeUI(5);
            } else if (this.level === 15) {
                this.showClassUpgradeUI(15);
            } else if (this.level === 30) {
                this.showClassUpgradeUI(30);
            } else if (this.level === 45) {
                this.showClassUpgradeUI(45);
            }
        }
        // ...existing code...
        if (this.updateStatUpgradePanel) this.updateStatUpgradePanel();
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
