import DestructibleObj from './destructibleObj';
import { Constant } from './constants';
import { Tile } from './hexTiles';

export default class Wall extends DestructibleObj {
	public tile: Tile;

	constructor(
		id: string,
		xPos: number,
		yPos: number,
		teamNumber: number,
		tile: Tile
	) {
		super(id, xPos, yPos, teamNumber, Constant.HP.WALL);
		this.tile = tile;
	}

	public serializeForUpdate(): any {
		return {
			id: this.id,
			xPos: this.xPos,
			yPos: this.yPos,
			teamNumber: this.teamNumber,
			hp: this.hp,
			tile: this.tile,
		};
	}
}
