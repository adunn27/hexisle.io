import Player from './../shared/player';
import Bullet from './../shared/bullet';
const Constant = require('../shared/constants');
import { HexTiles, Tile, OffsetPoint, Point } from './../shared/hexTiles';
import { Quadtree, Rect, CollisionObject } from './quadtree';

export default class Game {
	players: Map<string, Player>;
	bullets: Set<Bullet>;
	previousUpdateTimestamp: any;
	bulletCount: number;
	hexTileMap: HexTiles;
	changedTiles: Tile[];
    quadtree: Quadtree;

	constructor() {
		this.players = new Map();
		this.bullets = new Set();
		setInterval(this.update.bind(this), 1000 / 60); //TODO lean what bind is, and make it 1000 / 60
		this.hexTileMap = new HexTiles();
		this.hexTileMap.generateMap();
		this.changedTiles = [];
        this.quadtree = new Quadtree();
		this.previousUpdateTimestamp = Date.now();
		this.bulletCount = 0;
	}

	addPlayer(socket: SocketIOClient.Socket) {
		console.log('Hello: ' + socket.id);
		//calc xPos yPos
		const xPos = Math.floor(Math.random() * 600);
		const yPos = Math.floor(Math.random() * 600);
		const newPlayer = new Player(
			socket,
			xPos,
			yPos,
			Math.floor(Math.random() * 10000) + 1
		);
		this.players.set(socket.id, newPlayer); //TODO rn it has a random team
        this.quadtree.insertIntoQuadtree(this.quadtree.getTopLevelNode(),
                                         new Rect(0,0,0,0),
                                         0,
                                         new CollisionObject(xPos - 50, xPos + 50,
                                            yPos + 50, yPos - 50, newPlayer));
        console.log("inserted", newPlayer.id);
	}

	removePlayer(socket: SocketIOClient.Socket) {
		console.log('Goodbye: ' + socket.id);
		this.players.delete(socket.id);
	}

	update() {
		const currentTimestamp = Date.now();
		const timePassed =
			(currentTimestamp - this.previousUpdateTimestamp) / 1000;
		this.previousUpdateTimestamp = currentTimestamp;

		for (const aBullet of this.bullets) {
			aBullet.updatePosition(timePassed);
			if (aBullet.isExpired(currentTimestamp)) {
				this.bullets.delete(aBullet);
                continue;
			}

            this.quadtree.updateInQuadtree(this.quadtree.getTopLevelNode(),
                                        new Rect(0,0,0,0),
                                        0,
                                        new CollisionObject(aBullet.xPos - 50, aBullet.xPos + 50,
                                            aBullet.yPos + 50, aBullet.yPos - 50, aBullet));
		}

		for (const aPlayer of this.players.values()) {
			aPlayer.socket.emit(
				Constant.MESSAGE.GAME_UPDATE,
				this.createUpdate(aPlayer)
			);
		}
	}

	createUpdate(player: Player) {
		const nearbyPlayers: Player[] = [];
		const nearbyBullets: Bullet[] = [];

		for (const aPlayer of this.players.values()) {
			if (aPlayer === player) continue;
			nearbyPlayers.push(aPlayer);
		}

		const changedTiles: Tile[] = this.changedTiles;
		this.changedTiles = [];

		for (const aBullet of this.bullets) {
			nearbyBullets.push(aBullet);
		}

        let results: CollisionObject[] = [];
        this.quadtree.searchQuadtree(this.quadtree.getTopLevelNode(),
                                    new Rect(0,0,0,0),
                                    new Rect(player.xPos - 50, player.xPos + 50,
                                        player.yPos + 50, player.yPos - 50),
                                        results);

        if (results.length > 0) {
            if (results[0].payload instanceof Player && results[0].payload.id != player.id) {
                console.log("player at", player.xPos, player.yPos,
                            "is colliding with player at",
                            results[0].payload.xPos, results[0].payload.yPos);
            } else if (results[0].payload instanceof Bullet) {
                console.log("player at", player.xPos, player.yPos,
                            "is colliding with bullet at",
                            results[0].payload.xPos, results[0].payload.yPos);
                this.bullets.forEach((bullet) => {
                    if (bullet.id == results[0].payload.id) {
                        this.bullets.delete(bullet);
                        this.quadtree.deleteFromQuadtree(this.quadtree.getTopLevelNode(),
                                                        new Rect(0,0,0,0),
                                                        0,
                                                        new CollisionObject(bullet.xPos - 50, bullet.xPos + 50,
                                                        bullet.yPos + 50, bullet.yPos - 50,
                                                        bullet));
                    }
                });
            }
        }

		return {
			time: Date.now(),
			currentPlayer: player.serializeForUpdate(),
			otherPlayers: nearbyPlayers.map((p) => p.serializeForUpdate()),
			tileMap: this.hexTileMap.tileMap, // TODO, look into why we need this
			changedTiles: changedTiles,
			bullets: nearbyBullets.map((p) => p.serializeForUpdate()),
		};
	}

	movePlayer(socket: SocketIOClient.Socket, direction: number) {
		if (!this.players.has(socket.id)) return;
		const player: Player = this.players.get(socket.id)!;

		player.xPos = player.xPos + 10 * Math.cos(direction);
		player.yPos = player.yPos - 10 * Math.sin(direction);

        this.quadtree.updateInQuadtree(this.quadtree.getTopLevelNode(),
                                        new Rect(0,0,0,0),
                                        0,
                                        new CollisionObject(player.xPos - 50, player.xPos + 50,
                                            player.yPos + 50, player.yPos - 50, player));
	}

	changeTile(socket: SocketIOClient.Socket, coord: OffsetPoint) {
		if (!this.players.has(socket.id)) return;
		const player: Player = this.players.get(socket.id)!;

		if (!this.hexTileMap.checkIfValidHex(coord)) {
			return;
		}

		const tile: Tile = this.hexTileMap.tileMap[coord.q][coord.r];
		this.hexTileMap.tileMap[coord.q][coord.r] = tile;
		if (tile.building != 'select') {
			tile.building = 'select';
			this.changedTiles.push(tile);
		}
	}

	rotatePlayer(socket: SocketIOClient.Socket, direction: number) {
		if (!this.players.has(socket.id)) return;
		const player: Player = this.players.get(socket.id)!;

		player.updateDirection(direction);
	}

	shootBullet(socket: SocketIOClient.Socket, direction: number) {
		if (!this.players.has(socket.id)) return;
		const player: Player = this.players.get(socket.id)!;

        let bullet: Bullet = new Bullet(
                                        this.bulletCount.toString(),
                                        player.xPos,
                                        player.yPos,
                                        direction,
                                        player.teamNumber)

		this.bullets.add(bullet);
		this.bulletCount += 1;

        this.quadtree.updateInQuadtree(this.quadtree.getTopLevelNode(),
                                       new Rect(0,0,0,0),
                                       0,
                                       new CollisionObject(bullet.xPos - 50, bullet.xPos + 50,
                                                           bullet.yPos + 50, bullet.yPos - 50,
                                                           bullet));
	}
}
