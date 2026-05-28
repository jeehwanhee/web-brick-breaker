


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
    constructor(x,y,width=100,height=20, color="#ffffff", hp=50, itmeChance=0.5) {
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
        context.fillStyle = this.color;
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

const itemList = ["공격력", "체력회복", "공추가", "바확장"];
//아이템 이름별 효과
const itemAbility = {
    "공격력" : (amount) => {
        power += amount;
    },

    "체력회복" : (amount) => {
        life = Math.min(life + amount, totLife);
    },

    "공추가" : () => {
        addBall();
    },

    "바확장" : () => {
        increaseBarWidth(40);
    }
};

const level1Setting = () => {
    totLife = 100;
    count = 5;
    power = 20;
    totBossLife = 500;
}
const level2Setting = () => {
    totLife = 100;
    count = 5;
    power = 20;
    totBossLife = 100;
}
const level3Setting = () => {
    totLife = 100;
    count = 5;
    power = 20;
    totBossLife = 100;
}

let bricks = [];

const level1Bricks = () => {
    bricks = [];

    const x = [
        10, 130, 250, 370, 610, 730, 850, 970,
        10, 130, 250, 370, 610, 730, 850, 970,
        10, 130, 250, 370, 610, 730, 850, 970,
        10, 130, 250, 370, 610, 730, 850, 970,
    ];
    const y = [
        20, 20, 20, 20, 20, 20, 20, 20,
        50, 50, 50, 50, 50, 50, 50, 50,
        80, 80, 80, 80, 80, 80, 80, 80,
        110, 110, 110, 110, 110, 110, 110, 110,
    ];
    const w = [];
    const h = [];
    const color = []; //배경 보고 어울리는 색으로 넣기
    const hp = [
    ];
    for (let i=0; i<x.length;i++) {
        const brick = new Brick(x[i], y[i], w[i], h[i], color[i], hp[i], 0.5);
        bricks.push(brick);
    }
}

const level2Bricks = () => {
    bricks = [];

    const x = [
        10, 130, 250, 370, 490, 610, 730, 850, 970,
        10, 130, 250, 370, 610, 730, 850, 970,
        10, 130, 250, 730, 850, 970,
        10, 130, 850, 970,
        10, 970,
        10, 970
    ];
    const y = [
        20, 20, 20, 20, 20, 20, 20, 20, 20,
        50, 50, 50, 50, 50, 50, 50, 50,
        80, 80, 80, 80, 80, 80,
        110, 110, 110, 110,
        140, 140,
        170, 170
    ];
    const w = [];
    const h = [];
    const color = []; //배경 보고 어울리는 색으로 넣기
    const hp = [ 
    ];
    for (let i=0; i<x.length;i++) {
        const brick = new Brick(x[i], y[i], w[i], h[i], color[i], hp[i], 0.5);
        bricks.push(brick);
    }
};

const level3Bricks = () => {
    bricks = [];

    const x = [
        10, 130,      370,                850, 970,
                 250,                730,     
            130,                          850,
                 250,      490,      730,     
            130, 250,           610,      850,
                      425     
    ];
    const y = [
        20, 20, 20, 20, 20,
        50, 50,
        80, 80,
        110, 110, 110,  
        140, 140, 140, 140,
        170
    ];
    const w = [
        100, 100, 340, 100, 100,
        100, 100,
        100, 100, 
        100, 100, 100, 
        100, 220, 220, 100, 
        220, 
    ];
    const h = [170, 20, 80, 20, 170];
    const color = []; //배경 보고 어울리는 색으로 넣기
    const hp = [ 
        200, 50, 200, 50, 200,
        20, 20, 
        20, 20, 
        20, 20, 20, 
        20, 100, 100, 20, 
        100, 
    ];
    for (let i=0; i<x.length;i++) {
        const brick = new Brick(x[i], y[i], w[i], h[i], color[i], hp[i], 0.5);
        bricks.push(brick);
    }
};



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


const bossPatternConfigs = {
    // 1스테이지: 나방
    1: [
        {
            id: "moth_powder",
            name: "가루 뿌리기",
            type: "powder",
            imageSrc: "img/bossSkill/moth_powder.png",
            count: 8,
            radius: 14,
            speed:  4,
            damage: 5
        },
        {
            id: "moth_wind",
            name: "대각선 바람",
            type: "diagonalWind",
            imageSrc: "img/bossSkill/moth_wind.png",
            width: 160,
            height: 240,
            speed: 7,
            damage: 12
        },
        {
            id: "moth_charge",
            name: "돌진기",
            type: "charge",
            imageSrc: "img/bossSkill/moth_charge.png",
            width: 280,
            height: 200,
            speed: 12,
            damage: 15
        }
    ],

    // 2스테이지: 아그님
    2: [
        {
            id: "agahnim_lightning",
            name: "연속 번개",
            type: "lightningRain",
            imageSrc: "img/bossSkill/agahnim_lightning.png",
            count: 6,
            interval: 500,
            width: 80,
            height: 180,
            speed: 12,
            damage: 10
        },
        {
            id: "agahnim_double_fireball",
            name: "양 대각선 파이어볼",
            type: "doubleFireball",
            imageSrc: "img/bossSkill/agahnim_fireball.png",
            radius: 55,
            speed: 7,
            damage: 15
        },
        {
            id: "agahnim_bat_missile",
            name: "박쥐 유도 미사일",
            type: "homingBat",
            imageSrc: "img/bossSkill/agahnim_bat.png",
            count: 2,
            radius: 24,

            xSpeed: 3,
            ySpeed: 5,

            damage: 12
        }
    ],

    // 3스테이지: 가논
    // 3스테이지: 가논
    // 3스테이지: 가논
    3: [
        {
            id: "ganon_shockwave",
            name: "점프 충격파",
            type: "shockwave",
            imageSrc: "img/bossSkill/ganon_shockwave.png",

        // 나방 먼지보다 적고, 넓게 퍼지게
            count: 5,
            radius: 24,
            speed: 5,

        // 보스 체력 50% 이상 / 미만 데미지
            damage: 12,
            enragedDamage: 20
        },
        {
            id: "ganon_fire",
            name: "파이어볼 장판",
            type: "fireZone",
            imageSrc: "img/bossSkill/ganon_fire.png",

    count: 3,              // 여러 개 생성
    gap: 300,              // 파이어볼 사이 간격

    warningTime: 2000,     // 2초 경고
    activeTime: 1200,
    damageInterval: 300,

    width: 120,
    height: 120,

    damage: 4,
    enragedDamage: 7
},
{
    id: "ganon_trident",
    name: "삼지창 집중 공격",
    type: "tridentConverge",

    imageSrcLeft: "img/bossSkill/ganon_trident_left.png",
    imageSrcCenter: "img/bossSkill/ganon_trident_center.png",
    imageSrcRight: "img/bossSkill/ganon_trident_right.png",

    width: 45,
    height: 100,
    speed: 7,

    damage: 16,
    enragedDamage: 25
}
]
};

const bossDie = () => {
    //말풍선? 이미지 변환
}

