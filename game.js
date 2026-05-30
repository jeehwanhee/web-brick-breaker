/*main.js, gameConfig.js의 전역변수
let level = 1;
let bricks = [];
let skills = [];
let totLife;        // 내 체력
let count;          // 부메랑 개수
let power;          // 공격력
let totBossLife;    // 보스 체력

const characterNum = 1;
const characterImg = new Image();
characterImg.src = `img/character/${characterNum}.png`;

const ballNum = 1;
const ballImg = new Image();
ballImg.src = `img/ball/${ballNum}.png`;

*/

let rightPressed = false;
let leftPressed = false;

let ball = null;   // 기존 코드 호환용: 첫 번째 공
let balls = [];    // 실제 게임에서 움직이는 공들
let bar = null;

let canvas = null;
let context = null;
let canvasWidth = null;
let canvasHeight = null;

let isRunning = false;
let animationId;


let life;
let bossLife;

let winning = false;

const skillKeys = ["Q", "W", "E"];

let bossSkillTimer = null;
const BOSS_ATTACK_DELAY = 5000;

const BOSS_WARNING_TIME = 1000;
const BOSS_RETURN_PAUSE_TIME = 1000;

let bossPhase = "normal";
// normal: 평상시
// warning: 보스 공격 전 경고
// attacking: 보스 공격 중
// returnPause: 보스 공격 끝난 직후 공 멈춤

let bossWarningTimer = null;
let bossReturnTimer = null;


let isBossAttacking = false;
let currentBossPattern = null;
let bossProjectiles = [];
let chainLightningEffects = [];

let bossPatternTimeouts = [];
let pendingSpawns = 0;
let spawningFinished = false;

const bossSkillImages = {};


const TIME_WARP_SCALE = 0.5;
const barrierheight = 30;

const BURN_DAMAGE = 3;
const BURN_INTERVAL = 500;
const BURN_DURATION = 3000;

const CHAIN_LIGHTNING_DAMAGE = 10;
const CHAIN_LIGHTNING_TARGET_COUNT = 4;
const CHAIN_LIGHTNING_RANGE = 220;

const REFLECT_SHIELD_RADIUS = 95;
const REFLECT_DAMAGE = 40;

let originbarspeed;
let isBarrieractive = false;
let isPenetrationactive = false;
let isShotballactive = false;
let isTimeWarpActive = false;
let isBurningBallActive = false;
let isChainLightningActive = false;
let isReflectActive = false;

window.addEventListener("load", () => {
    loadBossSkillImages();
    
    const gameButton = document.querySelector("#gameButton");
    gameButton.addEventListener("click", () => {
        advanceFromStoryScreen();
    });


    screenBack();
    
    canvas = document.querySelector('#canvas');
    context = canvas.getContext('2d');
    canvasWidth = canvas.width;
    canvasHeight = canvas.height;

    //바 좌우 움직임 관련 키 입력
    document.addEventListener("keydown", (e) => {
     if (e.key === "Right" || e.key === "ArrowRight") 
      rightPressed = true;
  else if (e.key === "Left" || e.key === "ArrowLeft") 
      leftPressed = true;
});

    document.addEventListener("keyup", (e) => {
     if (e.key === "Right" || e.key === "ArrowRight") 
      rightPressed = false;
  else if (e.key === "Left" || e.key === "ArrowLeft") 
      leftPressed = false;
});

    //게임시작 버튼 (처음 이후에는 pause, resume 역할)
    const controlButton = document.querySelector("#controlButton");

    controlButton.addEventListener("click", () => {
        
        if (isRunning) {
            controlButton.innerText = "resume";
            isRunning = false;
        }
        else {
            controlButton.innerText = "pause";
            isRunning = true;
            startGame();
        } 
    });

    //스킬
    window.addEventListener('keydown', (event) => {
        if (event.repeat) return;
        switch (event.key.toLowerCase()) {
        case 'q':
            useSkill('Q');
            break;
        case 'w':
            useSkill('W');
            break;
        case 'e':
            useSkill('E');
            break;
        }
    });

});

const initBoostScreen = () => {
    const boostContainer = document.querySelector("#boosts");

    showSkills = [];
    boostContainer.innerHTML = "";

    while (showSkills.length < 3) {
        const skill = skillList[Math.floor(Math.random()*skillList.length)];
        if (showSkills.includes(skill)) continue;
        if (skills.includes(skill)) continue;
        showSkills.push(skill);
        
    }

    for (let i=0; i<3; i++) {
        const container = document.createElement("div");
        container.classList.add("boost");
        container.innerText = `스킬 ${i+1}`
        const sName = document.createElement("div");
        sName.classList.add("text1");
        sName.innerText = showSkills[i];
        const sDescription = document.createElement("div");
        sDescription.classList.add("text2");
        sDescription.innerText = skillDescription[showSkills[i]];

        container.append(sName);
        container.append(sDescription);
        boostContainer.append(container);

        container.addEventListener("click", () => {
            skills.push(showSkills[i]);
            skillStates[skills.length - 1] = {
                name: showSkills[i],
                lastUsed: 0,
                activeUntil: 0,
                isActive: false
            };
            initScreen();
            initAnimation();
            screenMove("gameScreen");
        })
    }
    screenMove("boostScreen");
}

const initScreen = () => {
    //난이도 선택으로 결정되는 전역변수 등등
    
    switch(level) {
    case 1:
        level1Setting();
        level1Bricks();
        break;
    case 2:
        level2Setting();
        level2Bricks();
        break;
    case 3:
        level3Setting();
        level3Bricks();
        break;
    }
    bossImgUpdate("init");

    life = totLife; 
    bossLife = totBossLife;
    winning = false;
    const controlButton = document.querySelector("#controlButton");
    controlButton.innerText = "게임 시작";


    //스킬 세팅
    const skillsContainer = document.querySelector("#skills");
    skillsContainer.innerHTML = "";
    skills.forEach((skill, idx) => {
        const element = document.createElement("div");
        element.setAttribute("id", `skill${idx + 1}`);
        element.classList.add("skillBox");
        element.classList.add("skillReady");

        const skillName = document.createElement("div");
        skillName.classList.add("skillName");
        skillName.innerText = skill;

        const skillKey = document.createElement("div");
        skillKey.classList.add("skillKey");
        skillKey.innerText = skillKeys[idx];

        const skillCooldown = document.createElement("div");
        skillCooldown.classList.add("skillCooldown");
        skillCooldown.innerText = "READY";

        element.append(skillName);
        element.append(skillKey);
        element.append(skillCooldown);

        skillsContainer.append(element);
    });


    const levelText = document.querySelector("#level");
    levelText.innerText = `스테이지 ${level}`;

    
    controlButton.style.display = "block";

    updateUi();
    updateSkillUi();
};

