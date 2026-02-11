export const MasterData = {
    materials: [
        { id: 'scrap', name: { en: 'Scrap Metal', ja: 'スクラップ' } },
        { id: 'rubber', name: { en: 'Rubber', ja: 'ゴム' } },
        { id: 'circuit', name: { en: 'Circuit', ja: '電子回路' } },
        { id: 'plasma', name: { en: 'Plasma Fluid', ja: 'プラズマ流体' } },
        { id: 'antimatter', name: { en: 'Antimatter', ja: '反物質' } }
    ],
    parts: {
        'engine_basic': {
            id: 'engine_basic',
            name: { en: 'Rusty Engine', ja: '錆びたエンジン' },
            type: 'engine',
            baseVelocity: 10,
            cost: { scrap: 10 },
            synergy: { target: 'booster', mult: 2.0 },
            symbol: 'E1',
            unlockVelocity: 0
        },
        'engine_v2': {
            id: 'engine_v2',
            name: { en: 'V2 Engine', ja: 'V2 エンジン' },
            type: 'engine',
            baseVelocity: 50,
            cost: { scrap: 200, rubber: 50 },
            synergy: { target: 'booster', mult: 2.5 },
            symbol: 'V2',
            unlockVelocity: 50
        },
        'engine_nuclear': {
            id: 'engine_nuclear',
            name: { en: 'Nuclear Engine', ja: '核融合エンジン' },
            type: 'engine',
            baseVelocity: 250,
            cost: { circuit: 100, plasma: 50 },
            synergy: { target: 'booster', mult: 3.0 },
            symbol: 'NE',
            unlockVelocity: 15000
        },
        'wheel_basic': {
            id: 'wheel_basic',
            name: { en: 'Old Tire', ja: '古びたタイヤ' },
            type: 'wheel',
            baseVelocity: 0,
            cost: { scrap: 5, rubber: 5 },
            synergy: { target: 'frame', mult: 1.0 },
            symbol: 'O',
            unlockVelocity: 0,
            effect: { type: 'global', value: 0.1 } // +10%
        },
        'wheel_race': {
            id: 'wheel_race',
            name: { en: 'Racing Tire', ja: 'レーシングタイヤ' },
            type: 'wheel',
            baseVelocity: 5,
            cost: { rubber: 100, scrap: 50 },
            synergy: { target: 'frame', mult: 1.2 },
            symbol: '(@)',
            unlockVelocity: 200,
            effect: { type: 'global', value: 0.2 } // +20%
        },
        'frame_basic': {
            id: 'frame_basic',
            name: { en: 'Steel Frame', ja: 'スチールフレーム' },
            type: 'frame',
            baseVelocity: 0,
            cost: { scrap: 5 },
            synergy: {},
            symbol: '+',
            unlockVelocity: 0,
            effect: { type: 'adj_buff', value: 1.2 } // x1.2
        },
        'frame_light': {
            id: 'frame_light',
            name: { en: 'Carbon Frame', ja: 'カーボンフレーム' },
            type: 'frame',
            baseVelocity: 0,
            cost: { scrap: 100, circuit: 10 },
            synergy: {},
            symbol: '#',
            unlockVelocity: 1000,
            effect: { type: 'adj_buff', value: 1.5 } // x1.5 (Stronger than Steel)
        },
        'frame_alien': {
            id: 'frame_alien',
            name: { en: 'Alien Alloy', ja: 'エイリアン合金' },
            type: 'frame',
            baseVelocity: 0,
            cost: { plasma: 200, antimatter: 10 },
            synergy: {},
            symbol: 'X',
            unlockVelocity: 50000,
            effect: { type: 'adj_buff', value: 2.0 } // x2.0
        },
        'booster_basic': {
            id: 'booster_basic',
            name: { en: 'Nitro Injector', ja: 'ニトロ噴射機' },
            type: 'booster',
            baseVelocity: 0,
            cost: { scrap: 50, circuit: 1 },
            synergy: {},
            symbol: '>>',
            unlockVelocity: 100,
            effect: { type: 'adj_buff', value: 2.0 } // x2.0
        },
        'booster_plasma': {
            id: 'booster_plasma',
            name: { en: 'Plasma Thruster', ja: 'プラズアスラスター' },
            type: 'booster',
            baseVelocity: 0,
            cost: { circuit: 50, plasma: 10 },
            synergy: {},
            symbol: '>>>',
            unlockVelocity: 5000,
            effect: { type: 'adj_buff', value: 3.0 } // x3.0
        },
        'booster_antimatter': {
            id: 'booster_antimatter',
            name: { en: 'Warp Injector', ja: 'ワープインジェクター' },
            type: 'booster',
            baseVelocity: 0,
            cost: { antimatter: 50 },
            synergy: {},
            symbol: '>>>+',
            unlockVelocity: 100000,
            effect: { type: 'adj_buff', value: 5.0 } // x5.0 (Massive)
        }
    },
    areas: [
        {
            id: 'area_junkyard',
            name: { en: 'Scrap Yard', ja: 'スクラップ置き場' },
            threshold: 0,
            primaryDrop: 'scrap',
            bgGradient: 'linear-gradient(90deg, #111, #332, #111)'
        },
        {
            id: 'area_highway',
            name: { en: 'Abandoned Highway', ja: '放棄されたハイウェイ' },
            threshold: 100,
            primaryDrop: 'rubber',
            bgGradient: 'linear-gradient(90deg, #112, #224, #112)'
        },
        {
            id: 'area_city',
            name: { en: 'Cyber City', ja: 'サイバーシティ' },
            threshold: 2000,
            primaryDrop: 'circuit',
            bgGradient: 'linear-gradient(90deg, #102, #305, #102)'
        },
        {
            id: 'area_space',
            name: { en: 'Orbital Elevator', ja: '軌道エレベーター' },
            threshold: 10000,
            primaryDrop: 'plasma',
            bgGradient: 'linear-gradient(90deg, #000, #001, #000)'
        },
        {
            id: 'area_blackhole',
            name: { en: 'Event Horizon', ja: '事象の地平線' },
            threshold: 100000,
            primaryDrop: 'antimatter',
            bgGradient: 'linear-gradient(90deg, #000, #204, #000)'
        }
    ],
    techs: {
        'tech_eng_eff_1': {
            id: 'tech_eng_eff_1',
            name: { en: 'Engine Tuning I', ja: 'エンジンチューニング I' },
            desc: { en: 'Engines +10% Base Velocity', ja: 'エンジンの基礎速度 +10%' },
            cost: { scrap: 500 },
            req: [],
            effect: { type: 'engine_mult', value: 1.1 }
        },
        'tech_eng_eff_2': {
            id: 'tech_eng_eff_2',
            name: { en: 'Engine Tuning II', ja: 'エンジンチューニング II' },
            desc: { en: 'Engines +20% Base Velocity', ja: 'エンジンの基礎速度 +20%' },
            cost: { scrap: 2000, rubber: 500 },
            req: ['tech_eng_eff_1'],
            effect: { type: 'engine_mult', value: 1.2 }
        },
        'tech_boost_syn_1': {
            id: 'tech_boost_syn_1',
            name: { en: 'High Octane', ja: 'ハイオク燃料' },
            desc: { en: 'Booster Synergy +50% (x2.0 -> x2.5)', ja: 'ブースターシナジー強化 (x2.0 -> x2.5)' },
            cost: { rubber: 1000, circuit: 100 },
            req: ['tech_eng_eff_1'],
            effect: { type: 'booster_buff', value: 0.5 }
        },
        'tech_global_1': {
            id: 'tech_global_1',
            name: { en: 'Aerodynamics', ja: '空気力学' },
            desc: { en: 'Global Velocity +10%', ja: '全体の速度 +10%' },
            cost: { circuit: 500 },
            req: ['tech_eng_eff_2'],
            effect: { type: 'global_mult', value: 1.1 }
        },
        'tech_nuclear_impro': {
            id: 'tech_nuclear_impro',
            name: { en: 'Reactor Shielding', ja: '原子炉遮蔽' },
            desc: { en: 'Nuclear Engine Cost -20%', ja: '核融合エンジンのコスト -20%' },
            cost: { plasma: 200 },
            req: ['tech_global_1'],
            effect: { type: 'cost_reduc', target: 'engine_nuclear', value: 0.8 }
        }
    }
};
