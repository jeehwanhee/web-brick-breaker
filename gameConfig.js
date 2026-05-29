


class Ball {
    constructor(x, y, dx, dy, color)
    {
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        this.radius = 10;
        this.color = color;
        this.hitBricks =[];
        this.totalhitBricks = 0;
        this.isPenetrationBall = false;
        this.isShotball = false;
        this.isDead = false;
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

        // 바에 부딪혔을 때
        if (
            (this.y + this.radius > bar.y && this.y - this.radius < bar.y + 10) &&
            (this.x - this.radius >= bar.x && this.x + this.radius <= bar.x + bar.width)
        ) {
            this.dy = -Math.abs(this.dy);
        }

        // 바닥에 닿았을 때
        if (this.y > canvasHeight - this.radius) {
            this.isDead = true;
            return;
        }

        // 벽돌에 부딪혔을 때
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

            if (flag) {
                brickHit(brick);
            }
        });

        this.x += this.dx;
        this.y += this.dy;
        this.draw();
    }
}

//Character클래스
// 캐릭터 이미지, 애니메이션 상태, 보스 공격 피격 hitbox를 담당합니다.
// 공과 bar 충돌 판정은 기존 Bar 값을 그대로 쓰고, 캐릭터는 화면 표시와 보스 피격 기준만 맡습니다.
class Character {
    constructor(ownerBar, characterId = characterNum) {
        // Bar 위치를 기준으로 캐릭터 위치를 계산해야 해서 Bar 인스턴스를 참조합니다.
        this.ownerBar = ownerBar;
        this.characterId = characterId;

        this.state = "idle";
        this.frameIndex = 0;
        this.frameTimer = 0;
        this.frameDelay = 5;

        this.width = 100;
        this.height = 150;
        this.animations = {};

        this.loadConfig(characterId);

        this.isAttackLocked = false;
        this.attackTimer = 0;
        this.attackDuration = this.frameDelay*this.animations["attack"].length;
    }

    startAttack() {
        // 공이 bar에 닿았을 때 attack 모션이 바로 idle/move로 덮이지 않게 잠깐 잠급니다.
        this.setState("attack");
        this.isAttackLocked = true;
        this.attackTimer = this.attackDuration;
    }

    updateAttackTimer() {
        if (!this.isAttackLocked) return;

        this.attackTimer--;

        if (this.attackTimer <= 0) {
            this.isAttackLocked = false;
        }
    }

    loadConfig(characterId) {
        // 선택한 캐릭터 번호에 맞는 이미지 경로를 Image 객체 배열로 바꿉니다.
        // 없는 캐릭터 번호가 들어오면 1번 캐릭터 설정을 사용해 게임이 멈추지 않게 합니다.
        const config = characterAnimationConfig[characterId] || characterAnimationConfig[1];

        this.characterId = characterId;
        this.width = config.width;
        this.height = config.height;
        this.animations = {};

        Object.keys(config.animations).forEach((state) => {
            this.animations[state] = config.animations[state].map(createImage);
        });

        this.state = "idle";
        this.frameIndex = 0;
        this.frameTimer = 0;
    }

    setCharacter(characterId) {
        // 설정 화면에서 캐릭터를 바꿨을 때 현재 Bar가 가진 Character 설정도 함께 교체합니다.
        this.loadConfig(characterId);
    }

    setState(state) {
        // 상태가 바뀔 때 프레임을 처음부터 재생해야 idle/move/attack 전환이 자연스럽습니다.
        if (this.state === state) return;

        this.state = state;
        this.frameIndex = 0;
        this.frameTimer = 0;
    }

    getFramesByState(state) {
        // 선택한 상태 이미지가 없으면 idle을 대신 사용해 캐릭터 이미지 누락에도 안전하게 동작합니다.
        const frames = this.animations[state];

        if (frames && frames.length > 0) {
            return frames;
        }

        return this.animations.idle || [];
    }

    updateFrame() {
        // requestAnimationFrame 루프가 돌 때마다 타이머를 올려 일정 간격으로 프레임을 바꿉니다.
        const frames = this.getFramesByState(this.state);

        if (!frames || frames.length <= 1) return;

        this.frameTimer++;

        if (this.frameTimer >= this.frameDelay) {
            this.frameTimer = 0;
            this.frameIndex = (this.frameIndex + 1) % frames.length;
        }
    }

    getCurrentFrame() {
        // 아직 로딩 중이거나 실패한 이미지는 그리지 않고 fallback으로 넘깁니다.
        const frames = this.getFramesByState(this.state);

        if (!frames || frames.length === 0) {
            return null;
        }

        const frame = frames[this.frameIndex % frames.length];

        if (!frame || frame.failed || !frame.complete) {
            return null;
        }

        return frame;
    }

    getHitBox() {
        // 캐릭터 표시 위치와 보스 공격 피격 판정을 같은 사각형으로 맞춥니다.
        return {
            x: this.ownerBar.x + (this.ownerBar.width - this.width) / 2,
            y: this.ownerBar.y + this.ownerBar.height,
            width: this.width,
            height: this.height
        };
    }