//캔버스 관련 초기 설정 (bricks는 initScreen() -> levelNBricks()에서 초기화)
const initAnimation = () => {
    resetBalls();
    bar = new Bar();
    originbarspeed = bar.speed;
};

//hitbox 계산 책임만 Character로 이동
// 보스 공격 피격 판정은 캐릭터 표시 영역과 같은 hitbox를 사용합니다.
// 기존 호출부를 유지하기 위해 game.js 함수는 남기고 Character에 계산을 위임합니다.
const getCharacterHitBox = () => {
    return bar.character.getHitBox();
};

const getReflectShield = () => {
    const character = getCharacterHitBox();

    return {
        x: character.x + character.width / 2,
        y: character.y + character.height / 2,
        radius: REFLECT_SHIELD_RADIUS
    };
};

const createNewBall = (
    x = canvasWidth / 2,
    y = canvasHeight - 200,
    dx = 4,
    dy = -4,
    color = "#FF0000"
    ) => {
    return new Ball(x, y, dx, dy, color);
};

const resetBalls = () => {
    ball = createNewBall();
    balls = [ball];
};

const addBall = () => {
    const baseBall = balls.length > 0 ? balls[0] : createNewBall();

    const newBall = createNewBall(
        baseBall.x,
        baseBall.y,
        baseBall.dx > 0 ? -6 : 6,
        -Math.abs(baseBall.dy || 6),
        "#FF0000"
        );

    balls.push(newBall);
};
const fireShotballs = (baseBall) => {
    const shotBallVelocities = [
        { dx: -6, dy: -3 },
        { dx: -4, dy: -5 },
        { dx: 0,  dy: -6 },
        { dx: 4,  dy: -5 },
        { dx: 6,  dy: -3 },
    ];

    shotBallVelocities.forEach((velocity) => {
        const shotball = createNewBall(
            baseBall.x,
            baseBall.y,
            velocity.dx,
            velocity.dy,
            "#191919"
            );

        shotball.isShotball = true;
        balls.push(shotball);
    });
};
const firePenetrationBalls = (baseBall) => {
    const speed = 3;

    const penetrationBallLeft = createNewBall(
        baseBall.x,
        baseBall.y,
        -speed,
        -speed,
        "#AA00FF"
        );

    const penetrationBallRight = createNewBall(
        baseBall.x,
        baseBall.y,
        speed,
        -speed,
        "#AA00FF"
        );

    penetrationBallLeft.isPenetrationBall = true;
    penetrationBallRight.isPenetrationBall = true;

    balls.push(penetrationBallLeft);
    balls.push(penetrationBallRight);
};

const getProjectileSpeedScale = () => {
    return isTimeWarpActive ? TIME_WARP_SCALE : 1;
};

const getBallEffects = () => {
    return {
        barrier: isBarrieractive,
        penetrationReady: isPenetrationactive,
        shotballReady : isShotballactive,
        speedScale: getProjectileSpeedScale(),
    };
};

const updateBallWithEffects = (b, effects) => {
    handleBallWallCollision(b);
    handleBallBarCollision(b, effects);
    handleBallBottomCollision(b, effects);
    handleBallBrickCollision(b, effects);

    b.x += b.dx * effects.speedScale;
    b.y += b.dy * effects.speedScale;

    b.draw();
};

const handleBallWallCollision = (b) => {
    if (b.x < b.radius || b.x > canvasWidth - b.radius) {
        b.dx = -b.dx;
    }

    if (b.y < b.radius) {
        b.dy = -b.dy;
    }
};

const handleBallBarCollision = (b, effects) => {
    const hitBar =
    b.dy > 0 &&
    b.y + b.radius > bar.y &&
    b.y - b.radius < bar.y + 10 &&
    b.x - b.radius >= bar.x &&
    b.x + b.radius <= bar.x + bar.width;

    if (!hitBar) return;

    const hitPos = (b.x - (bar.x + bar.width / 2)) / (bar.width / 2);
    const maxAngle = Math.PI / 3;
    const angle = hitPos * maxAngle;
    const speed = Math.sqrt(b.dx * b.dx + b.dy * b.dy);
    b.dx = speed * Math.sin(angle);
    b.dy = -speed * Math.cos(angle);

    if (bar && bar.character) {
        // 공 충돌 판정식은 그대로 두고, 성공한 순간에만 캐릭터 attack 모션을 연결합니다.
        bar.character.startAttack();
    }

    // 관통 공 스킬이 준비되어 있으면
    // 처음 바에 튕긴 공 위치에서 관통 공 2개 발사
    if (effects.penetrationReady) {
        firePenetrationBalls(b);
        deactivePlayerSkill_penetration();
        deactivateSkillStateByName("관통 공");
    }

    if (effects.shotballReady) {
        fireShotballs(b);
        deactivatePlayerSkill_shotball();
        deactivateSkillStateByName("산탄공");
    }
};

const handleBallBottomCollision = (b, effects) => {
    const hitBottom = b.y > canvasHeight - b.radius;
    const hitBarrier = b.y > canvasHeight - barrierheight - b.radius;

    // 베리어가 켜져 있으면 바닥에 떨어지기 전에 베리어에서 튕김
    if (effects.barrier && hitBarrier) {
        b.dy = -Math.abs(b.dy);
        return;
    }

    // 베리어가 없으면 바닥에 닿은 공만 제거
    if (hitBottom) {
        b.isDead = true;
    }
};

