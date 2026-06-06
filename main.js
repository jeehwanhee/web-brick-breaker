//전역변수
let level = 1;

let isBgmOn = true;
let currentBgmName = null;

const bgmList = {
    menu: new Audio("audio/menu.mp3"),
    stage1: new Audio("audio/stage1.mp3"),
    stage2: new Audio("audio/stage2.mp3"),
    stage3: new Audio("audio/stage3.mp3"),
    clear: new Audio("audio/clear.mp3")
};

Object.values(bgmList).forEach((bgm) => {
    bgm.loop = true;
    bgm.volume = 0.45;
});

const stopAllBgm = () => {
    Object.values(bgmList).forEach((bgm) => {
        bgm.pause();
        bgm.currentTime = 0;
    });
};

const playBgm = (name) => {
    if (!bgmList[name]) return;

    if (currentBgmName === name && !bgmList[name].paused) {
        return;
    }

    stopAllBgm();
    currentBgmName = name;

    if (!isBgmOn) return;

    bgmList[name].play().catch(() => {
        console.log("브라우저 정책상 사용자 클릭 후 BGM이 재생됩니다.");
    });
};

const unlockAudio = () => {
    const name = currentBgmName || "menu";

    if (isBgmOn) {
        playBgm(name);
    }

    document.removeEventListener("pointerdown", unlockAudio);
    document.removeEventListener("keydown", unlockAudio);
    document.removeEventListener("touchstart", unlockAudio);
};

document.addEventListener("pointerdown", unlockAudio);
document.addEventListener("keydown", unlockAudio);
document.addEventListener("touchstart", unlockAudio);

const setBgmOn = (value) => {
    isBgmOn = value;

    if (!isBgmOn) {
        stopAllBgm();
        return;
    }

    if (currentBgmName) {
        playBgm(currentBgmName);
    } else {
        playBgm("menu");
    }
};

const playStageBgm = () => {
    if (level === 1) {
        playBgm("stage1");
    } else if (level === 2) {
        playBgm("stage2");
    } else if (level === 3) {
        playBgm("stage3");
    }
};

const storyDelay = 8000;
let storyTimer = null;

// 현재 보고 있는 시나리오가 프롤로그인지, 몇 단계인지 기억합니다.
let currentStoryKey = null;

// level별 storyScreen 출력 데이터를 한곳에서 관리합니다.
// 문구, 버튼 텍스트, 배경 이미지를 level 기준으로 쉽게 교체하기 위한 구조입니다.
const storyData = {
    // 1단계 시작 전에 먼저 보여줄 프롤로그입니다.
    prologue: {
        title: "Prologue",
        content: "링크가 여행을 떠나있던 중 평화롭던 하이랄 성에 갑작스레 들이닥친 가논군단!\n하이랄 성은 점령당했고, 거기에 있던 젤다는 붙잡혀버렸다...\n늘 그랬듯 링크는 하이랄 성과 젤다를 되찾기 위해 가논을 물리치러 가기로 하는데...",
        buttonText: "넘기기",
        background: "img/background/prologue.png"
    },
    1: {
        title: "거대 나방 등장!",
        content: "성 안으로 진입하기 위해 성문으로 향한 링크...\n하지만 그 앞은 가논의 수하로 보이는 거대 나방이 가로막고 있었다...\n링크는 빨리 나방을 해치워버리기로 하는데...",
        buttonText: "넘기기",
        background: "img/background/stage1.png"
    },
    2: {
        title: "'가논의 오른팔' 아그님!",
        content: "거대 나방을 물리치고 하이랄 성 내부로 진입한 링크...\n하지만 젤다가 갇힌 곳으로 가는 길은 '가논의 오른팔'으로 불리우는\n아그님이 가로막고 있었다!\n",
        buttonText: "넘기기",
        background: "img/background/stage2.png"
    },
    3: {
        title: "최종 결전!",
        content: "어찌저찌 마왕 가논의 방까지 오게 된 링크...\n벌써부터 열기가 느껴지는 문 앞에서 링크는 가논과의 결투를 시작하기 위해\n그 위풍당당한 발걸음을 내딛는다!!!",
        buttonText: "넘기기",
        background: "img/background/stage3.png"
    },
    4: {
        title: "Ending",
        content: "가논과의 웅장치열한 최종 결전 끝에 결국 가논을 쓰러뜨린 링크!!!\n젤다 구출도 성공했다! 젤다는 신성마법으로 가논을 봉인했고,\n둘은 창문 너머로 보이는 아름다운 풍경을 만끽한다!",
        buttonText: "처음으로",
        background: "img/background/ending.png"
    }
};

