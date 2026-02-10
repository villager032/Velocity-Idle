export const MasterData = {
    materials: [
        { id: 'scrap', name: 'Scrap Metal' },
        { id: 'rubber', name: 'Rubber' },
        { id: 'circuit', name: 'Circuit' },
        { id: 'plasma', name: 'Plasma Fluid' }
    ],
    parts: {
        'engine_basic': {
            id: 'engine_basic',
            name: 'Rusty Engine',
            type: 'engine',
            baseVelocity: 10,
            cost: { scrap: 10 },
            synergy: { target: 'booster', mult: 2.0 },
            symbol: 'E1',
            unlockVelocity: 0
        },
        'engine_v2': {
            id: 'engine_v2',
            name: 'V2 Engine',
            type: 'engine',
            baseVelocity: 50,
            cost: { scrap: 200, rubber: 50 },
            synergy: { target: 'booster', mult: 2.5 },
            symbol: 'V2',
            unlockVelocity: 50
        },
        'wheel_basic': {
            id: 'wheel_basic',
            name: 'Old Tire',
            type: 'wheel',
            baseVelocity: 0,
            cost: { scrap: 5, rubber: 5 },
            synergy: { target: 'frame', mult: 1.0 },
            symbol: 'O',
            unlockVelocity: 0
        },
        'wheel_race': {
            id: 'wheel_race',
            name: 'Racing Tire',
            type: 'wheel',
            baseVelocity: 5,
            cost: { rubber: 100, scrap: 50 },
            synergy: { target: 'frame', mult: 1.2 },
            symbol: '(@)',
            unlockVelocity: 200
        },
        'frame_basic': {
            id: 'frame_basic',
            name: 'Steel Frame',
            type: 'frame',
            baseVelocity: 0,
            cost: { scrap: 5 },
            synergy: {},
            symbol: '+',
            unlockVelocity: 0
        },
        'frame_light': {
            id: 'frame_light',
            name: 'Carbon Frame',
            type: 'frame',
            baseVelocity: 0,
            cost: { scrap: 100, circuit: 10 },
            synergy: {},
            symbol: '#',
            unlockVelocity: 1000
        },
        'booster_basic': {
            id: 'booster_basic',
            name: 'Nitro Injector',
            type: 'booster',
            baseVelocity: 0,
            cost: { scrap: 50, circuit: 1 },
            synergy: {},
            symbol: '>>',
            unlockVelocity: 100
        },
        'booster_plasma': {
            id: 'booster_plasma',
            name: 'Plasma Thruster',
            type: 'booster',
            baseVelocity: 0,
            cost: { circuit: 50, plasma: 10 },
            synergy: {},
            symbol: '>>>',
            unlockVelocity: 5000
        }
    },
    areas: [
        {
            id: 'area_junkyard',
            name: 'Scrap Yard',
            threshold: 0,
            primaryDrop: 'scrap',
            bgGradient: 'linear-gradient(90deg, #111, #332, #111)'
        },
        {
            id: 'area_highway',
            name: 'Abandoned Highway',
            threshold: 100,
            primaryDrop: 'rubber',
            bgGradient: 'linear-gradient(90deg, #112, #224, #112)'
        },
        {
            id: 'area_city',
            name: 'Cyber City',
            threshold: 2000,
            primaryDrop: 'circuit',
            bgGradient: 'linear-gradient(90deg, #102, #305, #102)'
        },
        {
            id: 'area_space',
            name: 'Orbital Elevator',
            threshold: 10000,
            primaryDrop: 'plasma',
            bgGradient: 'linear-gradient(90deg, #000, #001, #000)'
        }
    ]
};
