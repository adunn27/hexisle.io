export const Constant = Object.freeze({
	// Player_Radius, Player_Hp, Player_Speed, Player_Fire_rate, Bullet_speed, Bullet damage
	MAP_WIDTH: 10000,
	MAP_HEIGHT: 10000,
	TEAM_COUNT: 2,
	MAX_PLAYERS: 50, //TODO lower this maybe, I set it high for demo
	RANDOM_LOOP_LIMIT: 10,

	COST: {
		WALL: 5,
		TURRET: 10,
		BUILDING_REFUND_MULTIPLIER: 0.5,
	},

	RADIUS: {
		HEX: 75,
		PLAYER: 50,
		BULLET: 15,
		RESOURCE: 15,
		WALL: 75,
		TURRET: 75,
		BASE: 200,
		CAMP: 75,
		TERRITORY: 500,
		VIEW: 2000,
		CAMP_HEXES: 4,

		COLLISION: {
			PLAYER: 50,
			BULLET: 15,
			WALL: 75 * 0.75,
			TURRET: 75 * 0.75,
			BASE: 200 * 0.75,
			CAMP: 75,
		},

		RANGE: {
			TURRET: 750,
		},
	},

	HP: {
		PLAYER: 100,
		BASE: 1000,
		WALL: 100,
		TURRET: 150,
	},

	RESOURCE: {
		UPDATE_RATE: 1 * 1000,

		INITIAL_RESOURCES: 50,
		MAX_RESOURCES: 150,
		MAX_RESOURCES_PER_UPDATE: 5,

		SPAWN_ATTMEPTS_PER_RESOURCE: 5,

		RESOURCE_ID: [0, 1, 2],
		RESOURCE_RARITY: [0.6, 0.3, 0.1],

		RESOURCE_NAME: {
			0: 'BLUE',
			1: 'GREEN',
			2: 'WHITE',
		},

		DROP_AMOUNT: {
			BLUE: 1,
			GREEN: 2,
			WHITE: 5,
		},
	},

	INCOME: {
		UPDATE_RATE: 5 * 1000,
		INCOME_PER_CAMP: 1,
	},

	TEAM: {
		NONE: -1,
		RED: 0,
		BLUE: 1,
	},

	DIRECTION: {
		E: 0,
		NE: 0.25 * Math.PI,
		N: 0.5 * Math.PI,
		NW: 0.75 * Math.PI,
		W: Math.PI,
		SW: 1.25 * Math.PI,
		S: 1.5 * Math.PI,
		SE: 1.75 * Math.PI,
		INVALID: 10,
	},

	BUILDING: {
		OUT_OF_BOUNDS: 'OUT_OF_BOUNDS',
		NONE: 'NONE',
		WALL: 'WALL',
		TURRET: 'TURRET',
		CAMP: 'CAMP',
		BASE: 'BASE',
		CANT_BUILD: 'CANT_BUILD',
		BOUNDARY: 'BOUNDARY',
	},

	MESSAGE: {
		JOIN_GAME: 'JOIN_GAME',
		JOIN_GAME_SUCCESS: 'JOIN_GAME_SUCCESS',
		JOIN_GAME_FAIL: 'JOIN_GAME_FAIL',
		LEAVE_GAME: 'LEAVE_GAME',
		ASK_GAME_LIST: 'ASK_GAME_LIST',
		GIVE_GAME_LIST: 'GIVE_GAME_LIST',
		START_GAME: 'START_GAME',
		GAME_UPDATE: 'GAME_UPDATE',
		GAME_END: 'GAME_END',
		MOVEMENT: 'MOVEMENT',
		BUILD_STRUCTURE: 'BUILD_STRUCTURE',
		DEMOLISH_STRUCTURE: 'DEMOLISH_STRUCTURE',
		SHOOT: 'SHOOT',
		ROTATE: 'ROTATE',
		RESPAWN: 'RESPAWN',
		INITIALIZE: 'INITIALIZE',
		UPDATE_NAME: 'NEW NAME',
	},

	TIMING: {
		SERVER_GAME_UPDATE: 1000 / 60,
		GAME_END_SCREEN: 5 * 1000,
		GAME_TIME_LIMIT: 15 * (60 * 1000),
	},
});
