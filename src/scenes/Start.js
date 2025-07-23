export class Start extends Phaser.Scene {

    constructor() {
        super('Start');
    }

    preload() {
        this.load.image('background', 'assets/space.png');
        this.load.image('logo', 'assets/phaser.png');

        //  The ship sprite is CC0 from https://ansimuz.itch.io - check out his other work!
        this.load.spritesheet('ship', 'assets/spaceship.png', { frameWidth: 176, frameHeight: 96 });
    }

    create() {
        this.background = this.add.tileSprite(640, 360, 1280, 720, 'background');

        const logo = this.add.image(640, 200, 'logo');

        const ship = this.add.sprite(640, 360, 'ship');

        ship.anims.create({
            key: 'fly',
            frames: this.anims.generateFrameNumbers('ship', { start: 0, end: 2 }),
            frameRate: 15,
            repeat: -1
        });

        ship.play('fly');

        this.tweens.add({
            targets: logo,
            y: 400,
            duration: 1500,
            ease: 'Sine.inOut',
            yoyo: true,
            loop: -1
        });

        // Thêm hướng dẫn và sự kiện chuyển scene

        // Container div để căn giữa cụm nút/info
        const wrapper = document.createElement('div');
        wrapper.style.position = 'absolute';
        wrapper.style.left = '50%';
        wrapper.style.top = '60%';
        wrapper.style.transform = 'translate(-50%, -50%)';
        wrapper.style.display = 'flex';
        wrapper.style.flexDirection = 'column';
        wrapper.style.alignItems = 'center';
        wrapper.style.gap = '24px';
        wrapper.id = 'wallet-ui-wrapper';
        document.body.appendChild(wrapper);

        // Nút connect ví
        const connectBtn = document.createElement('button');
        connectBtn.innerText = 'Kết nối ví Solana';
        connectBtn.style.padding = '16px 48px';
        connectBtn.style.fontSize = '28px';
        connectBtn.style.fontFamily = 'Montserrat';
        connectBtn.style.borderRadius = '12px';
        connectBtn.style.background = '#2e7d32';
        connectBtn.style.color = '#fff';
        connectBtn.style.border = 'none';
        connectBtn.style.cursor = 'pointer';
        wrapper.appendChild(connectBtn);

        // Nút chơi (ẩn ban đầu)
        const playBtn = document.createElement('button');
        playBtn.innerText = 'Chơi ngay';
        playBtn.style.padding = '16px 48px';
        playBtn.style.fontSize = '28px';
        playBtn.style.fontFamily = 'Montserrat';
        playBtn.style.borderRadius = '12px';
        playBtn.style.background = '#1976d2';
        playBtn.style.color = '#fff';
        playBtn.style.border = 'none';
        playBtn.style.cursor = 'pointer';
        playBtn.style.display = 'none';
        wrapper.appendChild(playBtn);

        // Thông tin ví (ẩn ban đầu)
        const walletInfo = document.createElement('div');
        walletInfo.style.display = 'none';
        walletInfo.style.flexDirection = 'column';
        walletInfo.style.alignItems = 'center';
        walletInfo.style.gap = '8px';
        wrapper.appendChild(walletInfo);

        // Avatar + địa chỉ + logout
        const avatarImg = document.createElement('img');
        avatarImg.style.width = '56px';
        avatarImg.style.height = '56px';
        avatarImg.style.borderRadius = '50%';
        avatarImg.style.border = '2px solid #1976d2';
        avatarImg.style.background = '#fff';
        const addrSpan = document.createElement('span');
        addrSpan.style.fontFamily = 'Montserrat';
        addrSpan.style.fontWeight = 'bold';
        addrSpan.style.fontSize = '20px';
        addrSpan.style.color = '#222';
        const logoutBtn = document.createElement('button');
        logoutBtn.innerText = 'Đăng xuất';
        logoutBtn.style.marginTop = '4px';
        logoutBtn.style.padding = '8px 24px';
        logoutBtn.style.fontSize = '18px';
        logoutBtn.style.fontFamily = 'Montserrat';
        logoutBtn.style.borderRadius = '8px';
        logoutBtn.style.background = '#e53935';
        logoutBtn.style.color = '#fff';
        logoutBtn.style.border = 'none';
        logoutBtn.style.cursor = 'pointer';
        walletInfo.appendChild(avatarImg);
        walletInfo.appendChild(addrSpan);
        walletInfo.appendChild(logoutBtn);

        // Kiểm tra đã kết nối ví chưa
        const isWalletConnected = () => window.solana && window.solana.isPhantom && window.solana.publicKey;

        // Cập nhật UI khi connect/disconnect
        const updateUI = () => {
            if (isWalletConnected()) {
                connectBtn.style.display = 'none';
                playBtn.style.display = '';
                walletInfo.style.display = 'flex';
                const address = window.solana.publicKey.toString();
                addrSpan.innerText = address.slice(0, 6) + '...' + address.slice(-4);
                avatarImg.src = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${address}`;
            } else {
                connectBtn.style.display = '';
                playBtn.style.display = 'none';
                walletInfo.style.display = 'none';
            }
        };
        updateUI();

        connectBtn.onclick = async () => {
            if (window.solana && window.solana.isPhantom) {
                try {
                    await window.solana.connect();
                    updateUI();
                } catch (e) {
                    this.add.text(640, 650, 'Kết nối ví thất bại!', { fontSize: '22px', fill: '#ff5252', fontFamily: 'Montserrat' }).setOrigin(0.5);
                }
            } else {
                window.open('https://phantom.app/', '_blank');
            }
        };

        playBtn.onclick = () => {
            if (isWalletConnected()) {
                // Xóa UI trước khi vào game
                wrapper.remove();
                this.scene.start('GameScene');
            }
        };

        logoutBtn.onclick = () => {
            if (window.solana && window.solana.isPhantom) {
                window.solana.disconnect();
                updateUI();
            }
        };
    }

    update() {
        this.background.tilePositionX += 2;
    }

}