const handleBallBrickCollision = (b, effects) => {
    if (b.isDead) return;
    bricks.forEach((brick) => {
        if (b.isDead) return;
        const isCollidingY =
        b.y + b.radius > brick.y &&
        b.y - b.radius < brick.y + brick.height &&
        b.x > brick.x &&
        b.x < brick.x + brick.width;

        const isCollidingX =
        b.x + b.radius > brick.x &&
        b.x - b.radius < brick.x + brick.width &&
        b.y > brick.y &&
        b.y < brick.y + brick.height;

        const isColliding = isCollidingY || isCollidingX;

        if (!isColliding) {
            removeBallHitBrickMemory(b, brick);
            return;
        }

        // 이 공 자체가 관통 공이면 튕기지 않고 데미지만 준다
        if (b.isPenetrationBall) {
            hitBrickOnceWhileOverlapping(b, brick);
            return;
        }

        // 일반 공은 기존처럼 튕긴다
        let flag = false;

        if (isCollidingY) {
            b.dy = -b.dy;
            flag = true;
        }

        if (isCollidingX) {
            b.dx = -b.dx;
            flag = true;
        }

        if (flag) {
            onBallHitBrick(b, brick);
        }
    });
};

const onBallHitBrick = (b, brick) => {
    brickHit(brick);

    if (isBurningBallActive) {
        applyBurnToBrick(brick);
        deactivatePlayerSkill_burningBall();
        deactivateSkillStateByName("타오르는 공");
    }

    if (isChainLightningActive) {
        triggerChainLightning(brick);
        deactivatePlayerSkill_chainLightning();
        deactivateSkillStateByName("연쇄 번개");
    }
};

const applyBurnToBrick = (brick) => {
    if (!brick) return;
    if (!bricks.includes(brick)) return;

    // 이미 불타는 중이면 중복 적용하지 않음
    if (brick.isBurning) return;

    brick.isBurning = true;

    const burnStartTime = Date.now();

    brick.burnTimer = setInterval(() => {
        const now = Date.now();

        // 이미 제거된 벽돌이면 중단
        if (!bricks.includes(brick)) {
            clearInterval(brick.burnTimer);
            brick.burnTimer = null;
            return;
        }

        // 지속시간 끝나면 중단
        if (now - burnStartTime >= BURN_DURATION) {
            brick.isBurning = false;
            clearInterval(brick.burnTimer);
            brick.burnTimer = null;
            return;
        }

        damageBrick(brick, BURN_DAMAGE);
    }, BURN_INTERVAL);
};

const getDistanceBetweenBricks = (brickA, brickB) => {
    const dx = brickA.centerX - brickB.centerX;
    const dy = brickA.centerY - brickB.centerY;

    return Math.sqrt(dx * dx + dy * dy);
};

const findChainLightningTargets = (originBrick) => {
    return bricks
    .filter((brick) => {
        if (brick === originBrick) return false;
        if (brick.hp <= 0) return false;

        const distance = getDistanceBetweenBricks(originBrick, brick);
        return distance <= CHAIN_LIGHTNING_RANGE;
    })
    .sort((a, b) => {
        return getDistanceBetweenBricks(originBrick, a) - getDistanceBetweenBricks(originBrick, b);
    })
    .slice(0, CHAIN_LIGHTNING_TARGET_COUNT);
};

const triggerChainLightning = (originBrick) => {
    if (!originBrick) return;

    const targets = findChainLightningTargets(originBrick);
    const now = Date.now();

    targets.forEach((targetBrick) => {
        damageBrick(targetBrick, CHAIN_LIGHTNING_DAMAGE);

        chainLightningEffects.push({
            startX: originBrick.centerX,
            startY: originBrick.centerY,
            endX: targetBrick.centerX,
            endY: targetBrick.centerY,
            createdAt: now,
            duration: 180
        });
    });
};
const hitBrickOnceWhileOverlapping = (b, brick) => {
    if (b.isDead) return;

    if (!b.hitBricks.includes(brick)) {
        onBallHitBrick(b, brick);
        b.hitBricks.push(brick);

        if (b.isPenetrationBall) {
            b.totalhitBricks++;

            if (b.totalhitBricks >= 10) {
                b.isDead = true;
            }
        }
    }
};

const removeBallHitBrickMemory = (b, brick) => {
    const index = b.hitBricks.indexOf(brick);

    if (index > -1) {
        b.hitBricks.splice(index, 1);
    }
};

const updateBalls = () => {
    const effects = getBallEffects();

    balls.forEach((b) => {
        updateBallWithEffects(b, effects);
    });

    balls = balls.filter((b) => !b.isDead);
    ball = balls[0] || null;

    // 모든 공이 떨어졌을 때만 부메랑 개수 감소
    if (balls.length === 0) {
        count -= 1;
        updateUi();

        if (count > 0) {
            resetBalls();
        }
    }
};

const drawBalls = () => {
    balls.forEach((b) => {
        b.draw();
    });
};

const increaseBarWidth = (amount = 40) => {
    const centerX = bar.x + bar.width / 2;

    bar.width = Math.min(bar.width + amount, 280);

    bar.x = centerX - bar.width / 2;

    if (bar.x < 0) {
        bar.x = 0;
    }

    if (bar.x + bar.width > canvasWidth) {
        bar.x = canvasWidth - bar.width;
    }
};

