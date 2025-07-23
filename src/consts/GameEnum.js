// src/consts/GameEnum.js

export const GameEnum = {
    PLAYER: {
        MAX_HEALTH: 200,
        SPEED: 260,
        BULLET_SPEED: 600,
        BULLET_DAMAGE: 30,
        RELOAD_SPEED: 350,
        HEALTH_REGEN: 4,
        BODY_DAMAGE: 20
    },
    ENEMY: {
        MAX_ON_FIELD: 10,
        SPAWN_ATTEMPT: 2, // số lần thử spawn mỗi lần gọi spawnEnemy
        TYPES: [
            {
                level: 1,
                color: 0xffffff,
                maxHealth: 60,
                damage: 10,
                weight: 50 // tỉ lệ xuất hiện cao nhất
            },
            {
                level: 2,
                color: 0x00bfff,
                maxHealth: 100,
                damage: 18,
                weight: 30
            },
            {
                level: 3,
                color: 0xffa500,
                maxHealth: 180,
                damage: 28,
                weight: 15
            },
            {
                level: 4,
                color: 0xff3333,
                maxHealth: 300,
                damage: 40,
                weight: 5
            }
        ]
    },
    XP: {
        LEVEL_UP: 100,
        MAX_LEVEL: 45,
        PER_ENEMY: 30
    }
};
