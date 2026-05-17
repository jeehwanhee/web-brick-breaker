let bricks = [];

class Ball {
    constructor(x, y, dx, dy, color)
    {
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        this.radius = 10;
        this.color = color;
    }

    draw() {
        context.beginPath();
        context.fillStyle = this.color;
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true);
        context.fill();
        context.closePath();
    }

    update() {
        if (this.x < this.radius || this.x > canvasWidth - this.radius) {
            this.dx = -this.dx;
        }
        if (this.y < this.radius) {
            this.dy = -this.dy;
        }

        //바에 부딪혔을 때
        if (this.y > canvasHeight - this.radius - bar.height && (this.x - this.radius >= bar.x && this.x + this.radius <= bar.x + bar.width)) {
        	this.dy = -this.dy;
        }

        //바닥에 닿았을 때
        if (this.y > canvasHeight - this.radius) {
        	count -= 1;
        	updateUi();
        	initAnimation();
        }

        //벽돌에 부딪혔을 때
        bricks.forEach((brick) => {
            let flag = false;
            if (this.y + this.radius > brick.y && this.y - this.radius < brick.y + brick.height) {
                if (this.x > brick.x && this.x < brick.x + brick.width) {
                    this.dy = -this.dy;
                    flag = true;
                }
            }
            if (this.x + this.radius > brick.x && this.x - this.radius < brick.x + brick.width) {
                if (this.y > brick.y && this.y < brick.y + brick.height) {
                    this.dx = -this.dx;
                    flag = true;
                }
            }
            if(flag) {
                brick.update(brick.hp - power);
                bricks = bricks.filter(brick => brick.hp > 0);
                flag = false;
            }
        });




        this.x += this.dx;
        this.y += this.dy;
        this.draw();
    }
}

class Bar {
    constructor() {
        this.width = 150;
        this.height = 10;
        this.speed = 7;
        
        this.x = (canvasWidth - this.width) / 2;
        this.y = canvasHeight - this.height - 10;
    }

    draw() {
        context.beginPath();
        context.rect(this.x, this.y, this.width, this.height);
        context.fillStyle = "#0095DD";
        context.fill();
        context.closePath();
    }

    update() {
        if (rightPressed && this.x < canvasWidth - this.width) {
            this.x += this.speed;
        } else if (leftPressed && this.x > 0) {
            this.x -= this.speed;
        }

        this.draw();
    }
}

class Brick {
    constructor(x,y,width=100,height=20, color="#ffffff", hp) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.hp = hp;
        this.centerX = x + (width / 2);
        this.centerY = y + (height / 2);

        //아이템을 주는 블록은 원래 정해놓을건지(매개변수로 받기), 랜덤으로 생성할 건지(자체적으로 random)
    }

    draw() {
        context.beginPath();
        context.rect(this.x, this.y, this.width, this.height);
        context.fillStyle = "#0095DD";
        context.fill();
        context.closePath();

        context.beginPath();
        context.fillStyle = 'black';
        context.font = '18px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(`${this.hp}`, this.centerX, this.centerY);
        context.closePath();
    }

    update(newHp) {
        this.hp = newHp;
        //색깔 변경? 등등

        this.draw();
    }
}


const level1Bricks = () => {
    bricks = [];

    const x = [10, 300, 700];
    const y = [20, 20, 20];
    const w = [100, 100, 200];
    const h = [20, 20, 50];
    const color = ["#00ff00", "#00ff00", "#00ff00"];
    const hp = [100, 100, 100];
    for (let i=0; i<x.length;i++) {
        const brick = new Brick(x[i], y[i], w[i], h[i], color[i], hp[i]);
        bricks.push(brick);
    }
}