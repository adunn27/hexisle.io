import { Constant } from '../shared/constants';
import Game from './game';
import * as SocketIO from 'socket.io';
import { OffsetPoint } from '../shared/hexTiles';

export default class GameWrapper {
	private game: Game;
	private playerDisconnectCallback: (socket: SocketIO.Socket) => void;
	public id: string;
	public playerCount: number;

	constructor(
		id: string,
		gameOverCallback: () => any,
		playerDisconnectCallback: (socket: SocketIO.Socket) => void
	) {
		this.id = id;
		this.playerCount = 0;
		this.game = new Game(gameOverCallback);
		this.playerDisconnectCallback = playerDisconnectCallback;
	}

	public addPlayer(socket: SocketIO.Socket, name = '') {
		this.updateSocket(socket, name);
		this.playerCount++;
	}

	private updateSocket(socket: SocketIO.Socket, name: string) {
		socket.on(Constant.MESSAGE.START_GAME, () => {
			this.game.addPlayer(socket, name);
		});

		socket.on(Constant.MESSAGE.MOVEMENT, (direction: number) => {
			this.game.movePlayer(socket, direction);
		});

		socket.on(Constant.MESSAGE.SHOOT, (direction: number) => {
			this.game.playerShootBullet(socket, direction);
		});

		socket.on(Constant.MESSAGE.ROTATE, (direction: number) => {
			this.game.rotatePlayer(socket, direction);
		});

		socket.on(Constant.MESSAGE.BUILD_WALL, (coord: OffsetPoint) => {
			this.game.buildStructure(socket, coord, Constant.BUILDING.WALL);
		});

		socket.on(Constant.MESSAGE.BUILD_TURRET, (coord: OffsetPoint) => {
			this.game.buildStructure(socket, coord, Constant.BUILDING.TURRET);
		});

		socket.on(Constant.MESSAGE.DEMOLISH_STRUCTURE, (coord: OffsetPoint) => {
			this.game.demolishStructure(socket, coord);
		});

		socket.on('disconnect', () => {
			this.leaveGame(socket);
			this.playerDisconnectCallback(socket);
		});
	}

	private leaveGame(socket: SocketIO.Socket) {
		this.game.removePlayer(socket);
		this.playerCount--;
	}

	public getInfo() {
		return {
			playerCount: this.playerCount,
		};
	}
}