//프레임마다 움직일 애니메이션, updateUi호출, 공, 바, 블록 갱신
const animate = () => {
    if (!isRunning) {
        return;
    }

    updateUi();
    context.clearRect(0, 0, canvasWidth, canvasHeight);

    const now = Date.now(); //스킬 지속시간이 지나면 스킬 비활성화
    skillStates.forEach((state) => { 
        // 스킬이 활성화 상태인데, 종료 시간(activeUntil)이 현재 시간보다 과거라면?
        if (state.isActive && now >= state.activeUntil) {
            state.isActive = false; // 활성화 꺼줌

            // game.js 내부의 객체 상태를 원상복구 시키는 로직 실행
            if (state.name === "유체화") {
                deactivatePlayerSkill_ghost(); // 원래 속도로 복구
            }
            if (state.name === "베리어 생성") {
                deactivePlayerSkill_barrier();
            }
            if (state.name === "관통 공") {
                deactivePlayerSkill_penetration();
            }
            if (state.name === "산탄공") {
                deactivatePlayerSkill_shotball();
            }
            if (state.name === "시간감속") {
                deactivatePlayerSkill_timeWarp();
            }
            if (state.name === "타오르는 공") {
                deactivatePlayerSkill_burningBall();
            }
            if (state.name === "연쇄 번개") {
                deactivatePlayerSkill_chainLightning();
            }
            if (state.name === "튕겨 내기") {
                deactivatePlayerSkill_reflect();
            }
        }
    });
    
    if(isBarrieractive){
        context.save();
        context.fillStyle = "rgba(0, 191, 255, 0.4)"; 
        context.fillRect(0, canvasHeight - barrierheight, canvasWidth, barrierheight);
        context.restore();
    }
    if (bossPhase === "warning") {
    // WARNING 중: 공은 멈춤, 블럭은 보임, 바는 숨기고 캐릭터만 보임
        drawNormalGame(false, false);
        drawBossWarning();
    }
    else if (bossPhase === "attacking") {
    // 보스 패턴 중: 공/블럭/바 숨김, 캐릭터만 보임
        updateBossProjectiles();
        // 보스 공격 중에는 공/블럭은 숨기고, Bar가 가진 Character만 계속 이동/출력합니다.
        bar.update(false);
        checkBossAttackEnd();
    }
    else if (bossPhase === "returnPause") {
    // 보스 패턴 끝난 직후: 공/블럭 다시 보임, 공은 1초 멈춤
    // 바도 다시 보이게 하려면 true
        drawNormalGame(false, true);
    }
    else {
    // 평상시
        drawNormalGame(true, true);
    }
    drawReflectShield();
    animationId = requestAnimationFrame(animate);
};

const drawNormalGame = (moveBall, showBar = true) => {
    if (moveBall) {
        updateBalls();
    } else {
        drawBalls();
    }

    // updateCharacterOnly를 따로 두지 않고, showBar 값에 따라 Bar 객체가 bar 표시 여부를 직접 처리합니다.
    bar.update(showBar);

    bricks.forEach((brick) => {
        brick.draw();
    });

    drawChainLightningEffects();
};

const drawBossWarning = () => {
    context.save();

    context.fillStyle = "rgba(0, 0, 0, 0.45)";
    context.fillRect(0, 0, canvasWidth, canvasHeight);

    context.fillStyle = "red";
    context.font = "bold 64px Arial";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("WARNING!", canvasWidth / 2, canvasHeight / 2 - 40);

    context.fillStyle = "white";
    context.font = "bold 28px Arial";
    context.fillText("보스 공격이 시작됩니다", canvasWidth / 2, canvasHeight / 2 + 30);

    context.restore();
};

const drawChainLightningEffects = () => {
    const now = Date.now();

    chainLightningEffects.forEach((effect) => {
        const age = now - effect.createdAt;

        if (age > effect.duration) return;

        context.save();
        context.beginPath();
        context.moveTo(effect.startX, effect.startY);
        context.lineTo(effect.endX, effect.endY);
        context.strokeStyle = "rgba(120, 220, 255, 0.9)";
        context.lineWidth = 4;
        context.stroke();
        context.closePath();
        context.restore();
    });

    chainLightningEffects = chainLightningEffects.filter((effect) => {
        return now - effect.createdAt <= effect.duration;
    });
};

const drawReflectShield = () => {
    if (!isReflectActive) return;
    if (!bar) return;

    const shield = getReflectShield();

    context.save();
    context.beginPath();
    context.arc(shield.x, shield.y, shield.radius, 0, Math.PI * 2);
    context.fillStyle = "rgba(120, 220, 255, 0.18)";
    context.fill();
    context.lineWidth = 5;
    context.strokeStyle = "rgba(120, 220, 255, 0.9)";
    context.stroke();
    context.closePath();
    context.restore();
};

const startBossPattern = () => {
    if (bossSkillTimer !== null) return;
    if (isBossAttacking) return;

    bossSkillTimer = setTimeout(() => {
        bossSkillTimer = null;
        startBossAttackPhase();
    }, BOSS_ATTACK_DELAY);
};

const startGame = () => {
    startBossPattern();
    animate();
};

const startBossAttackPhase = () => {
    if (!isRunning) return;
    if (bossPhase !== "normal") return;

    bossPhase = "warning";

    bossWarningTimer = setTimeout(() => {
        bossWarningTimer = null;
        beginBossAttack();
    }, BOSS_WARNING_TIME);
};

const beginBossAttack = () => {
    if (!isRunning) return;

    currentBossPattern = pickBossPattern();

    if (currentBossPattern === null) {
        bossPhase = "normal";
        startBossPattern();
        return;
    }

    bossPhase = "attacking";
    isBossAttacking = true;

    bossProjectiles = [];
    bossPatternTimeouts = [];
    pendingSpawns = 0;
    spawningFinished = false;

    createBossPattern(currentBossPattern);

    if (pendingSpawns === 0) {
        spawningFinished = true;
    }
};



const pickBossPattern = () => {
    const patterns = bossPatternConfigs[level];
    const randomIndex = Math.floor(Math.random() * patterns.length);

    return patterns[randomIndex];
};

const createBossPattern = (pattern) => {
    switch (pattern.type) {
    case "powder":
        createMothPowder(pattern);
        break;

    case "diagonalWind":
        createDiagonalWind(pattern);
        break;

    case "charge":
        createCharge(pattern);
        break;

    case "lightningRain":
        createLightningRain(pattern);
        break;

    case "doubleFireball":
        createDoubleFireball(pattern);
        break;

    case "homingBat":
        createHomingBat(pattern);
        break;

    case "shockwave":
        createGanonShockwave(pattern);
        break;

    case "fireZone":
        createFireZone(pattern);
        break;

    case "tridentConverge":
        createTridentConverge(pattern);
        break;
    }
};

const createMothPowder = (pattern) => {
    const startX = canvasWidth / 2;
    const startY = 80;

    for (let i = 0; i < pattern.count; i++) {
        const angle = Math.PI * (0.1 + 0.8 * (i / (pattern.count - 1)));

        bossProjectiles.push({
            kind: "circle",
            x: startX,
            y: startY,
            dx: Math.cos(angle) * pattern.speed,
            dy: Math.sin(angle) * pattern.speed,
            radius: pattern.radius,
            damage: pattern.damage,
            imageSrc: pattern.imageSrc,
            hit: false
        });
    }
};

