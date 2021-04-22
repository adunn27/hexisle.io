import io from 'socket.io-client';
import { HexTiles, OffsetPoint, Tile, Point } from './../../shared/hexTiles';

import { Constant } from './../../shared/constants';

export default class MainScene extends Phaser.Scene {
	private myPlayerSprite: Phaser.GameObjects.Sprite;
	private otherPlayerSprites: Map<string, Phaser.GameObjects.Sprite>;
	private bulletSprites: Map<string, Phaser.GameObjects.Sprite>;
	private wallSprites: Map<string, Phaser.GameObjects.Sprite>;
	private turretSprites: Map<string, Phaser.GameObjects.Sprite>;
	private campfireSprites: Map<string, Phaser.GameObjects.Sprite>;
	private baseSprites: Map<string, Phaser.GameObjects.Sprite>;
	private cursors /*:Phaser.Types.Input.Keyboard.CursorKeys*/;
	private socket: SocketIOClient.Socket;
	private alive: boolean;
	private deadObjects: Set<unknown>;
	private territorySprites: Map<string, Phaser.GameObjects.Sprite>;
	private hexTiles: HexTiles;
	private initialized: boolean;

	constructor() {
		super('MainScene');
	}

	preload(): void {
		// Players
		this.load.spritesheet('player_red', '../assets/player_red.png', {
			frameWidth: 94,
			frameHeight: 120,
		});
		this.load.spritesheet('player_blue', '../assets/player_blue.png', {
			frameWidth: 94,
			frameHeight: 120,
		});

		// Team Bases
		this.load.spritesheet('base_red', '../assets/base_red.png', {
			frameWidth: 385,
			frameHeight: 400,
		});
		this.load.spritesheet('base_blue', '../assets/base_blue.png', {
			frameWidth: 385,
			frameHeight: 400,
		});

		// Walls
		this.load.spritesheet('wall_red', '../assets/wall_red.png', {
			frameWidth: 154,
			frameHeight: 134,
		});
		this.load.spritesheet('wall_blue', '../assets/wall_blue.png', {
			frameWidth: 154,
			frameHeight: 134,
		});

		// Turrets
		this.load.spritesheet(
			'turret_base_red',
			'../assets/turret_base_red.png',
			{
				frameWidth: 154,
				frameHeight: 134,
			}
		);
		this.load.spritesheet(
			'turret_base_blue',
			'../assets/turret_base_blue.png',
			{
				frameWidth: 154,
				frameHeight: 134,
			}
		);
		this.load.spritesheet(
			'turret_shooter',
			'../assets/turret_shooter.png',
			{
				frameWidth: 154,
				frameHeight: 134,
			}
		);

		// Static Images
		this.load.image('bullet', '../assets/bullet.png');
		this.load.image('bulletblue', '../assets/bulletblue.png');
		this.load.image('campfire_unlit', '../assets/campfire_unlit.png');
		this.load.image('campfire_lit', '../assets/campfire_lit.png');
		this.load.image(
			'texture',
			'../assets/Texture - Mossy Floor - Green 2.jpg'
		);
	}

	init(): void {
		this.initializeKeys();
		this.generatePlayerSprite();

		this.hexTiles = new HexTiles();
		this.otherPlayerSprites = new Map();
		this.bulletSprites = new Map();
		this.wallSprites = new Map();
		this.turretSprites = new Map();
		this.campfireSprites = new Map();
		this.baseSprites = new Map();
		this.territorySprites = new Map();
		this.deadObjects = new Set();

		this.socket = io();
	}

	create(): void {
		this.game.canvas.oncontextmenu = function (e) {
			e.preventDefault();
		};
		this.registerListeners();
		this.registerIntervals();

		this.socket.emit(Constant.MESSAGE.JOIN);
	}

	update(): void {
		this.updateDirection();
		//this.updateMovementDirection();
	}

	private generatePlayerSprite(): void {
		this.myPlayerSprite = this.add.sprite(0, 0, 'player_red');
		this.myPlayerSprite.setDepth(1000);
		this.myPlayerSprite.setVisible(false);
		this.myPlayerSprite.setScale(1);
	}

