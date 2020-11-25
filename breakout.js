const canvas = document.getElementById('canv');
const canv = canvas.getContext('2d');
const canvasRect = canvas.getBoundingClientRect();
function clearScreen() {
    canv.clearRect(0, 0, 650, 650);
}
function drawPaddle(paddle) {
    canv.beginPath();
    canv.rect(paddle.x - (paddle.width / 2), paddle.y, paddle.width, 15);
    canv.fillStyle = 'white';
    canv.fill();
}
function drawBall(ball) {
    let color = 'white';
    let size = 20;
    canv.beginPath();
    canv.arc(ball.x, ball.y, ball.size, 0, 2 * Math.PI);
    canv.fillStyle = ball.color;
    canv.fill();
}
function drawBlock(block) {
    canv.beginPath();
    canv.rect(block.x, block.y, block.width, block.height);
    canv.fillStyle = block.color;
    canv.fill();
    canv.strokeStyle = 'blue';
    canv.stroke();
}
function createBall(size = 8, color = "white") {
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
        paddleCollisionCheck: function (paddle) {
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
        blockCollisionCheck: function (block) {
            if (this.x > block.x && this.x < block.x + block.width && this.y > block.y - this.size && this.y < block.y + block.height) {
                return block.id;
            }
            else {
                return false;
            }
        }
    };
}
function removeDeadBalls(balls) {
    let newBalls = [];
    for (const ball in balls) {
        if (balls[ball].alive) {
            newBalls.push(balls[ball]);
        }
    }
    return newBalls;
}
function removeDeadBlock(blockId, blocks) {
    for (let i = 0; i < blocks.length; i++) {
        if (blocks[i].id == blockId) {
            blocks.splice(i, 1);
            break;
        }
    }
    return blocks;
}
let blockIdCounter = 1;
function spawnBlocks() {
    const width = 80;
    const height = 25;
    const startXPos = 130;
    const startYPos = 80;
    const color = 'gray';
    const padding = 0;
    let blocks = [];
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 6; j++) {
            let block = {
                id: blockIdCounter++,
                x: startXPos + (width * i),
                y: startYPos + (height * j),
                width: width - padding,
                height: height - padding,
                color: color,
                clearSelf: function () {
                    canv.clearRect(this.x, this.y, this.width, this.height);
                }
            };
            blocks.push(block);
        }
    }
    return blocks;
}
function getSide(ball, block) {
    let top = { x: block.x + (block.width / 2), y: block.y, name: 'top' };
    let left = { x: block.x, y: block.y + (block.height / 2), name: 'left' };
    let bottom = { x: block.x + (block.width / 2), y: block.y + block.height, name: 'bottom' };
    let right = { x: block.x + block.width, y: block.y + (block.height / 2), name: 'right' };
    let bPoint = { x: ball.x, y: ball.y, name: 'ball' };
    let distances = [];
    function getDistance(pointA, pointB) {
        let denom = ((pointB.x - pointA.x) ** 2) + ((pointB.y - pointA.y) ** 2);
        return [denom ** .5, pointB.name];
    }
    distances.push(getDistance(bPoint, top));
    distances.push(getDistance(bPoint, left));
    distances.push(getDistance(bPoint, bottom));
    distances.push(getDistance(bPoint, right));
    let smallest = "";
    let smallestNum = 1000;
    for (const combo of distances) {
        if (combo[0] < smallestNum) {
            smallest = combo[1];
            smallestNum = combo[0];
        }
    }
    if (smallest == "top") {
        return 't';
    }
    else if (smallest == "left") {
        return 'l';
    }
    else if (smallest == "right") {
        return 'r';
    }
    else if (smallest == "bottom") {
        return 'b';
    }
}
function deflectBall(side, ball) {
    if (side == 'l' || side == 'r') {
        ball.velocity.x *= -1;
    }
    else if (side == 't' || side == 'b') {
        ball.velocity.y *= -1;
    }
}
let activeBalls = [];
let paddle = { x: 300, y: 600, width: 100 };
let ball = createBall();
activeBalls.push(ball);
let activeBlocks = spawnBlocks();
canvas.onmousemove = (e) => {
    paddle.x = e.clientX - canvasRect.x;
};
canvas.onclick = (e) => {
    activeBalls.push(createBall());
    console.log(activeBalls);
};
setInterval(() => {
    removeDeadBalls(activeBalls);
    clearScreen();
    activeBalls.forEach((ball) => {
        ball.tickForward();
        ball.paddleCollisionCheck(paddle);
        for (const block of activeBlocks) {
            let collisionTest = ball.blockCollisionCheck(block);
            if (collisionTest) {
                let id = collisionTest;
                let side = getSide(ball, block);
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
