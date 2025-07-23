

import { connectSolanaWallet } from './solanaWallet.js';
import { Start } from './scenes/Start.js';
import { GameScene } from './scenes/GameScene.js';

const config = {
    type: Phaser.AUTO,
    title: 'Overlord Rising',
    description: '',
    parent: 'game-container',
    width: 1280,
    height: 720,
    backgroundColor: '#000000',
    pixelArt: false,
    scene: [
        Start,
        GameScene
    ],
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
}

new Phaser.Game(config);

// Xử lý nút kết nối ví
window.addEventListener('DOMContentLoaded', () => {
    // Auto connect wallet nếu user đã từng approve
    if (window.solana && window.solana.isPhantom) {
        window.solana.connect({ onlyIfTrusted: true }).then(() => {
            connectSolanaWallet();
        });
    }
    const btn = document.getElementById('connect-wallet-btn');
    if (btn) {
        btn.addEventListener('click', connectSolanaWallet);
    }
});
