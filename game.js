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
const BOSS_ATTACK_DELAY = 15000;

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

    context.clearRect(0, 0, canvasWidth, canvasHeight);

    if (isBossAttacking) {
        updateBossProjectiles();
        bar.update();
        checkBossAttackEnd();
    } else {
        ball.update();
        bar.update();

        bricks.forEach((brick) => {
            brick.draw();
        });
    }

    animationId = requestAnimationFrame(animate);
    updateUi();
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
    if (isBossAttacking) return;

    currentBossPattern = pickBossPattern();

    if (currentBossPattern === null) {
        return;
    }

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


const isProjectileOut = (projectile) => {
    const margin = 300;

    if (projectile.kind === "circle") {
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
    bossProjectiles.forEach((projectile) => {
        projectile.x += projectile.dx;
        projectile.y += projectile.dy;

        drawBossProjectile(projectile);

        if (!projectile.hit && isProjectileHitBar(projectile)) {
            projectile.hit = true;
            life -= projectile.damage;
            updateUi();
        }
    });

    // 화면 밖으로 나간 투사체 제거
    bossProjectiles = bossProjectiles.filter((projectile) => {
        return !isProjectileOut(projectile);
    });
};

const loadBossSkillImages = () => {
    Object.values(bossPatternConfigs).forEach((patterns) => {
        patterns.forEach((pattern) => {
            if (pattern.imageSrc && !bossSkillImages[pattern.imageSrc]) {
                const img = new Image();
                img.src = pattern.imageSrc;
                bossSkillImages[pattern.imageSrc] = img;
            }
        });
    });
};


const drawBossProjectile = (projectile) => {
    context.save();

    if (projectile.imageSrc) {
        const img = bossSkillImages[projectile.imageSrc];

        if (img && img.complete) {
            if (projectile.kind === "circle") {
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

    // 이미지가 아직 안 불러와졌을 때 임시 빨간색 도형
    context.fillStyle = "red";

    if (projectile.kind === "circle") {
        context.beginPath();
        context.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
        context.fill();
        context.closePath();
    } else {
        context.fillRect(projectile.x, projectile.y, projectile.width, projectile.height);
    }

    context.restore();
};

const isProjectileHitBar = (projectile) => {
    const barLeft = bar.x;
    const barRight = bar.x + bar.width;
    const barTop = bar.y;
    const barBottom = bar.y + bar.height;

    if (projectile.kind === "circle") {
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

    startBossPattern();
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

    clearBossPatternTimeouts();

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