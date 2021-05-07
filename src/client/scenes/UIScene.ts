import Anchor from 'phaser3-rex-plugins/plugins/anchor.js';

export default class UIScene extends Phaser.Scene {
	private mainSceneObj: any;
	// help UI
	private helpButtonSprite: Phaser.GameObjects.Sprite;
	private helpPopupSprite: Phaser.GameObjects.Sprite;

	constructor() {
		super('UIScene');
	}

	create(): void {
		this.helpButtonSprite = this.add
			.sprite(0, 0, 'help_button_unpressed')
			.setDepth(1000);
		this.helpButtonSprite.setScale(0.5, 0.5);
		new Anchor(this.helpButtonSprite, {
			right: 'right-10',
			bottom: 'bottom-10',
		});

		this.helpPopupSprite = this.add
			.sprite(0, 0, 'help_popup')
			.setDepth(1000)
			.setVisible(false);
		new Anchor(this.helpPopupSprite, {
			right: 'right-10',
			bottom: 'bottom-85',
		});

		this.helpPopupSprite.setInteractive();
		this.helpPopupSprite.on('pointerdown', this.toggleHelp.bind(this));

		// Grab a reference to the Game Scene
		this.mainSceneObj = this.scene.get('MainScene');

		// Listen for events from it
		this.mainSceneObj.events.on('toggleHelpUI', this.toggleHelp, this);
		this.mainSceneObj.events.on('stopUI', this.stopUI, this);
	}

	private toggleHelp(): void {
		if (this.helpPopupSprite.visible) {
			// Toggle off
			this.helpPopupSprite.setVisible(false);
			this.helpButtonSprite.setTexture('help_button_unpressed');
		} else {
			// Toggle on
			this.helpPopupSprite.setVisible(true);
			this.helpButtonSprite.setTexture('help_button_pressed');
		}
	}

	private stopUI(): void {
		this.scene.setVisible(false);
	}
}