//이미지 들어가거나 하면 load로 이동
document.addEventListener("DOMContentLoaded", () => {
	initSetting();
	initScreenSetting();
	startGameSreenSetting();
	SettingScreenSetting();
});

window.addEventListener("load", () => {
	gameScreenSetting();

});

function updateStageScorePanel() {
    const stageScorePanel = document.querySelector("#stageScorePanel");
    const scoreBreakdown = document.querySelector("#scoreBreakdown");

    if (!stageScorePanel || !scoreBreakdown) return;

    if (typeof lastStageScoreResult === "undefined" || lastStageScoreResult === null) {
        stageScorePanel.classList.add("hide");
        scoreBreakdown.innerText = "";
        return;
    }

    const result = lastStageScoreResult;

    stageScorePanel.classList.remove("hide");
    scoreBreakdown.innerText =
        `클리어 스테이지 : ${result.clearedLevel}\n` +
        `보스 처치 점수 : +${result.bossScore}\n` +
        `남은 체력 점수 : +${result.lifeScore}\n` +
        `남은 탄창 점수 : +${result.ammoScore}\n` +
        `노데미지 클리어 : +${result.noDamageScore}\n` +
        `시간 패널티 : -${result.timePenalty} (${result.elapsedSeconds}초)\n` +
        `이번 정산 점수 : ${result.bonusTotal >= 0 ? "+" : ""}${result.bonusTotal}\n` +
        `총점 : ${result.totalScore}`;
}


// 현재 level에 맞는 시나리오를 storyScreen에 출력합니다.
// 화면 전환은 기존 screenMove 함수를 그대로 사용해 다른 화면 로직과 섞이지 않게 합니다.
function showStoryScreen(storyKey = level) {
    // 다음 버튼을 눌렀을 때 어디로 넘어갈지 알기 위해 현재 시나리오를 저장합니다.
    currentStoryKey = storyKey;

    const story = storyData[storyKey] || storyData[level] || storyData[1];

    const storyScreen = document.querySelector("#storyScreen");
    const storyTitle = document.querySelector("#storyTitle");
    const storyContent = document.querySelector("#storyContent");
    const storyButton = document.querySelector("#gameButton");

    storyTitle.innerText = story.title;
    storyContent.innerText = story.content;
    storyButton.innerText = story.buttonText;
    updateStageScorePanel();
    storyScreen.style.backgroundImage = `url(${story.background})`;

    screenMove("storyScreen");

    if (storyTimer !== null) {
        clearTimeout(storyTimer);
        storyTimer = null;
    }

    if (storyKey !== 4) {
        storyTimer = setTimeout(() => {
            storyTimer = null;
            advanceFromStoryScreen();
        }, storyDelay);
    }
}

function advanceFromStoryScreen() {
    if (storyTimer !== null) {
        clearTimeout(storyTimer);
        storyTimer = null;
    }

    if (currentStoryKey === "prologue") {
        // 프롤로그 다음에는 바로 1단계 시나리오를 보여줍니다.
        showStoryScreen(1);
        return;
    }

    if (currentStoryKey === 4 || level === 4) {
        currentStoryKey = null;
        screenMove("initScreen");
        return;
    }

    currentStoryKey = null;
    initBoostScreen();
}

//화면 이동 함수
const screenMove = (screenId) => {
	const section = document.querySelectorAll("section > div");

	section.forEach((screen) => {
		if (screen.id == screenId)
			screen.classList.remove("hide");
		else
			screen.classList.add("hide");
	});

	if (screenId == "gameScreen") {
		const controlButton = document.querySelector("#controlButton");
		controlButton.innerText = "start";

		playStageBgm();
	} 
	else if (screenId == "storyScreen" && level == 4) {
		// 3스테이지 보스를 깬 뒤 엔딩 스토리 화면
		playBgm("clear");
	}
	else {
		// 그 외 모든 화면
		playBgm("menu");
	}
};

//처음 켰을때 화면 세팅
const initSetting = () => {
	screenMove("initScreen");
};

