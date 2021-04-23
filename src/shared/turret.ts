import { Constant } from './constants';
import { Tile } from './hexTiles';

export default class Turret {
	id: string;
	xPos: number;
	yPos: number;
	direction: number;
	teamNumber: number;
	tile: Tile;
	hp: number;
	reloadTimer: number;
	hasTarget: boolean;

	constructor(
		id: string,
		xPos: number,
		yPos: number,
		teamNumber: number,
		tile: Tile
	) {
		this.id = id;
		this.xPos = xPos;
		this.yPos = yPos;
		this.direction = 0;
		this.teamNumber = teamNumber;
		this.tile = tile;
		this.hp = Constant.HP.TURRET;
		this.reloadTimer = 0;
		this.hasTarget = false;
	}

	aim(direction: number) {
		if (direction != Constant.DIRECTION.INVALID) {
			this.direction = direction;
			this.hasTarget = true;
		} else {
			this.hasTarget = false;
		}
	}

	canShoot() {
		return this.hasTarget == true && this.reloadTimer <= 0;
	}

	shoot() {
		this.reloadTimer = Constant.TIMING.TURRET_RELOAD_TIME;
	}

	reload() {
		if (this.reloadTimer > 0) {
			this.reloadTimer -= 1;
		}
	}

	serializeForUpdate(): any {
		return {
			id: this.id,
			xPos: this.xPos,
			yPos: this.yPos,
			direction: this.direction,
			hp: this.hp,
			teamNumber: this.teamNumber,
		};
	}

	isAlive(): boolean {
		return this.hp > 0;
	}
}