	private initializeKeys(): void {
		this.cursors = this.input.keyboard.addKeys({
			up: Phaser.Input.Keyboard.KeyCodes.W,
			down: Phaser.Input.Keyboard.KeyCodes.S,
			left: Phaser.Input.Keyboard.KeyCodes.A,
			right: Phaser.Input.Keyboard.KeyCodes.D,
			buildWall: Phaser.Input.Keyboard.KeyCodes.E,
			buildTurret: Phaser.Input.Keyboard.KeyCodes.Q,
			demolishStructure: Phaser.Input.Keyboard.KeyCodes.R,
		});
	}

	private registerListeners(): void {
		this.registerSocketListeners();
		this.registerInputListeners();
	}

	private registerSocketListeners(): void {
		this.socket.on(
			Constant.MESSAGE.INITIALIZE,
			this.initializeGame.bind(this)
		);

		this.socket.on(
			Constant.MESSAGE.GAME_UPDATE,
			this.updateState.bind(this)
		);

		this.socket.on(Constant.MESSAGE.GAME_END, this.endGame.bind(this));
	}

	private registerInputListeners(): void {
		this.input.on('pointerdown', (pointer) => {
			if (!this.alive) return;
			const direction = this.getMouseDirection(pointer);

			this.socket.emit(Constant.MESSAGE.SHOOT, direction);
		});

		this.input.keyboard.on(
			'keydown',
			this.updateMovementDirection.bind(this)
		);

		this.input.keyboard.on(
			'keyup',
			this.updateMovementDirection.bind(this)
		);
	}

	private registerIntervals(): void {
		//setInterval(() => {
		//	this.updateDirection();
		//}, 1000 / 60);
	}

	private updateDirection() {
		if (!this.alive) {
			this.myPlayerSprite.setRotation(0);
			this.socket.emit(Constant.MESSAGE.ROTATE, 0);
			return;
		}

		const direction =
			this.getMouseDirection(this.input.mousePointer) - Math.PI * 0.5;

		this.myPlayerSprite.setRotation(direction);
		this.socket.emit(Constant.MESSAGE.ROTATE, direction);
	}

	private getMouseDirection(pointer: any): any {
		const gamePos = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

		return Math.atan2(
			gamePos.y - this.myPlayerSprite.y,
			gamePos.x - this.myPlayerSprite.x
		);
	}

	private initializeGame(update: any): void {
		const { player, tileMap } = update;
		if (player == null) return;

		if (this.initialized != true) {
			this.createTileMap(tileMap);
			this.setCamera();
		}
		this.initializePlayer(player);

		this.initialized = true;
	}

	private initializePlayer(player: any): void {
		// Change this when more than 2 teams
		if (player.teamNumber == Constant.TEAM.RED)
			this.myPlayerSprite.setTexture('player_red');
		else if (player.teamNumber == Constant.TEAM.BLUE)
			this.myPlayerSprite.setTexture('player_blue');

		this.alive = true;
	}

	private setCamera(): void {
		this.cameras.main.startFollow(this.myPlayerSprite, true);
		this.cameras.main.setZoom(0.75);
	}

	private createTileMap(tileMap: any) {
		this.hexTiles.tileMap = tileMap;
		const graphic_Map = this.add.graphics();

		// masking logic
		this.add
			.image(0, 0, 'texture')
			.setOrigin(0, 0)
			.setDepth(-1)
			.setScale(3);

		this.drawAllTiles(graphic_Map);

		this.generateTerritoryTexture(this.hexTiles.tileMap[0][0]);
		graphic_Map.generateTexture(
			'hexMap',
			Constant.MAP_WIDTH,
			Constant.MAP_HEIGHT
		);

		this.add.sprite(0, 0, 'hexMap').setOrigin(0, 0).setDepth(-1);
		graphic_Map.destroy();
	}

