

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
        if ((this.y + this.radius > bar.y && this.y - this.radius < bar.y + 10) && (this.x - this.radius >= bar.x && this.x + this.radius <= bar.x + bar.width)) {
        	this.dy = -Math.abs(this.dy);
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

            //부딪힌 벽돌 로직
            if(flag) {
                brickHit(brick);
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
        this.y = canvasHeight - this.height - 10 - 160;
    }

    draw() {
        context.beginPath();
        context.rect(this.x, this.y, this.width, this.height);
        context.fillStyle = "#0095DD";
        context.fill();
        context.closePath();

        //캐릭터
        context.beginPath();
        context.drawImage(characterImg, this.x+(this.width-100)/2, this.y+10, 100, 150);
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
    constructor(x,y,width=100,height=20, color="#ffffff", hp, itmeChance=0.5) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.hp = hp;
        this.totalHp = hp;

        //아이템이 없으면 "", 있으면 랜덤 아이템 이름
        this.item = "";
        if ((Math.random() <= itmeChance) ? true : false) {
            this.item = itemList[Math.floor(Math.random()*itemList.length)];
        }

        this.text = (this.item != "") ? `${this.item}  ${this.hp}` : `${this.hp}`;
        this.centerX = x + (width / 2);
        this.centerY = y + (height / 2);
    }

    draw() {
        context.beginPath();
        context.rect(this.x, this.y, this.width, this.height);
        context.fillStyle = "#0095DD";
        context.fill();
        context.closePath();

        context.beginPath();
        context.fillStyle = 'black';
        context.font = '15px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        this.text = (this.item != "") ? `${this.item}  ${this.hp}` : `${this.hp}`;
        context.fillText(this.text, this.centerX, this.centerY);
        context.closePath();
    }

    update(newHp) {
        this.hp = newHp;
        //색깔 변경? 등등

        this.draw();
    }
}

//블록에 부딪혔을 때
const brickHit = (brick) => {
    brick.update(brick.hp - power);

    if (brick.hp <= 0) {
        bossLife -= brick.totalHp;
        bricks = bricks.filter(b => b.hp > 0);

        //아이템 처리
        if (brick.item != "") {
            itemAbility[brick.item](10);
        }
    }

    //보스 이미지 처리, 맞았을 때 이미지 전환
    bossImgUpdate("attacked");
}


let totLife;        // 내 체력
let count;          // 부메랑 개수
let power;          // 공격력
let totBossLife;    // 보스 체력

const itemList = ["공격력", "체력회복"];
//아이템 이름별 효과
const itemAbility = {
    "공격력" : (amount) => {
        power += amount;
    },
    "체력회복" : (amount) => {
        life = Math.min(life + amount, totLife);
    }
}

const level1Setting = () => {
    totLife = 100;
    count = 5;
    power = 20;
    totBossLife = 500;
}

let bricks = [];

const level1Bricks = () => {
    bricks = [];

    const x = [10, 300, 700];
    const y = [20, 20, 20];
    const w = [100, 100, 200];
    const h = [20, 20, 50];
    const color = ["#00ff00", "#00ff00", "#00ff00"];
    const hp = [100, 100, 100];
    for (let i=0; i<x.length;i++) {
        const brick = new Brick(x[i], y[i], w[i], h[i], color[i], hp[i], 0.5);
        bricks.push(brick);
    }
}

const bossImgUpdate = (state) => {
    const bossImg = document.querySelector("#bossImg");
    switch (state) {
    //처음 시작 시, 레벨에 맞는 이미지로 초기화
    case "init":
        bossImg.src = `img/boss/${level}.png`;
        break;
    //공격 받았을 때
    case "attacked":
        break;
    }
}