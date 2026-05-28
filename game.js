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

let ball = null;
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

let bossPatternTimeouts = [];
let pendingSpawns = 0;
let spawningFinished = false;

const bossSkillImages = {};


window.addEventListener("load", () => {
    loadBossSkillImages();
    
    const gameButton = document.querySelector("#gameButton");
    gameButton.addEventListener("click", () => {
        initBoostScreen();
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
        if (winning) {
            controlButton.innerText = "pause";
            winning = false;

            level++;
            screenMove("storyScreen");

        }
        else if (isRunning) {
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
        level1Setting();
        level1Bricks();
        break;
    case 3:
        level1Setting();
        level1Bricks();
        break;
    }
    bossImgUpdate("init");

    life = totLife; 
    bossLife = totBossLife;


    //스킬 세팅
    const skillsContainer = document.querySelector("#skills");
    skillsContainer.innerHTML = "";
    skills.forEach((skill, idx) => {
        const element = document.createElement("div");
        element.setAttribute("id",`skill${idx+1}`);
        element.setAttribute("display", "flex");

        const skillName = document.createElement("div");
        skillName.innerText = skill;

        const skillKey = document.createElement("div");
        skillKey.innerText = skillKeys[idx];

        element.append(skillName);
        element.append(skillKey);


        skillsContainer.append(element);


    });


    const levelText = document.querySelector("#level");
    levelText.innerText = `스테이지 ${level}`;

    
    controlButton.style.display = "block";

    updateUi();
};

//캔버스 관련 초기 설정 (bricks는 initScreen() -> levelNBricks()에서 초기화)
const initAnimation = () => {
    const x = canvasWidth / 2;
    const y = canvasHeight - 200;
    const dx = 6;
    const dy = -6;
    const color = "#FF0000";
    ball = new Ball(x,y,dx,dy,color);

    bar = new Bar();
};

//프레임마다 움직일 애니메이션, updateUi호출, 공, 바, 블록 갱신
const animate = () => {
    if (!isRunning) {
        return;
    }

    updateUi();
    context.clearRect(0, 0, canvasWidth, canvasHeight);

    if (bossPhase === "warning") {
    // WARNING 중: 공은 멈춤, 블럭은 보임, 바는 숨기고 캐릭터만 보임
        drawNormalGame(false, false);
        drawBossWarning();
    }
    else if (bossPhase === "attacking") {
    // 보스 패턴 중: 공/블럭/바 숨김, 캐릭터만 보임
        updateBossProjectiles();
        updateCharacterOnly();
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

    animationId = requestAnimationFrame(animate);
};

const drawNormalGame = (moveBall, showBar = true) => {
    if (moveBall) {
        ball.update();
    } else {
        ball.draw();
    }

    if (showBar) {
        bar.update();
    } else {
        updateCharacterOnly();
    }

    bricks.forEach((brick) => {
        brick.draw();
    });
};
const updateCharacterOnly = () => {
    if (rightPressed && bar.x < canvasWidth - bar.width) {
        bar.x += bar.speed;
    } else if (leftPressed && bar.x > 0) {
        bar.x -= bar.speed;
    }

    context.beginPath();
    context.drawImage(
        characterImg,
        bar.x + (bar.width - 100) / 2,
        bar.y + 10,
        100,
        150
        );
    context.closePath();
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

    bossProjectiles.forEach((projectile) => {
        if (projectile.kind === "fire") {
            drawFireZone(projectile, now);

            if (isFireActive(projectile, now) && isProjectileHitBar(projectile)) {
                if (now - projectile.lastDamageTime >= projectile.damageInterval) {
                    projectile.lastDamageTime = now;
                    life -= projectile.damage;
                    updateUi();
                }
            }

            return;
        }

        if (projectile.kind === "homing") {
            updateHomingProjectile(projectile);
        } else {
            projectile.x += projectile.dx;
            projectile.y += projectile.dy;
        }

        drawBossProjectile(projectile);

        if (!projectile.hit && isProjectileHitBar(projectile)) {
            projectile.hit = true;
            life -= projectile.damage;
            updateUi();
        }
    });

    bossProjectiles = bossProjectiles.filter((projectile) => {
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

const updateHomingProjectile = (projectile) => {
    const targetX = bar.x + bar.width / 2;
    const diffX = targetX - projectile.x;

    // x축만 바를 따라감
    if (Math.abs(diffX) <= projectile.xSpeed) {
        projectile.x = targetX;
    } else if (diffX > 0) {
        projectile.x += projectile.xSpeed;
    } else {
        projectile.x -= projectile.xSpeed;
    }

    // y축은 무조건 아래로 내려감
    projectile.y += projectile.ySpeed;
};

const createGanonShockwave = (pattern) => {
    const startX = canvasWidth / 2;
    const startY = 90;
    const damage = getBossPatternDamage(pattern);

    for (let i = 0; i < pattern.count; i++) {
        const ratio = pattern.count === 1 ? 0.5 : i / (pattern.count - 1);

        // 0.08π ~ 0.92π
        // 넓게 퍼져서 사이에 피할 공간이 생김
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
    const gap = pattern.gap || 300;

    const centerX = bar.x + bar.width / 2;
    const fireY = bar.y + bar.height / 2 - pattern.height / 2;

    const startOffset = -gap * Math.floor(count / 2);

    for (let i = 0; i < count; i++) {
        let fireX = centerX - pattern.width / 2 + startOffset + i * gap;

        // 화면 밖으로 안 나가게 보정
        fireX = Math.max(0, Math.min(fireX, canvasWidth - pattern.width));

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
    const barLeft = bar.x;
    const barRight = bar.x + bar.width;
    const barTop = bar.y;
    const barBottom = bar.y + bar.height;

    if (projectile.kind === "circle" || projectile.kind === "homing") {
        const closestX = Math.max(barLeft, Math.min(projectile.x, barRight));
        const closestY = Math.max(barTop, Math.min(projectile.y, barBottom));

        const distanceX = projectile.x - closestX;
        const distanceY = projectile.y - closestY;

        return distanceX * distanceX + distanceY * distanceY <= projectile.radius * projectile.radius;
    }

    const projectileLeft = projectile.x;
    const projectileRight = projectile.x + projectile.width;
    const projectileTop = projectile.y;
    const projectileBottom = projectile.y + projectile.height;

    return (
        barRight > projectileLeft &&
        barLeft < projectileRight &&
        barBottom > projectileTop &&
        barTop < projectileBottom
        );
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

//캔버스 제외 화면 갱신, animate에서 호출 됨
const updateUi = () => {
    const bossLifeText = document.querySelector("#bossLife");
    const lifeText = document.querySelector("#life");
    const countText = document.querySelector("#count");

    bossLifeText.innerText = `보스 체력 : ${bossLife >= 0 ? bossLife : 0} / ${totBossLife}`;
    lifeText.innerText = `내 체력 : ${life >= 0 ? life : 0} / ${totLife}`;
    countText.innerText = `남은 부메랑 : ${count}`;


    if (bossLife <= 0) {
        //승리
        winning = true;
        cancelAnimationFrame(animationId);
        isRunning = false;
        context.clearRect(0, 0, canvasWidth, canvasHeight);

        bossDie();
        const controlButton = document.querySelector("#controlButton");
        controlButton.innerText = "다음 스테이지 이동";

        //캔버스 흐리게 하는 함수 호출
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
    
}