import { Room, Client } from "@colyseus/core";
import {
  DirectionState,
  ICell,
  MazePlayRoomState,
  PlayerState,
  PositionState,
} from "./schema/MazePlayRoomState";
import { WallTypeEnum } from "../enums/wall-type-enum";

const SIZE = 20;

const createMaze = () => {
  let grid: ICell[][] = [];
  let visitArr: boolean[][] = [];

  for (let x = 0; x < SIZE; x++) {
    grid.push([]);
    visitArr.push([]);
    for (let z = 0; z < SIZE; z++) {
      grid[x].push({
        positionX: x,
        positionZ: z,
        walls: {
          [WallTypeEnum.TOP]: true,
          [WallTypeEnum.RIGHT]: true,
          [WallTypeEnum.LEFT]: true,
          [WallTypeEnum.BOTTOM]: true,
        },
      });
      visitArr[x].push(false);
    }
  }

  scan(Math.floor(Math.random() * SIZE), Math.floor(Math.random() * SIZE));

  function scan(x: number, z: number) {
    visitArr[x][z] = true;
    const dirs = [
      WallTypeEnum.LEFT,
      WallTypeEnum.RIGHT,
      WallTypeEnum.BOTTOM,
      WallTypeEnum.TOP,
    ];
    dirs.sort(() => Math.random() - 0.5);
    dirs.forEach((dir) => {
      if (WallTypeEnum.LEFT === dir) {
        if (x > 0) {
          if (!visitArr[x - 1][z]) {
            grid[x - 1][z].walls[WallTypeEnum.RIGHT] = false;
            grid[x][z].walls[WallTypeEnum.LEFT] = false;
            scan(x - 1, z);
          }
        }
      }
      if (WallTypeEnum.RIGHT === dir) {
        if (x < SIZE - 1) {
          if (!visitArr[x + 1][z]) {
            grid[x][z].walls[WallTypeEnum.RIGHT] = false;
            grid[x + 1][z].walls[WallTypeEnum.LEFT] = false;
            scan(x + 1, z);
          }
        }
      }
      if (WallTypeEnum.TOP === dir) {
        if (z < SIZE - 1) {
          if (!visitArr[x][z + 1]) {
            grid[x][z + 1].walls[WallTypeEnum.BOTTOM] = false;
            grid[x][z].walls[WallTypeEnum.TOP] = false;
            scan(x, z + 1);
          }
        }
      }
      if (WallTypeEnum.BOTTOM === dir) {
        if (z > 0) {
          if (!visitArr[x][z - 1]) {
            grid[x][z].walls[WallTypeEnum.BOTTOM] = false;
            grid[x][z - 1].walls[WallTypeEnum.TOP] = false;
            scan(x, z - 1);
          }
        }
      }
    });
  }

  return grid;
};

export class MyRoom extends Room<MazePlayRoomState> {
  maxClients = 4;

  onCreate(options: any) {
    console.log("MyRoom created.");
    const newState = new MazePlayRoomState();

    newState.cells = JSON.stringify(createMaze());

    this.setState(newState);

    this.onMessage("playerUpdate", (client, data) => {
      console.log("update received -> ");
      console.debug(JSON.stringify(data));
      const player = this.state.players.get(client.sessionId);
      player.position = new PositionState(
        data.position.x,
        data.position.y,
        data.position.z
      );
      player.direction = new DirectionState(
        data.direction.x,
        data.direction.y,
        data.direction.z,
        data.direction.w
      );
      player.animation = data.animation;
    });
  }

  onJoin(client: Client, options: any) {
    console.log(client.sessionId, "joined!");

    // create Player instance
    const player = new PlayerState();
    this.state.players.set(client.sessionId, player);

    console.log("new player =>", player.toJSON());
  }

  onLeave(client: Client, consented: boolean) {
    this.state.players.delete(client.sessionId);
    console.log(client.sessionId, "left!");
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }
}