const createDiagonalWind = (pattern) => {
    bossProjectiles.push({
        kind: "rect",
        x: canvasWidth - 200,
        y: -pattern.height,
        dx: -pattern.speed,
        dy: pattern.speed,
        width: pattern.width,
        height: pattern.height,
        damage: pattern.damage,
        imageSrc: pattern.imageSrc,
        hit: false
    });
};

const createCharge = (pattern) => {
    bossProjectiles.push({
        kind: "rect",

        // 패턴 시작 순간의 플레이어 위치 위에서 떨어짐
        x: bar.x + bar.width / 2 - pattern.width / 2,
        y: -pattern.height,

        dx: 0,
        dy: pattern.speed,

        width: pattern.width,
        height: pattern.height,
        damage: pattern.damage,
        imageSrc: pattern.imageSrc,
        hit: false
    });
};

const createDoubleFireball = (pattern) => {
    bossProjectiles.push({
        kind: "circle",
        x: 180,
        y: -pattern.radius,
        dx: pattern.speed,
        dy: pattern.speed,
        radius: pattern.radius,
        damage: pattern.damage,
        imageSrc: pattern.imageSrc,
        hit: false
    });

    bossProjectiles.push({
        kind: "circle",
        x: canvasWidth - 180,
        y: -pattern.radius,
        dx: -pattern.speed,
        dy: pattern.speed,
        radius: pattern.radius,
        damage: pattern.damage,
        imageSrc: pattern.imageSrc,
        hit: false
    });
};

const getBossPatternDamage = (pattern) => {
    const hpRatio = bossLife / totBossLife;

    if (hpRatio >= 0.5) {
        return pattern.damage;
    }

    return pattern.enragedDamage;
};


const isProjectileOut = (projectile) => {
    const margin = 300;

    if (projectile.kind === "circle" || projectile.kind === "homing") {
        return (
            projectile.x < -margin ||
            projectile.x > canvasWidth + margin ||
            projectile.y < -margin ||
            projectile.y > canvasHeight + margin
            );
    }

    return (    
        projectile.x + projectile.width < -margin ||
        projectile.x > canvasWidth + margin ||
        projectile.y + projectile.height < -margin ||
        projectile.y > canvasHeight + margin
        );
};

const updateBossProjectiles = () => {
    const now = Date.now();
    const speedScale = getProjectileSpeedScale();

    bossProjectiles.forEach((projectile) => {
        if (projectile.kind === "fire") {
            drawFireZone(projectile, now);

            if (
                !projectile.reflected &&
                isFireActive(projectile, now) &&
                isProjectileHitBar(projectile)
                ) {
                if (now - projectile.lastDamageTime >= projectile.damageInterval) {
                    projectile.lastDamageTime = now;
                    life -= projectile.damage;
                    updateUi();
                }
            }

            return;
        }
        // 반사된 투사체 이동
        if (projectile.reflected) {
            projectile.x += projectile.dx * speedScale;
            projectile.y += projectile.dy * speedScale;

            drawBossProjectile(projectile);
            checkReflectedProjectileHitBoss(projectile);
            return;
        }

        if (projectile.kind === "homing") {
            updateHomingProjectile(projectile, speedScale);
        } else {
            projectile.x += projectile.dx * speedScale;
            projectile.y += projectile.dy * speedScale;
        }

        drawBossProjectile(projectile);

        //  플레이어 피격보다 먼저 방어막 반사 판정
        if (isProjectileHitReflectShield(projectile)) {
            reflectBossProjectile(projectile);
            return;
        }

        if (!projectile.hit && isProjectileHitBar(projectile)) {
            projectile.hit = true;
            life -= projectile.damage;
            updateUi();
        }
    });

    bossProjectiles = bossProjectiles.filter((projectile) => {
        if (projectile.isDead) return false;

        if (projectile.kind === "fire") {
            const now = Date.now();
            return now - projectile.createdAt < projectile.warningTime + projectile.activeTime;
        }

        return !isProjectileOut(projectile);
    });
};



const loadBossSkillImages = () => {
    Object.values(bossPatternConfigs).forEach((patterns) => {
        patterns.forEach((pattern) => {
            const imageSrcList = [
                pattern.imageSrc,
                pattern.imageSrcLeft,
                pattern.imageSrcCenter,
                pattern.imageSrcRight
            ];

            imageSrcList.forEach((imageSrc) => {
                if (imageSrc && !bossSkillImages[imageSrc]) {
                    const img = new Image();

                    img.onload = () => {
                        console.log("이미지 로드 성공:", imageSrc);
                    };

                    img.onerror = () => {
                        console.error("이미지 로드 실패:", imageSrc);
                    };

                    img.src = imageSrc;
                    bossSkillImages[imageSrc] = img;
                }
            });
        });
    });
};

const drawBossProjectile = (projectile) => {
    context.save();

    if (projectile.imageSrc) {
        const img = bossSkillImages[projectile.imageSrc];

        if (img && img.complete && img.naturalWidth > 0) {
            if (projectile.kind === "circle" || projectile.kind === "homing") {
                context.drawImage(
                    img,
                    projectile.x - projectile.radius,
                    projectile.y - projectile.radius,
                    projectile.radius * 2,
                    projectile.radius * 2
                    );
            } else {
                context.drawImage(
                    img,
                    projectile.x,
                    projectile.y,
                    projectile.width,
                    projectile.height
                    );
            }

            context.restore();
            return;
        }
    }

    context.fillStyle = "red";

    if (projectile.kind === "circle" || projectile.kind === "homing") {
        context.beginPath();
        context.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
        context.fill();
        context.closePath();
    } else {
        context.fillRect(projectile.x, projectile.y, projectile.width, projectile.height);
    }

    context.restore();
};

const scheduleBossSpawn = (delay, spawnFunction) => {
    pendingSpawns++;

    const timer = setTimeout(() => {
        spawnFunction();

        pendingSpawns--;

        if (pendingSpawns === 0) {
            spawningFinished = true;
        }
    }, delay);

    bossPatternTimeouts.push(timer);
};