//initScreen 초기 세팅
const initScreenSetting = () => {
	const initScreen = document.querySelector("#initScreen");

	const startGameButton = initScreen.querySelector("#startGameButton");
	startGameButton.addEventListener("click", () => {
		level = 1;
		skills = [];

        if (typeof resetScoreSystem === "function") {
            resetScoreSystem();
        }
		const levelButtons = startGameScreen.querySelectorAll("#selectLevel > div");
		
		const img = startGameScreen.querySelector("#levelImg");
		img.src = `img/boss/${level}.png`;
		img.alt = "보스이미지" + level;

		levelButtons.forEach((btns) => {
			btns.classList.remove("selected");
		});
		levelButtons[0].classList.add("selected");


		screenMove("startGameScreen");
	});

	const settingButton = initScreen.querySelector("#settingButton");
	settingButton.addEventListener("click", () => {
		screenMove("settingScreen");
	});
};

//startGameScreen 초기 세팅
const startGameSreenSetting = () => {
	const startGameScreen = document.querySelector("#startGameScreen");
	
	const backButton = startGameScreen.querySelector(".backBtn");
	backButton.addEventListener("click", () => {
		screenMove("initScreen");
	});

	const mainButton = startGameScreen.querySelector(".mainBtn");
	mainButton.addEventListener("click", () => {
        // 1단계는 프롤로그부터, 2/3단계는 해당 단계 시나리오부터 시작합니다.
        if (level === 1) {
            showStoryScreen("prologue");
        } else {
            showStoryScreen(level);
        }
    });
	//게임시작 버튼 처리는 game.js에서

	const levelButtons = startGameScreen.querySelectorAll("#selectLevel > div");
	levelButtons.forEach((levelButton, idx) => {
		const changeLevel = (newLevel) => {
			level = newLevel;
			console.log(level);
			const img = startGameScreen.querySelector("#levelImg");
			img.src = `img/boss/${level}.png`;
			img.alt = "보스이미지" + level;

			levelButtons.forEach((btns) => {
				btns.classList.remove("selected");
			});
			levelButton.classList.add("selected");
		};

		levelButton.addEventListener("click", () => {
			changeLevel(idx+1);
		});
	});
};

const gameScreenSetting = () => {
	const gameScreen = document.querySelector("#gameScreen");

	//종료하기 버튼은 game.js에서 관리

};
//블럭 이미지 로딩
const brickImageSources = {
    normal: "img/brick/normal.png",
    attack: "img/brick/attack.png",
    heal: "img/brick/heal.png",
    ball: "img/brick/ball.png",
    bar: "img/brick/bar.png",
    burning: "img/brick/burning.png"
};

const brickImages = {};

Object.keys(brickImageSources).forEach((key) => {
    const image = new Image();
    image.src = brickImageSources[key];

    image.onerror = () => {
        image.failed = true;
    };

    brickImages[key] = image;
});

//캐릭터, 공 설정을 위한 변수
// 캐릭터와 공 선택 상태를 저장합니다.
let characterNum = 1;
//characterImg.src = `img/character/${characterNum}.png`; 캐릭터 이미지 선택방식 변경

let ballNum = 1;

// 공 선택 화면과 게임 화면에서 사용할 공 이미지 목록입니다.
const ballAnimationConfig = {
    1: {
        preview: "img/ball/boomerang/1.png",
        frames: [
            "img/ball/boomerang/1.png",
            "img/ball/boomerang/2.png",
            "img/ball/boomerang/3.png",
            "img/ball/boomerang/4.png"
        ]
    },
    2: {
        preview: "img/ball/sword/1.png",
        frames: [
            "img/ball/sword/1.png",
            "img/ball/sword/2.png",
            "img/ball/sword/3.png",
            "img/ball/sword/4.png"
        ]
    }
};

// 현재 선택된 공의 애니메이션 이미지들을 저장합니다.
let selectedBallFrames = [];

