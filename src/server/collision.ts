import Player from './objects/player';
import Bullet from './objects/bullet';
import Wall from './objects/wall';
import Turret from './objects/turret';
import Campfire from './objects/campfire';
import Base from './objects/base';
import { Quadtree, Rect, CollisionObject } from './quadtree';
import { Constant } from '../shared/constants';
import { MapResources } from './mapResources';
import { Resource } from './objects/resource';
import BoundaryWall from './objects/boundaryWall';
import Structure from './objects/structure';

export default class CollisionDetection {
	quadtree: Quadtree;

	constructor() {
		this.quadtree = new Quadtree();
	}

	/**
	 * Checks around a campfire for players and updates the campfire's capture state accordingly
	 * @param campfire the campfire to check
	 */
	public campfirePlayerCollision(campfire: Campfire): void {
		// Get everything touching the campfires collider
		const results: CollisionObject[] = [];
		this.searchCollisions(campfire, Constant.RADIUS.COLLISION.WALL, results);

		const playerCount: number[] = [];
		for (let i = 0; i < Constant.TEAM_COUNT; i++) {
			playerCount[i] = 0;
		}
		results.forEach((result) => {
			if (
				result.payload instanceof Player &&
				this.doCirclesCollide(
					campfire,
					Constant.RADIUS.COLLISION.CAMP,
					result.payload,
					Constant.RADIUS.COLLISION.PLAYER
				)
			) {
				// Get number of players in each team
				playerCount[result.payload.teamNumber] += 1;
			}
		});

		campfire.updateCaptureState(playerCount);
	}

	/**
	 * Checks if a player is colliding with any bullets, lowers health of the player/increases resources and removes the bullet/resource if needed 
	 * @param player the player to check
	 * @param bullets the list of bullets to check against the player
	 * @param mapResources the object that holds all the map's resources
	 * @returns returns early if the player is no longer alive
	 */
	public playerBulletResourceCollision(
		player: Player,
		bullets: Set<Bullet>,
		mapResources: MapResources
	): void {
		if (!player.isAlive()) {
			return;
		}

		const results: CollisionObject[] = [];
		this.searchCollisions(player, Constant.RADIUS.COLLISION.PLAYER, results);

		results.forEach((result) => {
			if (
				result.payload instanceof Bullet &&
				result.payload.id == result.payload.id &&
				result.payload.teamNumber != player.teamNumber &&
				this.doCirclesCollide(
					player,
					Constant.RADIUS.COLLISION.PLAYER,
					result.payload,
					Constant.RADIUS.COLLISION.BULLET
				)
			) {
				player.hp -= Bullet.DAMAGE;
				bullets.delete(result.payload);
				this.deleteCollider(result.payload, Constant.RADIUS.COLLISION.BULLET);
			} else if (
				result.payload instanceof Resource &&
				result.payload.dropAmount > 0 &&
				this.doCirclesCollide(
					player,
					Constant.RADIUS.PLAYER,
					result.payload,
					Constant.RADIUS.RESOURCE
				)
			) {
				player.updateResource(result.payload.dropAmount);
				mapResources.deleteResource(result.payload);
				this.deleteCollider(result.payload, Constant.RADIUS.RESOURCE);
			}
		});
	}

	/**
	 * Checks if a building is colliding with any bullets, lowers health of the structure and removes the bullet if needed
	 * @param building the building to check
	 * @param bullets the list of bullets to check around the building
	 */
	public buildingBulletCollision(building: any, bullets: Set<Bullet>): void {
		const results: CollisionObject[] = [];
		const col_radius = this.getCollisionRadius(building);
		this.searchCollisions(building, col_radius, results);
		results.forEach((result) => {
			if (
				result.payload instanceof Bullet &&
				result.payload.id == result.payload.id &&
				result.payload.teamNumber != building.teamNumber &&
				this.doCirclesCollide(
					building,
					col_radius,
					result.payload,
					Constant.RADIUS.COLLISION.BULLET
				)
			) {
				building.hp -= Bullet.DAMAGE;
				bullets.delete(result.payload);
				this.deleteCollider(result.payload, Constant.RADIUS.COLLISION.BULLET);
			}
		});
	}

	/**
	 * Checks if a certain object collides with a structure
	 * @param xPos the xPos of the object
	 * @param yPos the yPos of the object
	 * @param objectRadius the radius of the object 
	 * @returns boolean
	 */
	public doesObjCollideWithStructure(
		xPos: number,
		yPos: number,
		objectRadius: number
	): boolean {
		const results: CollisionObject[] = [];
		this.searchCollisions({ xPos: xPos, yPos: yPos }, objectRadius, results);

		for (const result of results) {
			if (
				this.isStructure(result.payload) &&
				this.doCirclesCollide(
					{ xPos: xPos, yPos: yPos },
					Constant.RADIUS.COLLISION.PLAYER,
					result.payload,
					this.getCollisionRadius(result.payload)
				)
			)
				return true;
		}
		return false;
	}

	/**
	 * Checks if a certain object collides with a player
	 * @param xPos the xPos of the object
	 * @param yPos the yPos of the object
	 * @param objectRadius the radius of the object 
	 * @returns boolean
	 */
	public doesObjCollideWithPlayers(
		xPos: number,
		yPos: number,
		objectRadius: number
	): boolean {
		const results: CollisionObject[] = [];
		this.searchCollisions({ xPos: xPos, yPos: yPos }, objectRadius, results);
		for (const result of results) {
			if (
				result.payload instanceof Player &&
				this.doCirclesCollide(
					{ xPos: xPos, yPos: yPos },
					objectRadius,
					result.payload,
					Constant.RADIUS.COLLISION.PLAYER
				)
			)
				return true;
		}
		return false;
	}