	// draws every arena/map hex we have in our tilemap
	drawAllTiles(graphic_Map): void {
		if (!this.hexTiles.tileMap) return;

		for (let col = 0; col < this.hexTiles.tileMap.length; col++) {
			for (let row = 0; row < this.hexTiles.tileMap[col].length; row++) {
				if (
					this.hexTiles.tileMap[col][row].building !=
						Constant.BUILDING.OUT_OF_BOUNDS &&
					this.hexTiles.tileMap[col][row].building !=
						Constant.BUILDING.BOUNDARY
				) {
					//TODO cannot put isInBounds here?
					this.drawTile(this.hexTiles.tileMap[col][row], graphic_Map);
				}
			}
		}
	}

	// takes XY coordinates of center point, generates all required vertices, draws individual tile
	drawTile(tile: Tile, graphics: Phaser.GameObjects.Graphics): void {
		if (tile.building == Constant.BUILDING.OUT_OF_BOUNDS) return;

		graphics.fillStyle(0x000000, 0);

		const points: Point[] = this.hexTiles.getHexPointsFromCenter(
			tile.cartesian_coord
		);

		graphics.lineStyle(2, 0xffffff, 1);
		if (tile.building == Constant.BUILDING.CAMP)
			graphics.lineStyle(5, 0xffffff, 1);

		this.drawGraphics(points, graphics);

		graphics.fillPath();
		graphics.strokePath();
	}

	drawGraphics(points: Point[], graphics: Phaser.GameObjects.Graphics) {
		graphics.beginPath();
		graphics.moveTo(points[0].xPos, points[0].yPos);
		for (let i = 0; i < 6; i++) {
			graphics.lineTo(points[i].xPos, points[i].yPos);
		}
		graphics.closePath();
	}

	// takes XY coordinates of center point, generates all required vertices, draws individual tile
	generateTerritoryTexture(tile: Tile): void {
		const points: Point[] = this.hexTiles.getHexPointsFromCenter(
			tile.cartesian_coord
		);

		let colorName = '';
		for (let i = 0; i < Constant.TEAM_COUNT; i++) {
			const graphics = this.add.graphics();

			this.drawGraphics(points, graphics);

			if (i == 0) {
				graphics.fillStyle(0xff0000, 0.2);
				graphics.lineStyle(4, 0xff0000, 0.2);
				colorName = 'red-territory';
			} else if (i == 1) {
				graphics.fillStyle(0x3333ff, 0.2);
				graphics.lineStyle(4, 0x3333ff, 0.2);
				colorName = 'blue-territory';
			}

			graphics.fillPath();

			graphics.generateTexture(
				colorName,
				this.hexTiles.getHexWidth(),
				this.hexTiles.getHexHeight()
			);

			graphics.destroy();
		}
	}

	// Masking, Alpha Mask
	// Masks the texture image using the total hexagonal tile map
	setMapMask(
		reveal: Phaser.GameObjects.Image,
		graphic_Map: Phaser.GameObjects.Graphics
	): void {
		const hexBrush = graphic_Map.createGeometryMask();
		reveal.setMask(hexBrush);
	}

	// Animation control
	private handleWalkAnimation(
		player: Phaser.GameObjects.Sprite,
		playerTextureName: string,
		xVel: number,
		yVel: number
	) {
		// Create local animation on each sprite if it doesn't exist
		// player texture name refers to 'player_red', 'player_blue', etc which is the loaded spritesheet key
		if (!player.anims.get(playerTextureName + '_walk')) {
			player.anims.create({
				key: playerTextureName + '_walk',
				frames: this.anims.generateFrameNames(playerTextureName, {
					start: 0,
					end: 3,
				}),
				frameRate: 8,
				repeat: -1,
			});
			player.anims.play(playerTextureName + '_walk');
			player.anims.pause();
		}

		if (player.anims.currentAnim.key != playerTextureName + '_walk') {
			// Update anims internal isPlaying/isPaused variables, and loaded anim.
			player.anims.stop();
			player.anims.play(playerTextureName + '_walk');
			player.anims.pause();
		}

		// Use overall player velocity to continue animation
		if (xVel != 0 || yVel != 0) {
			if (player.anims.isPaused) {
				player.anims.resume();
			}
		} else {
			if (player.anims.isPlaying) {
				player.anims.pause();
			}
		}

		return player;
	}

