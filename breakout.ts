const canvas = <HTMLCanvasElement>document.getElementById('canv');
const canv = canvas.getContext('2d');

const canvasRect = canvas.getBoundingClientRect();

interface Velocity {
  x: number;
  y: number;
}

interface Ball {
  x: number;
  y: number;
  size: number;
  color: string;
  velocity: Velocity;
  alive: boolean;
  tickForward: () => void;
  paddleCollisionCheck: (paddle: Paddle) => void;
  blockCollisionCheck: (block: Block) => boolean | number;
}

interface Paddle {
  x: number;
  y: number;
  width: number;
}

interface Block {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  clearSelf: () => void;
}

interface SidePoint {
  x: number;
  y: number;
  name: string;
}

function clearScreen(): void {
  canv.clearRect(0, 0, 650, 650);
}

function drawPaddle(paddle: Paddle): void {
  canv.beginPath();
  canv.rect(paddle.x - (paddle.width / 2), paddle.y, paddle.width, 15);
  canv.fillStyle = 'white';
  canv.fill();
}

function drawBall(ball: Ball): void {
  let color: string = 'white';
  let size: number = 20;
  canv.beginPath();
  canv.arc(ball.x, ball.y, ball.size, 0, 2 * Math.PI);
  canv.fillStyle = ball.color;
  canv.fill();
}

function drawBlock(block: Block): void {
  canv.beginPath();
  canv.rect(block.x, block.y, block.width, block.height);
  canv.fillStyle = block.color;
  canv.fill();
  canv.strokeStyle = 'blue';
  canv.stroke();
}

function createBall(size = 8, color = "white"): Ball {
  return {
    x: 325,
    y: 575,
    velocity: {
      x: Math.random() * 2.5 * ((Math.floor(Math.random() * 2)) ? 1 : -1),
      y: Math.random() * -2.5,
    },
    size: size,
    color: color,
    alive: true,
    tickForward: function () {
      this.x += this.velocity.x;
      this.y += this.velocity.y;
      if (this.y > 650 - (size / 2)) {
        this.alive = false;
        return;
      }

      if (this.x > 650 - (size / 2) || this.x < 0 + (size / 2)) {
        this.velocity.x *= -1;
      }
      if (this.y < 0 + (size / 2)) {
        this.velocity.y *= -1;
      }
    },
    paddleCollisionCheck: function (paddle: Paddle): void {
      // try to make it so that if it hits the edges
      // it still gets sent upwards
      // just at an angle, depending which side
      if (this.x > paddle.x - (paddle.width / 1.5) && this.x < paddle.x + (paddle.width / 2.5) && this.y > paddle.y - this.size && this.y < paddle.y + (this.size * 2)) {
        this.velocity.y *= -1 - (Math.random() / 7);
        if (Math.abs(this.velocity.y) < 0.5) {
          this.velocity.y *= 2;
        }
      }
    },
    blockCollisionCheck: function (block: Block): boolean | number {
      if (this.x > block.x && this.x < block.x + block.width && this.y > block.y - this.size && this.y < block.y + block.height) {
        return block.id;
      } else {
        return false;
      }
    }
  }
}


function removeDeadBalls(balls: Ball[]): Ball[] {
  let newBalls: Ball[] = [];
  for (const ball in balls) {
    if (balls[ball].alive) {
      newBalls.push(balls[ball]);
    }
  }
  return newBalls;
}

function removeDeadBlock(blockId: number, blocks: Block[]): Block[] {
  for (let i = 0; i < blocks.length; i++) {
    if (blocks[i].id == blockId) {
      blocks.splice(i, 1);
      break;
    }
  }
  return blocks;
}

let blockIdCounter: number = 1;

function spawnBlocks(): Block[] {
  const width: number = 80;
  const height: number = 25;
  const startXPos: number = 130;
  const startYPos: number = 80;
  const color: string = 'gray';
  const padding: number = 0;


  let blocks: Block[] = [];
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 6; j++) {
      let block: Block = {
        id: blockIdCounter++,
        x: startXPos + (width * i),
        y: startYPos + (height * j),
        width: width - padding,
        height: height - padding,
        color: color,
        clearSelf: function () {
          canv.clearRect(this.x, this.y, this.width, this.height);
        }
      }
      blocks.push(block);
    }
  }
  return blocks;
}

function getSide(ball: Ball, block: Block): 'l' | 'r' | 'b' | 't' {
  let top: SidePoint = { x: block.x + (block.width / 2), y: block.y, name: 'top' };
  let left: SidePoint = { x: block.x, y: block.y + (block.height / 2), name: 'left' };
  let bottom: SidePoint = { x: block.x + (block.width / 2), y: block.y + block.height, name: 'bottom' };
  let right: SidePoint = { x: block.x + block.width, y: block.y + (block.height / 2), name: 'right' };

  let bPoint: SidePoint = { x: ball.x, y: ball.y, name: 'ball' };

  let distances: [number, string][] = [];
  function getDistance(pointA: SidePoint, pointB: SidePoint): [number, string] {
    let denom: number = ((pointB.x - pointA.x) ** 2) + ((pointB.y - pointA.y) ** 2)
    return [denom ** .5, pointB.name];
  }
  distances.push(getDistance(bPoint, top));
  distances.push(getDistance(bPoint, left));
  distances.push(getDistance(bPoint, bottom));
  distances.push(getDistance(bPoint, right));

  let smallest: string = "";
  let smallestNum: number = 1000;
  for (const combo of distances) {
    if (combo[0] < smallestNum) {
      smallest = combo[1];
      smallestNum = combo[0];
    }
  }

  if (smallest == "top") {
    return 't';
  } else if (smallest == "left") {
    return 'l';
  } else if (smallest == "right") {
    return 'r'
  } else if (smallest == "bottom") {
    return 'b'
  }
}

function deflectBall(side: 'l' | 'r' | 't' | 'b', ball: Ball): void {
  if (side == 'l' || side == 'r') {
    ball.velocity.x *= -1;
  } else if (side == 't' || side == 'b') {
    ball.velocity.y *= -1
  }
}


let activeBalls: Ball[] = [];
let paddle: Paddle = { x: 300, y: 600, width: 100 };

let ball: Ball = createBall();
activeBalls.push(ball);

let activeBlocks: Block[] = spawnBlocks();

canvas.onmousemove = (e) => {
  paddle.x = e.clientX - canvasRect.x;
}

canvas.onclick = (e) => {
  activeBalls.push(createBall());
  console.log(activeBalls);
}

setInterval(() => {
  removeDeadBalls(activeBalls);
  clearScreen();
  activeBalls.forEach((ball) => {
    ball.tickForward();
    ball.paddleCollisionCheck(paddle);
    for (const block of activeBlocks) {
      let collisionTest: boolean | number = ball.blockCollisionCheck(block);
      if (collisionTest) {
        let id: number = collisionTest as number;

        let side: 'l' | 'r' | 'b' | 't' = getSide(ball, block);
        deflectBall(side, ball);
        block.clearSelf();
        activeBlocks = removeDeadBlock(id, activeBlocks);
        break;
      }
    }
    drawBall(ball);
    drawPaddle(paddle);
  });
  activeBlocks.forEach((block) => {
    drawBlock(block);
  });
}, 5, activeBalls, paddle, activeBlocks);