const createLightningRain = (pattern) => {
    for (let i = 0; i < pattern.count; i++) {
        scheduleBossSpawn(i * pattern.interval, () => {
            const x = Math.random() * (canvasWidth - pattern.width);

            bossProjectiles.push({
                kind: "rect",
                x: x,
                y: -pattern.height,
                dx: 0,
                dy: pattern.speed,
                width: pattern.width,
                height: pattern.height,
                damage: pattern.damage,
                imageSrc: pattern.imageSrc,
                hit: false
            });
        });
    }
};

const createHomingBat = (pattern) => {
    for (let i = 0; i < pattern.count; i++) {
        bossProjectiles.push({
            kind: "homing",
            x: canvasWidth * (0.3 + i * 0.4),
            y: 50,
            dx: 0,
            dy: 0,

            xSpeed: pattern.xSpeed,
            ySpeed: pattern.ySpeed,

            radius: pattern.radius,
            damage: pattern.damage,
            imageSrc: pattern.imageSrc,
            hit: false
        });
    }
};

const updateHomingProjectile = (projectile, speedScale = 1) => {
    const targetX = bar.x + bar.width / 2;
    const diffX = targetX - projectile.x;

    const xMove = projectile.xSpeed * speedScale;
    const yMove = projectile.ySpeed * speedScale;

    if (Math.abs(diffX) <= xMove) {
        projectile.x = targetX;
    } else if (diffX > 0) {
        projectile.x += xMove;
    } else {
        projectile.x -= xMove;
    }

    projectile.y += yMove;
};

const createGanonShockwave = (pattern) => {
    const waveCount = pattern.waveCount || 2;
    const waveInterval = pattern.waveInterval || 900;

    for (let wave = 0; wave < waveCount; wave++) {
        scheduleBossSpawn(wave * waveInterval, () => {
            createOneGanonShockwave(pattern);
        });
    }
};

const createOneGanonShockwave = (pattern) => {
    const startX = canvasWidth / 2;
    const startY = 90;
    const damage = getBossPatternDamage(pattern);

    for (let i = 0; i < pattern.count; i++) {
        const ratio = pattern.count === 1 ? 0.5 : i / (pattern.count - 1);

        // 넓게 퍼지는 각도
        const angle = Math.PI * (0.08 + 0.84 * ratio);

        bossProjectiles.push({
            kind: "circle",
            x: startX,
            y: startY,
            dx: Math.cos(angle) * pattern.speed,
            dy: Math.sin(angle) * pattern.speed,
            radius: pattern.radius,
            damage: damage,
            imageSrc: pattern.imageSrc,
            hit: false
        });
    }
};
const createFireZone = (pattern) => {
    const damage = getBossPatternDamage(pattern);

    const count = pattern.count || 3;
    const spawnInterval = pattern.spawnInterval || 1200;

    for (let i = 0; i < count; i++) {
        scheduleBossSpawn(i * spawnInterval, () => {
            const centerX = bar.x + bar.width / 2;
            const centerY = bar.y + bar.height / 2;

            let fireX = centerX - pattern.width / 2;
            let fireY = centerY - pattern.height / 2;

            // 화면 밖으로 안 나가게 보정
            fireX = Math.max(0, Math.min(fireX, canvasWidth - pattern.width));
            fireY = Math.max(0, Math.min(fireY, canvasHeight - pattern.height));

            bossProjectiles.push({
                kind: "fire",

                x: fireX,
                y: fireY,

                width: pattern.width,
                height: pattern.height,

                damage: damage,
                damageInterval: pattern.damageInterval,

                warningTime: pattern.warningTime,
                activeTime: pattern.activeTime,
                createdAt: Date.now(),
                lastDamageTime: 0,

                imageSrc: pattern.imageSrc,
                hit: false
            });
        });
    }
};
const createTridentConverge = (pattern) => {
    const targetX = bar.x + bar.width / 2;
    const targetY = bar.y + bar.height / 2;
    const damage = getBossPatternDamage(pattern);

    const tridents = [
        {
            direction: "left",
            x: 80,
            y: -pattern.height,
            imageSrc: pattern.imageSrcLeft
        },
        {
            direction: "center",
            x: canvasWidth / 2 - pattern.width / 2,
            y: -pattern.height,
            imageSrc: pattern.imageSrcCenter
        },
        {
            direction: "right",
            x: canvasWidth - 80 - pattern.width,
            y: -pattern.height,
            imageSrc: pattern.imageSrcRight
        }
    ];

    tridents.forEach((trident) => {
        const startCenterX = trident.x + pattern.width / 2;
        const startCenterY = trident.y + pattern.height / 2;

        const vx = targetX - startCenterX;
        const vy = targetY - startCenterY;
        const length = Math.sqrt(vx * vx + vy * vy);

        bossProjectiles.push({
            kind: "rect",

            x: trident.x,
            y: trident.y,

            dx: (vx / length) * pattern.speed,
            dy: (vy / length) * pattern.speed,

            width: pattern.width,
            height: pattern.height,

            damage: damage,
            imageSrc: trident.imageSrc,
            direction: trident.direction,
            hit: false
        });
    });
};

const isFireActive = (projectile, now) => {
    return now - projectile.createdAt >= projectile.warningTime;
};

const drawFireZone = (projectile, now) => {
    context.save();

    if (!isFireActive(projectile, now)) {
        // 불이 붙기 전 경고 표시
        context.strokeStyle = "rgba(255, 0, 0, 0.9)";
        context.lineWidth = 4;
        context.strokeRect(projectile.x, projectile.y, projectile.width, projectile.height);

        context.fillStyle = "rgba(255, 0, 0, 0.2)";
        context.fillRect(projectile.x, projectile.y, projectile.width, projectile.height);

        context.restore();
        return;
    }

    // 불 활성화 상태
    const img = bossSkillImages[projectile.imageSrc];

    if (img && img.complete && img.naturalWidth > 0) {
        context.drawImage(
            img,
            projectile.x,
            projectile.y,
            projectile.width,
            projectile.height
            );
    } else {
        context.fillStyle = "rgba(255, 80, 0, 0.8)";
        context.fillRect(projectile.x, projectile.y, projectile.width, projectile.height);
    }

    context.restore();
};

