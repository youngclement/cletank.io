// src/consts/UpgradeConfig.js

export const UpgradeConfig = {
    upgrades: [
        { key: 'bulletSpeed', name: 'Bullet Speed', desc: 'Tăng tốc độ bay của đạn', value: 80 },
        { key: 'bulletDamage', name: 'Bullet Damage', desc: 'Tăng sát thương', value: 8 },
        { key: 'reloadSpeed', name: 'Reload Speed', desc: 'Tăng tốc độ bắn', value: -30, min: 80 },
        { key: 'healthRegen', name: 'Health Regen', desc: 'Tăng tốc độ hồi máu', value: 5 },
        { key: 'maxHealth', name: 'Max Health', desc: 'Tăng lượng máu tối đa', value: 40 },
        { key: 'speed', name: 'Movement Speed', desc: 'Di chuyển nhanh hơn', value: 40 },
        { key: 'bodyDamage', name: 'Body Damage', desc: 'Gây sát thương khi va chạm', value: 10 },
    ],
    classUpgrades: {
        5: [
            { key: 'Basic', name: 'Basic Tank', desc: 'Bắn đạn đơn', effect: player => { player.tankClass = 'Basic'; } },
            { key: 'Speed', name: 'Speed Tank', desc: 'Tăng tốc độ di chuyển', effect: player => { player.tankClass = 'Speed'; player.speed += 80; } },
            { key: 'Regen', name: 'Regen Tank', desc: 'Tăng hồi máu', effect: player => { player.tankClass = 'Regen'; player.healthRegen += 10; } },
            { key: 'Heavy', name: 'Heavy Tank', desc: 'Tăng máu tối đa', effect: player => { player.tankClass = 'Heavy'; player.maxHealth += 100; player.health += 100; } },
        ],
        15: [
            { key: 'Twin', name: 'Twin', desc: 'Bắn 2 đạn, đạn xuyên', effect: player => { player.tankClass = 'Twin'; player.canPierce = true; } },
            { key: 'Sniper', name: 'Sniper', desc: 'Tăng tầm xa', effect: player => { player.tankClass = 'Sniper'; player.bulletSpeed += 200; } },
            { key: 'MachineGun', name: 'Machine Gun', desc: 'Tốc độ bắn cao', effect: player => { player.tankClass = 'Machine Gun'; player.reloadSpeed = Math.max(50, player.reloadSpeed - 100); } },
        ],
        30: [
            { key: 'Triplet', name: 'Triplet', desc: 'Bắn 3 hướng, đạn xuyên', effect: player => { player.tankClass = 'Triplet'; player.canPierce = true; } },
            { key: 'Overseer', name: 'Overseer', desc: 'Drone', effect: player => { player.tankClass = 'Overseer'; } },
            { key: 'Destroyer', name: 'Destroyer', desc: 'Đạn lớn, đạn xuyên', effect: player => { player.tankClass = 'Destroyer'; player.bulletDamage += 40; player.canPierce = true; } },
        ],
        45: [
            { key: 'Hybrid', name: 'Hybrid', desc: 'Tăng sức mạnh toàn diện, đạn xuyên', effect: player => { player.tankClass = 'Hybrid'; player.bulletDamage += 30; player.maxHealth += 100; player.speed += 60; player.canPierce = true; } },
            { key: 'Necromancer', name: 'Necromancer', desc: 'Gọi minion', effect: player => { player.tankClass = 'Necromancer'; } },
            { key: 'Gunner', name: 'Gunner', desc: 'Bắn nhanh', effect: player => { player.tankClass = 'Gunner'; player.reloadSpeed = Math.max(30, player.reloadSpeed - 120); } },
        ]
    }
};
