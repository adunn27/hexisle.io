import { Tile } from './hexTiles';
const Constant = require('../shared/constants');

export default class Campfire {
	id: string;
	xPos: number;
	yPos: number;
	teamNumber: number;

	captureProgress : number; // Variable Progress Bar (0-100)
	isCaptured : boolean;
	capturingTeam : number; // denotes who is capturing (-1 = no team)

	private multiplier = 0.2;
	private captureSpeed = 2;
    private resetSpeed = 10;

	constructor(
		id: string,
		xPos: number,
		yPos: number,
	) {
		this.id = id;
		this.xPos = xPos;
		this.yPos = yPos;
		this.teamNumber = -1;

		this.isCaptured = false;
		this.captureProgress = 0;
		this.capturingTeam = -1;
	}

	updateCaptureState(playerCount: number[]) {
		let numTeams = 0; // from total teams, how many are in the campfire radius
		let teamMax = 0; // index of team with most players
		for(let i = 0 ; i < playerCount.length ; ++i){
			if(playerCount[i] > 0) {
				++numTeams;
				if(teamMax < playerCount[i]){
					teamMax = playerCount[i];
				}
			}
		}

		if(this.isCaptured) {
			// if opposing team, decayProgress (mix of teams can decay)
			if(numTeams == 1 && teamMax != this.teamNumber){
				this.capturingTeam = teamMax;
				this.decayProgress(playerCount[teamMax]);
			}
			// if either team_number OR no team, set progress to 0 again and reset capturing team
			if((numTeams == 1 && teamMax == this.teamNumber) || (numTeams == 0)) {
				this.captureProgress = 0;
				this.capturingTeam = -1;
			}
		}
		else {
			// if no teams = set progress to 0, reset everything
			if(numTeams == 0){
				this.captureProgress = 0;
				this.capturingTeam = -1;
			}
			// if one team - grow progress, set capturingTeam
			if(numTeams == 1){
				if(this.capturingTeam != teamMax){
					this.captureProgress = 0;
					this.capturingTeam = teamMax;
				}
				this.growProgress(playerCount[teamMax]);
			}
		}
		this.checkForCapture();
	}

	growProgress(x : number){
		if(this.captureProgress < 100){
			this.captureProgress = Math.min(100, this.captureProgress + x);
		}
	}

	decayProgress(x : number){
		if(this.captureProgress > 0){
			this.captureProgress = Math.max(0, this.captureProgress - x);
		}
	}

	checkForCapture(){
		if(this.captureProgress == 100){
			if(this.isCaptured) {
				// Turn Back to Neutral!
				this.teamNumber = -1;

				this.isCaptured = false;
				this.captureProgress = 0;
				this.capturingTeam = -1;

				console.log("Lost Campfire: "+ this.id + ", Team Number = " + this.teamNumber);
			}
			else {
				// Was Catured!
				this.teamNumber = this.capturingTeam;

				this.isCaptured = true;
				this.captureProgress = 0;
				this.capturingTeam = -1;

				console.log("Captured Campfire: "+ this.id + ", Team Number = " + this.teamNumber);
			}
		}
	}

	serializeForUpdate(): any {
		return {
			id: this.id,
			xPos: this.xPos,
			yPos: this.yPos,
			captureProgress: this.captureProgress,
			teamNumber: this.teamNumber,
		};
	}

}