//캐릭터클래스가 가져올 설정값
// 캐릭터별 미리보기와 상태별 애니메이션 이미지 경로를 관리합니다.
// 상태별 이미지 개수가 달라도 Character 클래스가 배열 길이에 맞춰 재생합니다.
const characterAnimationConfig = {
    1: {
        preview: "img/character/green/idle/1.png",
        width: 100,
        height: 150,
        animations: {
            idle: [
                "img/character/green/idle/1.png"
            ],
            moveLeft: [
                "img/character/green/move_left/1.png",
                "img/character/green/move_left/2.png",
                "img/character/green/move_left/3.png",
                "img/character/green/move_left/4.png",
                "img/character/green/move_left/5.png",
                "img/character/green/move_left/6.png"
            ],
            moveRight: [
                "img/character/green/move_right/1.png",
                "img/character/green/move_right/2.png",
                "img/character/green/move_right/3.png",
                "img/character/green/move_right/4.png",
                "img/character/green/move_right/5.png",
                "img/character/green/move_right/6.png"
            ],
            attack: [
                "img/character/green/attack/1.png",
                "img/character/green/attack/2.png",
                "img/character/green/attack/3.png",
                "img/character/green/attack/4.png",
                "img/character/green/attack/5.png"
            ]
        }
    },

    2: {
        preview: "img/character/blue/idle/1.png",
        width: 100,
        height: 150,
        animations: {
            idle: [
                "img/character/blue/idle/1.png"
            ],
            moveLeft: [
                "img/character/blue/move_left/1.png",
                "img/character/blue/move_left/2.png",
                "img/character/blue/move_left/3.png",
                "img/character/blue/move_left/4.png",
                "img/character/blue/move_left/5.png",
                "img/character/blue/move_left/6.png"
            ],
            moveRight: [
                "img/character/blue/move_right/1.png",
                "img/character/blue/move_right/2.png",
                "img/character/blue/move_right/3.png",
                "img/character/blue/move_right/4.png",
                "img/character/blue/move_right/5.png",
                "img/character/blue/move_right/6.png"
            ],
            attack: [
                "img/character/blue/attack/1.png",
                "img/character/blue/attack/2.png",
                "img/character/blue/attack/3.png",
                "img/character/blue/attack/4.png",
                "img/character/blue/attack/5.png"
            ]
        }
    },

    3: {
        preview: "img/character/pink/idle/1.png",
        width: 100,
        height: 150,
        animations: {
            idle: [
                "img/character/pink/idle/1.png"
            ],
            moveLeft: [
                "img/character/pink/move_left/1.png",
                "img/character/pink/move_left/2.png",
                "img/character/pink/move_left/3.png",
                "img/character/pink/move_left/4.png",
                "img/character/pink/move_left/5.png",
                "img/character/pink/move_left/6.png"
            ],
            moveRight: [
                "img/character/pink/move_right/1.png",
                "img/character/pink/move_right/2.png",
                "img/character/pink/move_right/3.png",
                "img/character/pink/move_right/4.png",
                "img/character/pink/move_right/5.png",
                "img/character/pink/move_right/6.png"
            ],
            attack: [
                "img/character/pink/attack/1.png",
                "img/character/pink/attack/2.png",
                "img/character/pink/attack/3.png",
                "img/character/pink/attack/4.png",
                "img/character/pink/attack/5.png"
            ]
        }
    },

    4: {
        preview: "img/character/red/idle/1.png",
        width: 100,
        height: 150,
        animations: {
            idle: [
                "img/character/red/idle/1.png"
            ],
            moveLeft: [
                "img/character/red/move_left/1.png",
                "img/character/red/move_left/2.png",
                "img/character/red/move_left/3.png",
                "img/character/red/move_left/4.png",
                "img/character/red/move_left/5.png",
                "img/character/red/move_left/6.png"
            ],
            moveRight: [
                "img/character/red/move_right/1.png",
                "img/character/red/move_right/2.png",
                "img/character/red/move_right/3.png",
                "img/character/red/move_right/4.png",
                "img/character/red/move_right/5.png",
                "img/character/red/move_right/6.png"
            ],
            attack: [
                "img/character/red/attack/1.png",
                "img/character/red/attack/2.png",
                "img/character/red/attack/3.png",
                "img/character/red/attack/4.png",
                "img/character/red/attack/5.png"
            ]
        }
    },
};

// 이미지 로딩 실패 여부를 표시해 Character.draw()에서 fallback할 수 있게 함
// 이미지 경로를 Image 객체로 변환합니다.
// 로딩 실패 여부를 저장해 Character.draw()에서 fallback을 사용할 수 있게 합니다.
function createImage(src) {
    const image = new Image();
    image.src = src;
    image.onerror = () => {
        image.failed = true;
    };
    return image;
}

function updateSelectedCharacter(newCharacterNum) {
    characterNum = newCharacterNum;

    const config = characterAnimationConfig[characterNum] || characterAnimationConfig[1];
    const characterPreviewImg = document.querySelector("#characterImg");

    if (characterPreviewImg) {
        characterPreviewImg.src = config.preview;

        characterPreviewImg.onerror = () => {
            characterPreviewImg.src = characterAnimationConfig[1].preview;//캐릭터 선택 시 보여질 이미지 적용
        };
    }

    if (bar && bar.character) {
        bar.character.setCharacter(characterNum);
    }
}