	private handleDeathAnimation(
		player: Phaser.GameObjects.Sprite,
		playerTextureName: string
	) {
		player.setRotation(0);
		// Create local animation on each sprite if it doesn't exist
		// player texture name refers to 'player_red', 'player_blue', etc which is the loaded spritesheet key
		if (!player.anims.get(playerTextureName + '_death')) {
			player.anims.create({
				key: playerTextureName + '_death',
				frames: this.anims.generateFrameNames(playerTextureName, {
					start: 4,
					end: 12,
				}),
				frameRate: 8,
				hideOnComplete: true,
			});
		}
		if (player.anims.currentAnim.key == playerTextureName + '_walk') {
			player.anims.stop();
			player.anims.play(playerTextureName + '_death', true);
		}
		return player;
	}

	private handleDamageAnimation(
		structureSprite: Phaser.GameObjects.Sprite,
		structureTextureName: string,
		healthPercent: number
	) {
		// Every structure (Wall/Turret/Base) has 4 states or frames.
		// Create local animation and load by playing and pausing the animation.
		// Sets the required frame based on health %

		if (!structureSprite.anims.get(structureTextureName + '_destroying')) {
			structureSprite.anims.create({
				key: structureTextureName + '_destroying',
				frames: this.anims.generateFrameNames(structureTextureName),
				frameRate: 1,
				repeat: -1,
			});

			// Update anims internal isPlaying/isPaused variables, and loaded anim.
			structureSprite.anims.play(structureTextureName + '_destroying');
			structureSprite.anims.pause();
		}

		// Use overall player health to continue animation
		if (healthPercent >= 0.75) {
			structureSprite.anims.setProgress(0);
		} else if (healthPercent >= 0.5) {
			structureSprite.anims.setProgress(1 / 3);
		} else if (healthPercent >= 0.25) {
			structureSprite.anims.setProgress(2 / 3);
		} else if (healthPercent > 0.0) {
			structureSprite.anims.setProgress(1);
		}

		return structureSprite;
	}

	calculateDirection() {
		let direction = NaN;
		if (this.cursors.left.isDown && !this.cursors.right.isDown) {
			if (this.cursors.up.isDown && !this.cursors.down.isDown)
				direction = Constant.DIRECTION.NW;
			else if (this.cursors.down.isDown && !this.cursors.up.isDown)
				direction = Constant.DIRECTION.SW;
			else direction = Constant.DIRECTION.W;
		} else if (this.cursors.right.isDown && !this.cursors.left.isDown) {
			if (this.cursors.up.isDown && !this.cursors.down.isDown)
				direction = Constant.DIRECTION.NE;
			else if (this.cursors.down.isDown && !this.cursors.up.isDown)
				direction = Constant.DIRECTION.SE;
			else direction = Constant.DIRECTION.E;
		} else {
			if (this.cursors.up.isDown && !this.cursors.down.isDown)
				direction = Constant.DIRECTION.N;
			else if (this.cursors.down.isDown && !this.cursors.up.isDown)
				direction = Constant.DIRECTION.S;
		}
		return direction;
	}

	private updateMovementDirection(): void {
		if (!this.alive) return;
		const direction = this.calculateDirection();

		this.socket.emit(Constant.MESSAGE.MOVEMENT, direction);

		const gamePos = this.cameras.main.getWorldPoint(
			this.input.mousePointer.x,
			this.input.mousePointer.y
		);

		const coord: OffsetPoint = this.hexTiles.cartesianToOffset(
			new Point(gamePos.x, gamePos.y)
		);

		if (this.cursors.buildWall.isDown) {
			this.socket.emit(Constant.MESSAGE.BUILD_WALL, coord);
		} else if (this.cursors.buildTurret.isDown) {
			this.socket.emit(Constant.MESSAGE.BUILD_TURRET, coord);
		} else if (this.cursors.demolishStructure.isDown) {
			this.socket.emit(Constant.MESSAGE.DEMOLISH_STRUCTURE, coord);
		}
	}