const isProjectileHitBar = (projectile) => {
    const character = getCharacterHitBox();

    const targetLeft = character.x;
    const targetRight = character.x + character.width;
    const targetTop = character.y;
    const targetBottom = character.y + character.height;

    if (projectile.kind === "circle" || projectile.kind === "homing") {
        const closestX = Math.max(targetLeft, Math.min(projectile.x, targetRight));
        const closestY = Math.max(targetTop, Math.min(projectile.y, targetBottom));

        const distanceX = projectile.x - closestX;
        const distanceY = projectile.y - closestY;

        return distanceX * distanceX + distanceY * distanceY <= projectile.radius * projectile.radius;
    }

    const projectileLeft = projectile.x;
    const projectileRight = projectile.x + projectile.width;
    const projectileTop = projectile.y;
    const projectileBottom = projectile.y + projectile.height;

    return (
        targetRight > projectileLeft &&
        targetLeft < projectileRight &&
        targetBottom > projectileTop &&
        targetTop < projectileBottom
        );
};

const isProjectileHitReflectShield = (projectile) => {
    if (!isReflectActive) return false;
    if (projectile.reflected) return false;
    if (projectile.kind === "fire") return false;

    const shield = getReflectShield();

    if (projectile.kind === "circle" || projectile.kind === "homing") {
        const dx = projectile.x - shield.x;
        const dy = projectile.y - shield.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        return distance <= projectile.radius + shield.radius;
    }

    const closestX = Math.max(
        projectile.x,
        Math.min(shield.x, projectile.x + projectile.width)
        );

    const closestY = Math.max(
        projectile.y,
        Math.min(shield.y, projectile.y + projectile.height)
        );

    const dx = shield.x - closestX;
    const dy = shield.y - closestY;

    return dx * dx + dy * dy <= shield.radius * shield.radius;
};

const reflectBossProjectile = (projectile) => {
    projectile.reflected = true;
    projectile.hit = true;

    const shield = getReflectShield();

    // 보스 쪽으로 날아가게
    const targetX = canvasWidth / 2;
    const targetY = 60;

    const startX = getProjectileCenterX(projectile);
    const startY = getProjectileCenterY(projectile);

    const vx = targetX - startX;
    const vy = targetY - startY;
    const length = Math.sqrt(vx * vx + vy * vy) || 1;

    const speed = 10;

    projectile.dx = (vx / length) * speed;
    projectile.dy = (vy / length) * speed;

    // homing은 더 이상 유도하지 않도록 reflected 상태에서 일반 이동 처리
    projectile.x = startX;
    projectile.y = startY;

    // rect 타입도 반사 후 중심 좌표 기준으로 움직이게 보정
    if (projectile.kind !== "circle" && projectile.kind !== "homing") {
        projectile.x = startX - projectile.width / 2;
        projectile.y = startY - projectile.height / 2;
    }
};

const checkReflectedProjectileHitBoss = (projectile) => {
    if (!projectile.reflected) return false;

    const centerY = getProjectileCenterY(projectile);

    // 화면 위쪽 보스 영역에 도달하면 보스에게 피해
    if (centerY <= 90) {
        bossLife -= REFLECT_DAMAGE;
        bossImgUpdate("attacked");
        updateUi();

        projectile.isDead = true;
        return true;
    }

    return false;
};


const getProjectileCenterX = (projectile) => {
    if (projectile.kind === "circle" || projectile.kind === "homing") {
        return projectile.x;
    }

    return projectile.x + projectile.width / 2;
};

const getProjectileCenterY = (projectile) => {
    if (projectile.kind === "circle" || projectile.kind === "homing") {
        return projectile.y;
    }

    return projectile.y + projectile.height / 2;
};

const checkBossAttackEnd = () => {
    if (!isBossAttacking) return;

    if (spawningFinished && bossProjectiles.length === 0) {
        endBossAttackPhase();
    }
};

const endBossAttackPhase = () => {
    isBossAttacking = false;
    currentBossPattern = null;
    bossProjectiles = [];
    clearBossPatternTimeouts();

    bossPhase = "returnPause";

    bossReturnTimer = setTimeout(() => {
        bossReturnTimer = null;
        bossPhase = "normal";

        // 다음 보스 공격 예약
        startBossPattern();
    }, BOSS_RETURN_PAUSE_TIME);
};

const clearBossPatternTimeouts = () => {
    bossPatternTimeouts.forEach((timer) => {
        clearTimeout(timer);
    });

    bossPatternTimeouts = [];
};

const stopBossPattern = () => {
    clearTimeout(bossSkillTimer);
    bossSkillTimer = null;

    clearTimeout(bossWarningTimer);
    bossWarningTimer = null;

    clearTimeout(bossReturnTimer);
    bossReturnTimer = null;

    clearBossPatternTimeouts();

    bossPhase = "normal";
    isBossAttacking = false;
    currentBossPattern = null;
    bossProjectiles = [];
    pendingSpawns = 0;
    spawningFinished = false;
};
const isSkillEffectActive = (skillName) => {
    if (skillName === "베리어 생성") {
        return isBarrieractive;
    }

    if (skillName === "유체화") {
        return false;
    }

    if (skillName === "시간감속") {
        return isTimeWarpActive;
    }

    if (skillName === "관통 공") {
        return isPenetrationactive;
    }

    if (skillName === "산탄공") {
        return isShotballactive;
    }

    if (skillName === "타오르는 공") {
        return isBurningBallActive;
    }

    if (skillName === "연쇄 번개") {
        return isChainLightningActive;
    }

    if (skillName === "튕겨 내기") {
        return isReflectActive;
    }

    return false;
};

