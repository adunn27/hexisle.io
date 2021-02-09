export default class HexTileScene extends Phaser.Scene {
  private graphics: Phaser.GameObjects.Graphics;
  private hexSize: number = 25;

  constructor() {
    super({ key: 'hexTileScene' });
  }

  preload(): void {
  }

  create(): void {

    // Sandbox work
    this.graphics = this.add.graphics();
    this.graphics.lineStyle(3, 0xffffff, 1);

    //center point
    let x = 400;
    let y = 100;
    this.createTile(x, y);
    this.createTileColumn(800,200,7);
  }

  getHexHeight() : number{
      return this.hexSize * Math.sqrt(3);
  }
  getHexWidth() : number{
      return this.hexSize * 2;
  }

  createTile(x: number, y: number) {
      // takes XY coordinates of center point,
      // generates all required vertices
      // draws individual tile

      let points: number[] = this.getHexPointsFromCenter(x, y);

      this.graphics.beginPath();
      this.graphics.moveTo(points[0], points[1]);
      for (let i = 0; i < 6; i++) {
        this.graphics.lineTo(points[i * 2], points[i * 2 + 1])
      }
      this.graphics.closePath();
      this.graphics.strokePath();
    }

    createTileColumn(x:number, y:number, numTiles : number){
        // creates a column starting from the center point of the first hex,
        // spans vertically down by numTiles hexes.

        // Uses XY coordinates to find center and draw tile
        let h = this.getHexHeight();

        for (let i = 0; i < numTiles; i++) {
            let tile_x = x;
            let tile_y = y + (i * h);
            this.createTile(tile_x, tile_y);
        }
    }

    getHexPointsFromCenter(xPoint: number, yPoint: number): number[] {
      let hexPoints: number[] = [];

      // iterate through each corner
      for (let i = 0; i < 6; i++) {

        // put each x,y pair in
        this.getHexCorner(xPoint, yPoint, i).forEach(function (val) {
          let length = hexPoints.push(Number(val));
        })
      }
      return hexPoints;
    }

    private getHexCorner(xCenter: number, yCenter: number, angle: number): number[] {
      let angle_deg: number = 60 * angle;
      let angle_rad: number = Math.PI / 180 * angle_deg;
      return [xCenter + this.hexSize * Math.cos(angle_rad),
              yCenter + this.hexSize * Math.sin(angle_rad)]
    }
}