	updateState(update: any): void {
		//TODO may state type
		const {
			time,
			currentPlayer,
			otherPlayers,
			bullets,
			walls,
			turrets,
			campfires,
			bases,
			territories,
		} = update;
		if (currentPlayer == null) return;

		this.updatePlayer(currentPlayer);

		this.updateBullets(bullets);

		this.updateOpponents(otherPlayers);

		this.updateWalls(walls);

		this.updateTurrets(turrets);

		this.updateCampfires(campfires);

		this.updateBases(bases);

		this.updateTerritories(territories);

		this.events.emit('updateHUD', currentPlayer, time);
	}

	private updatePlayer(currentPlayer: any) {
		this.myPlayerSprite.setPosition(currentPlayer.xPos, currentPlayer.yPos);

		//  Local Animation control
		if (currentPlayer.health > 0) {
			this.alive = true;
			this.myPlayerSprite.setVisible(true);

			this.myPlayerSprite = this.handleWalkAnimation(
				this.myPlayerSprite,
				this.myPlayerSprite.texture.key,
				currentPlayer.xVel,
				currentPlayer.yVel
			);
		} else if (currentPlayer.health <= 0) {
			this.alive = false;
			this.handleDeathAnimation(
				this.myPlayerSprite,
				this.myPlayerSprite.texture.key
			);
		}
	}

	//TODO may not be necessary for bullets
	private updateBullets(bullets: any) {
		this.updateMapOfObjects(
			bullets,
			this.bulletSprites,
			'bullet',
			(newBullet, newBulletLiteral) => {
				if (newBulletLiteral.teamNumber == 1)
					newBullet.setTexture('bulletblue');
				return newBullet;
			}
		);
	}

	private updateOpponents(otherPlayers: any) {
		this.updateMapOfObjects(
			otherPlayers,
			this.otherPlayerSprites,
			'',
			(newPlayer, playerLiteral) => {
				newPlayer.setRotation(playerLiteral.direction);

				// Set Walk/Standing textures based on team
				let playerTexture = '';
				if (playerLiteral.teamNumber == Constant.TEAM.RED)
					playerTexture = 'player_red';
				else if (playerLiteral.teamNumber == Constant.TEAM.BLUE)
					playerTexture = 'player_blue';

				if (newPlayer.texture.key != playerTexture)
					//TODO faster lookup somehow? check null?
					newPlayer.setTexture(playerTexture).setDepth(1000);

				// Opponent Animation Control
				if (playerLiteral.health > 0) {
					newPlayer.setVisible(true);
					newPlayer = this.handleWalkAnimation(
						newPlayer,
						playerTexture,
						playerLiteral.xVel,
						playerLiteral.yVel
					);
				}
				if (playerLiteral.health <= 0) {
					this.handleDeathAnimation(newPlayer, playerTexture);
				}

				return newPlayer;
			}
		);
	}

	private updateWalls(walls: any) {
		this.updateMapOfObjects(
			walls,
			this.wallSprites,
			'',
			(newWall, newWallLiteral) => {
				let wallTexture = '';
				if (newWallLiteral.teamNumber == Constant.TEAM.RED)
					wallTexture = 'wall_red';
				else if (newWallLiteral.teamNumber == Constant.TEAM.BLUE)
					wallTexture = 'wall_blue';

				if (newWall.texture.key != wallTexture) {
					newWall.setTexture(wallTexture);
				}

				const healthPercent = newWallLiteral.hp / 50; // 50 = Total health determined from wall.ts
				newWall = this.handleDamageAnimation(
					newWall,
					wallTexture,
					healthPercent
				);

				return newWall;
			}
		);
	}

	private updateTurrets(turrets: any) {
		this.updateMapOfObjects(
			turrets,
			this.turretSprites,
			'',
			(newTurret, newTurretLiteral) => {
				let turretTexture = '';
				if (newTurretLiteral.teamNumber == Constant.TEAM.RED)
					turretTexture = 'turret_base_red';
				else if (newTurretLiteral.teamNumber == Constant.TEAM.BLUE)
					turretTexture = 'turret_base_blue';

				if (newTurret.texture.key != turretTexture) {
					newTurret.setTexture(turretTexture);
				}

				const healthPercent = newTurretLiteral.hp / 50; // 50 = Total health determined from turret.ts
				newTurret = this.handleDamageAnimation(
					newTurret,
					turretTexture,
					healthPercent
				);

				return newTurret;
			}
		);
	}