	/**
	 * Finds the radian direction of the closest enemy player to the object
	 * @param object the object to look around
	 * @param objectRange the radius around the object to search
	 * @returns number
	 */
	public findDirectionOfClosestEnemy(object: any, objectRange: number): number {
		// Get everything in range
		const results: CollisionObject[] = [];
		this.searchCollisions(object, objectRange, results);

		// Go through the results and find the closest enemy
		let closestEnemy: Player | null = null;
		let closestEnemyDistance: number = objectRange + 1;
		for (const result of results) {
			if (
				result.payload instanceof Player &&
				result.payload.teamNumber != object.teamNumber &&
				this.doCirclesCollide(
					{ xPos: object.xPos, yPos: object.yPos },
					objectRange,
					result.payload,
					Constant.RADIUS.COLLISION.PLAYER
				)
			) {
				const xDiff: number = result.payload.xPos - object.xPos;
				const yDiff: number = result.payload.yPos - object.yPos;
				const distance: number = Math.sqrt(
					xDiff * xDiff + yDiff * yDiff
				);

				if (distance < closestEnemyDistance) {
					closestEnemy = result.payload;
					closestEnemyDistance = distance;
				}
			}
		}

		// Find the direction from the turret to the enemy if there is an enemy
		let closestEnemyDirection = Constant.DIRECTION.INVALID;
		if (closestEnemy != null) {
			closestEnemyDirection = Math.atan2(
				closestEnemy.yPos - object.yPos,
				closestEnemy.xPos - object.xPos
			);
		}
		return closestEnemyDirection;
	}

	/**
	 * Checks whether two objects' circle radii collide
	 * @param object1 first object
	 * @param radius1 radius of the first object
	 * @param object2 second object
	 * @param radius2 radius of the second object
	 * @returns boolean
	 */
	public doCirclesCollide(
		object1: any,
		radius1: number,
		object2: any,
		radius2: number
	): boolean {
		const centerDist: number = Math.sqrt(
			(object1.xPos - object2.xPos) ** 2 +
				(object1.yPos - object2.yPos) ** 2
		);
		if (centerDist > radius1 + radius2) {
			return false;
		} else {
			return true;
		}
	}

	/**
	 * Inserts an object in the quadtree
	 * @param object the object to insert
	 * @param radius the radius of the object
	 */
	public insertCollider(object: any, radius: number): void {
		this.quadtree.insertIntoQuadtree(
			new CollisionObject(
				object.xPos - radius,
				object.xPos + radius,
				object.yPos + radius,
				object.yPos - radius,
				object
			)
		);
	}

	/**
	 * Deletes an object in the quadtree
	 * @param object the object to delete
	 * @param radius the radius of the object
	 */
	public deleteCollider(object: any, radius: number): void {
		this.quadtree.deleteFromQuadtree(
			new CollisionObject(
				object.xPos - radius,
				object.xPos + radius,
				object.yPos + radius,
				object.yPos - radius,
				object
			)
		);
	}

	/**
	 * Updates an object in the quadtree with its new position
	 * @param object the object to update
	 * @param radius the radius of the object
	 */
	public updateCollider(object: any, radius: number): void {
		this.quadtree.updateInQuadtree(
			new CollisionObject(
				object.xPos - radius,
				object.xPos + radius,
				object.yPos + radius,
				object.yPos - radius,
				object
			)
		);
	}

	/**
	 * Takes the object and its radius and puts anything that may collide with it into results
	 * @param object the object to search around
	 * @param radius the radius of the object
	 * @param results the list to put potential collision objects into
	 */
	private searchCollisions(object: any, radius: number, results: CollisionObject[]) {
		this.quadtree.searchQuadtree(
			new Rect(
				object.xPos - radius,
				object.xPos + radius,
				object.yPos + radius,
				object.yPos - radius
			),
			results
		);
	}

	/**
	 * Returns the collision radius of an object
	 * @param object the object to check
	 * @returns number
	 */
	private getCollisionRadius(object: any): number {
		if (object instanceof Wall || object instanceof BoundaryWall) {
			return Constant.RADIUS.COLLISION.WALL;
		} else if (object instanceof Turret) {
			return Constant.RADIUS.COLLISION.TURRET;
		} else if (object instanceof Base) {
			return Constant.RADIUS.COLLISION.BASE;
		} else if (object instanceof Player) {
			return Constant.RADIUS.COLLISION.PLAYER;
		} else if (object instanceof Bullet) {
			return Constant.RADIUS.COLLISION.BULLET;
		}
		throw new Error('Invalid Object.');

		// console.log(object.constructor.prototype);
		// console.log(Object.getPrototypeOf(object));
		// try {
		// 	return Object.getPrototypeOf(object).COLLISION_RADIUS;
		// } catch {
		// 	throw new Error('Invalid Object, has no collision radius: ' + object.prototype);
		// }
	}

	/**
	 * Returns whether or not an object is a structure
	 * @param object the object to check
	 * @returns boolean
	 */
	private isStructure(object: any) {
		return Object.getPrototypeOf(object) instanceof Structure;
	}
}