const updateSkillUi = () => {
    const now = Date.now();

    skillStates.forEach((state, idx) => {
        if (!state || !state.name) return;

        const skillElement = document.querySelector(`#skill${idx + 1}`);
        if (!skillElement) return;

        const cooldownElement = skillElement.querySelector(".skillCooldown");
        const config = skillData[state.name];

        if (!config) return;

        const cooldownEndTime = state.lastUsed + config.cooldown;
        const cooldownLeft = cooldownEndTime - now;

        const isEffectActive = isSkillEffectActive(state.name);

        skillElement.classList.remove(
            "skillReady",
            "skillCooldownState",
            "skillActiveState"
            );

        // 실제 스킬 효과가 살아있는 동안만 ACTIVE 표시
        if (isEffectActive) {
            skillElement.classList.add("skillActiveState");

            if (cooldownElement) {
                cooldownElement.innerText = "ACTIVE";
            }

            return;
        }

        // 효과가 끝났지만 쿨타임이 남아 있으면 쿨타임 표시
        if (cooldownLeft > 0) {
            skillElement.classList.add("skillCooldownState");

            if (cooldownElement) {
                cooldownElement.innerText = `${Math.ceil(cooldownLeft / 1000)}s`;
            }

            return;
        }

        // 쿨타임도 끝났으면 READY
        skillElement.classList.add("skillReady");

        if (cooldownElement) {
            cooldownElement.innerText = "READY";
        }
    });
};

//캔버스 제외 화면 갱신, animate에서 호출 됨
const updateUi = () => {
    const bossLifeText = document.querySelector("#bossLife");
    const lifeText = document.querySelector("#life");
    const countText = document.querySelector("#count");

    bossLifeText.innerText = `보스 체력 : ${bossLife >= 0 ? bossLife : 0} / ${totBossLife}`;
    lifeText.innerText = `내 체력 : ${life >= 0 ? life : 0} / ${totLife}`;
    countText.innerText = `남은 부메랑 : ${count}`;

    updateSkillUi();

    if (bossLife <= 0 && !winning) {
    // 승리 처리가 여러 번 실행되는 것 방지
        winning = true;

        cancelAnimationFrame(animationId);
        isRunning = false;
        context.clearRect(0, 0, canvasWidth, canvasHeight);

        bossDie();

        level++;
        showStoryScreen();

        return;
    }

    if (life <= 0 || count <= 0) {
        //패배
        cancelAnimationFrame(animationId);
        isRunning = false;
        context.clearRect(0, 0, canvasWidth, canvasHeight);
        context.beginPath();
        context.fillStyle = 'black';
        context.font = '48px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText("패배했습니다..", canvasWidth/2, canvasHeight/2);
        context.closePath();

        controlButton.style.display = "none";
    }
};


const screenBack = () => {
    const gameScreen = document.querySelector("#gameScreen");

    const backButton = gameScreen.querySelector(".backBtn");
    backButton.addEventListener("click", () => {
        if(confirm("정말 종료하시겠습니까?")) {
            screenMove("initScreen");

            stopBossPattern();
            cancelAnimationFrame(animationId);
            isRunning = false;
            context.clearRect(0, 0, canvasWidth, canvasHeight);
        }
    });
}

//q,w,e 키를 눌렀을때 -> 스킬 처리 
//(레벨에 따라 q,w,e 중 어디까지 유효한지 확인해야함 = 레벨2는 e키는 작동X)
const useSkill = (key) => {
    if (!isRunning) return; 

    let skillIdx = skillKeys.indexOf(key);
    if (skillIdx === -1 || skillIdx > skills.length-1) return;
    let skillname = skills[skillIdx];
    let state = skillStates[skillIdx];
    if (!state || !state.name) return; // 장착된 스킬이 없음
    

    const config = skillData[state.name];
    if (!config) return;
    

    const now = Date.now();

    // 1. 쿨타임 체크 (현재시간 - 마지막 사용시간 >= 쿨타임)
    if (now - state.lastUsed < config.cooldown) {
        return;
    }

    // 2. 스킬 발동 상태 저장
    state.lastUsed = now;
    state.activeUntil = now + config.duration;
    state.isActive = true;

    // 3. 스킬 고유 효과 실행
    if(skillname == "유체화"){
        activatePlayerSkill_ghost();
    }
    if(skillname == "베리어 생성"){
        activePlayerSkill_barrier();
    }
    if(skillname == "관통 공"){
        activePlayerSkill_penetration();
    }
    if(skillname == "산탄공"){
        activePlayerSkill_shotball();
    }
    if (skillname == "시간감속") {
        activePlayerSkill_timeWarp();
    }
    if (skillname == "타오르는 공") {
        activePlayerSkill_burningBall();
    }
    if (skillname == "연쇄 번개") {
        activePlayerSkill_chainLightning();
    }
    if (skillname == "튕겨 내기") {
        activePlayerSkill_reflect();
    }
    updateUi(); // UI에 즉시 반영 (예: 쿨타임 도는 애니메이션 시작 등)
};

const activatePlayerSkill_ghost = () =>{
    bar.speed = originbarspeed*1.7;
}
const deactivatePlayerSkill_ghost = () =>{
    bar.speed = originbarspeed;
}

const activePlayerSkill_barrier = () =>{
    isBarrieractive = true;
}
const deactivePlayerSkill_barrier = ()=>{
    isBarrieractive = false;
}

const activePlayerSkill_penetration = ()=>{
    isPenetrationactive = true;
}
const deactivePlayerSkill_penetration = ()=>{
    isPenetrationactive = false;
}

const activePlayerSkill_shotball = ()=>{
    isShotballactive = true;
}
const deactivatePlayerSkill_shotball = ()=>{
    isShotballactive = false;
}

const activePlayerSkill_timeWarp = () => {
    isTimeWarpActive = true;
};
const deactivatePlayerSkill_timeWarp = () => {
    isTimeWarpActive = false;
};

const activePlayerSkill_burningBall = () => {
    isBurningBallActive = true;
};
const deactivatePlayerSkill_burningBall = () => {
    isBurningBallActive = false;
};

const activePlayerSkill_chainLightning = () => {
    isChainLightningActive = true;
};
const deactivatePlayerSkill_chainLightning = () => {
    isChainLightningActive = false;
};

const activePlayerSkill_reflect = () => {
    isReflectActive = true;
};
const deactivatePlayerSkill_reflect = () => {
    isReflectActive = false;
};

const deactivateSkillStateByName = (skillName) => {
    const state = skillStates.find((skillState) => {
        return skillState.name === skillName;
    });

    if (!state) return;

    state.isActive = false;
    state.activeUntil = 0;
};