	private updateCampfires(campfires: any) {
		this.updateMapOfObjects(
			campfires,
			this.campfireSprites,
			'campfire_unlit',
			(newCampfire, newCampfireLiteral) => {
				if (newCampfireLiteral.teamNumber != -1)
					newCampfire.setTexture('campfire_lit').setDepth(0);
				else newCampfire.setTexture('campfire_unlit').setDepth(0);
				return newCampfire;
			}
		);
	}

	private updateBases(bases: any) {
		this.updateMapOfObjects(
			bases,
			this.baseSprites,
			'',
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			(newBase, newBaseLiteral) => {
				let baseTexture = '';
				if (newBaseLiteral.teamNumber == Constant.TEAM.RED)
					baseTexture = 'base_red';
				else if (newBaseLiteral.teamNumber == Constant.TEAM.BLUE)
					baseTexture = 'base_blue';

				if (newBase.texture.key != baseTexture) {
					newBase.setTexture(baseTexture);
				}

				const healthPercent = newBaseLiteral.hp / 100; // 100 = Total health determined from base.ts
				newBase = this.handleDamageAnimation(
					newBase,
					baseTexture,
					healthPercent
				);

				return newBase;
			}
		);
	}

	private updateTerritories(territories: any) {
		this.updateMapOfObjects(
			territories,
			this.territorySprites,
			'red-territory',
			(changedTilesNewTile, changedTilesCurrentTile) => {
				if (changedTilesCurrentTile.teamNumber == Constant.TEAM.RED) {
					changedTilesNewTile.setTexture('red-territory');
					changedTilesNewTile.setVisible(true).setDepth(-1);
				} else if (
					changedTilesCurrentTile.teamNumber == Constant.TEAM.BLUE
				) {
					changedTilesNewTile.setTexture('blue-territory');
					changedTilesNewTile.setVisible(true).setDepth(-1);
				}
				return changedTilesNewTile;
			}
		);
	}

	private updateMapOfObjects(
		currentObjects: any,
		oldObjects: Map<string, Phaser.GameObjects.Sprite>,
		sprite: string,
		callback: (arg0: any, arg1: any) => any
	) {
		this.deadObjects.clear();

		currentObjects.forEach((obj) => {
			let newObj;

			if (oldObjects.has(obj.id)) {
				newObj = oldObjects.get(obj.id);
				newObj.setPosition(obj.xPos, obj.yPos);
			} else {
				newObj = this.add.sprite(obj.xPos, obj.yPos, sprite);
				oldObjects.set(obj.id, newObj);
			}

			this.deadObjects.add(obj.id);
			callback(newObj, obj);
		});

		for (const anOldKey of oldObjects.keys()) {
			if (this.deadObjects.has(anOldKey)) continue;

			oldObjects.get(anOldKey)?.destroy();
			oldObjects.delete(anOldKey);
		}
	}

	private clearMapOfObjects(objects: Map<string, Phaser.GameObjects.Sprite>) {
		for (const anOldKey of objects.keys()) {
			objects.get(anOldKey)?.destroy();
			objects.delete(anOldKey);
		}
	}

	private endGame(endState: any): void {
		//TODO
		this.emptyAllObjects();
	}

	private emptyAllObjects(): void {
		this.hexTiles = new HexTiles();
		this.clearMapOfObjects(this.otherPlayerSprites);
		this.clearMapOfObjects(this.bulletSprites);
		this.clearMapOfObjects(this.wallSprites);
		this.clearMapOfObjects(this.campfireSprites);
		this.clearMapOfObjects(this.baseSprites);
		this.clearMapOfObjects(this.territorySprites);
		this.deadObjects.clear();
	}
}