function updateSelectedBall(newBallNum) {
    ballNum = newBallNum;

    const config = ballAnimationConfig[ballNum] || ballAnimationConfig[1];
    const ballPreviewImg = document.querySelector("#ballImg");

    // 설정 화면에 보이는 공 미리보기 이미지를 바꿉니다.
    if (ballPreviewImg) {
        ballPreviewImg.src = config.preview;

        ballPreviewImg.onerror = () => {
            ballPreviewImg.src = ballAnimationConfig[1].preview;
        };
    }

    // 게임 화면에서 움직이는 공도 선택한 공 이미지로 바꿉니다.
    selectedBallFrames = config.frames.map(createImage);
}

//설정 화면
const SettingScreenSetting = () => {
	const settingScreen = document.querySelector("#settingScreen");
	
	const bgmToggleButton = settingScreen.querySelector("#bgmToggleButton");

	const updateBgmButtonText = () => {
		bgmToggleButton.innerText = isBgmOn ? "BGM ON" : "BGM OFF";
	};

	updateBgmButtonText();

	bgmToggleButton.addEventListener("click", () => {
		setBgmOn(!isBgmOn);
		updateBgmButtonText();
	});

	const backButton = settingScreen.querySelector(".backBtn");
	backButton.addEventListener("click", () => {
		screenMove("initScreen");
	});

	const prevCharButton = settingScreen.querySelector("#prevCharButton");
	prevCharButton.addEventListener("click", () => {
		if (characterNum<=1)
			characterNum = 4;
		else
			characterNum--;
		//characterImg.src = `img/character/${characterNum}.png`; 대신 아래로 변경
		updateSelectedCharacter(characterNum);
	});
	const nextCharButton = settingScreen.querySelector("#nextCharButton");
	nextCharButton.addEventListener("click", () => {
		if (characterNum>=4)
			characterNum = 1;
		else
			characterNum++;
		//characterImg.src = `img/character/${characterNum}.png`; 대신 아래로 변경
		updateSelectedCharacter(characterNum);
	});

	const prevBallButton = settingScreen.querySelector("#prevBallButton");
	prevBallButton.addEventListener("click", () => {
        // 현재 공 종류가 2개라서 1번 앞은 2번으로 돌아갑니다.
		if (ballNum<=1)
			ballNum = 2;
		else
			ballNum--;
		updateSelectedBall(ballNum);
	});
	const nextBallButton = settingScreen.querySelector("#nextBallButton");
	nextBallButton.addEventListener("click", () => {
        // 현재 공 종류가 2개라서 2번 다음은 1번으로 돌아갑니다.
		if (ballNum>=2)
			ballNum = 1;
		else
			ballNum++;
		updateSelectedBall(ballNum);
	});

    updateSelectedBall(ballNum);
};
 
//let skills = {};

const skillList = [
    "베리어 생성",
    "산탄공",
    "시간감속",
    "유체화",
    "관통 공",
    "연쇄 번개",
    "타오르는 공",
    "튕겨 내기"
];

const skillDescription = {
    "베리어 생성": "1초 동안 아래에 베리어를 생성하여 공이 나가는 것을 막습니다.",
    "산탄공": "스킬 사용 후, 처음 공이 바에 튕길 시 공 5개가 추가됩니다.",
    "시간감속": "3초 동안 모든 투사체의 속도가 느려집니다.",
    "유체화": "3초 동안 바의 이동속도가 증가합니다.",
    "관통 공": "스킬 사용 후, 처음 공이 바에 튕길 시 블록과 바를 관통하는 공 2개를 발사합니다.",
    "연쇄 번개": "스킬 사용 후, 처음 공이 블럭을 타격할 때 주변 블록을 공격하는 번개가 내립니다.",
    "타오르는 공": "스킬 사용 후, 처음 공이 블럭을 타격할 때 일정시간 동안 지속 데미지를 입힙니다.",
    "튕겨 내기": "1초 동안 방어막을 생성하여 보스의 공격을 튕겨내어 반격합니다."
};

// 스킬 선택지 3개
let showSkills = [];

// 사용자가 가지고 있는 스킬들
let skills = [];

