import 'phaser';
import mainScene from './scenes/mainScene';
import HUDScene from './scenes/HUDScene';
import { Constant } from './../shared/constants';

export const config: Phaser.Types.Core.GameConfig = {
	parent: 'game-canvas',
	width: Constant.DEFAULT_WIDTH,
	height: Constant.DEFAULT_HEIGHT,
	type: Phaser.AUTO,
	scale: {
		mode: Phaser.Scale.RESIZE,
		autoCenter: Phaser.Scale.CENTER_BOTH,
	},
	scene: [mainScene, HUDScene],
	physics: {
		default: 'arcade',
		arcade: {
			debug: true,
			gravity: { y: 100 },
		},
	},
};