    draw() {
        // 캐릭터 출력은 항상 이 메서드에서 처리해 평상시와 보스 공격 구간의 표시 방식을 통일합니다.
        this.updateAttackTimer();
        this.updateFrame();

        const frame = this.getCurrentFrame();
        const rect = this.getHitBox();

        if (frame) {
            context.beginPath();
            context.drawImage(frame, rect.x, rect.y, rect.width, rect.height);
            context.closePath();
        }
        else{
            // 이미지 로딩 실패 시 플레이어 위치를 보여주기 위한 fallback
            context.beginPath();
            context.rect(rect.x, rect.y, rect.width, rect.height);
            context.fillStyle = "#0095DD";
            context.fill();
            context.closePath();
        }
    }
}

class Bar {
    constructor() {
        this.width = 150;
        this.height = 10;
        this.speed = 7;
        
        this.x = (canvasWidth - this.width) / 2;
        this.y = canvasHeight - this.height - 10 - 160;

        // Bar가 Character를 소유하게 해서 캐릭터 출력과 hitbox 계산을 한곳에서 관리합니다.
        this.character = new Character(this, characterNum);
    }

    drawDefaultBar() {
        // 이미지가 없거나 fallback이 필요할 때 기존 bar 형태로 계속 플레이할 수 있게 합니다.
        context.beginPath();
        context.rect(this.x, this.y, this.width, this.height);
        context.fillStyle = "#0095DD";
        context.fill();
        context.closePath();
    }

    draw(showDefaultBar = true) {
        // showDefaultBar가 false면 보스 공격 구간에서 bar 사각형은 숨기고 캐릭터만 보여줍니다.
        if(showDefaultBar){
            this.drawDefaultBar();
        }
        
        this.character.draw();
    }

    // 이동 입력은 기존 Bar 이동 로직을 유지하고, 이동 결과에 따라 캐릭터 상태만 바꿉니다.
    update(showDefaultBar = true) {
    let nextCharacterState = "idle";

    if (rightPressed && this.x < canvasWidth - this.width) {
        this.x += this.speed;
        nextCharacterState = "moveRight";
    } else if (leftPressed && this.x > 0) {
        this.x -= this.speed;
        nextCharacterState = "moveLeft";
    }

    if (!this.character.isAttackLocked) {
        this.character.setState(nextCharacterState);
    }

    this.draw(showDefaultBar);
}
}

class Brick {
    constructor(x,y,width=100,height=20, color="#ffffff", hp=50, itmeChance=0.5) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color || "#ffffff";
        this.normalColor = this.color;
        this.hp = hp;
        this.totalHp = hp;

        this.isBurning = false;
        this.burnTimer = null;

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

        const isBurnBlinkOn = this.isBurning && Math.floor(Date.now() / 150) % 2 === 0;

        if (isBurnBlinkOn) {
            context.fillStyle = "#ff3333";
        } else {
            context.fillStyle = this.normalColor;
        }

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
const damageBrick = (brick, damage) => {
    if (!brick) return;
    if (!bricks.includes(brick)) return;

    brick.update(brick.hp - damage);

    if (brick.hp <= 0) {
        bossLife -= brick.totalHp;
        bricks = bricks.filter(b => b.hp > 0);

        if (brick.item != "") {
            itemAbility[brick.item](10); 
            brick.item = "";
        }

        if (brick.burnTimer) {
            clearInterval(brick.burnTimer);
            brick.burnTimer = null;
        }

        brick.isBurning = false;
    }

    bossImgUpdate("attacked");
};

const brickHit = (brick) => {
    damageBrick(brick, power);
};


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
    totBossLife = 500;
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

            count: 5,
            radius: 24,
            speed: 5,

    // 쇼크웨이브 묶음을 몇 번 날릴지
            waveCount: 2,

    // 다음 쇼크웨이브 묶음까지의 시간
            waveInterval: 900,

            damage: 12,
            enragedDamage: 20
        },
        {
            id: "ganon_fire",
            name: "추적 파이어볼 장판",
            type: "fireZone",
            imageSrc: "img/bossSkill/ganon_fire.png",

            count: 3,

    // 몇 초 간격으로 다음 경고를 만들지
            spawnInterval: 1200,

            warningTime: 1500,
            activeTime: 1000,
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

// 스킬 스펙 및 이펙트 정의 데이터베이스
const skillData = {
    "베리어 생성": {
        cooldown: 1500,  
        duration: 1000,    
    },
    "유체화": {
        cooldown: 20000,    
        duration: 3000,    

    },
    "시간감속": {
        cooldown: 12000,
        duration: 3000,
    },
    "관통 공":{
        cooldown: 2000,
        duration: 10000,
    },
    "산탄공":{
        cooldown: 2000,
        duration: 10000,
    },
    "타오르는 공": {
        cooldown: 8000,
        duration: 10000,
    },
    "연쇄 번개": {
        cooldown: 8000,
        duration: 10000,
    },
    "튕겨 내기": {
        cooldown: 10000,
        duration: 1000,
    }
    
};

// 현재 플레이어가 장착한 스킬들의 실시간 상태 관리
let skillStates = [
    { name: "", lastUsed: 0, activeUntil: 0, isActive: false },
    { name: "", lastUsed: 0, activeUntil: 0, isActive: false },
    { name: "", lastUsed: 0, activeUntil: 0, isActive: false }
];
