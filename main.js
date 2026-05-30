//전역변수
let level = 1;
const storyDelay = 8000;
let storyTimer = null;

// level별 storyScreen 출력 데이터를 한곳에서 관리합니다.
// 문구, 버튼 텍스트, 배경 이미지를 level 기준으로 쉽게 교체하기 위한 구조입니다.
const storyData = {
    1: {
        title: "초원의 그림자",
        content: "평화로운 초원에 수상한 기운이 퍼지기 시작했다.\n왕자는 성에 갇힌 공주를 구하기 위해 첫 번째 괴물 나방과 맞선다.",
        buttonText: "넘기기",
        background: "img/background/stage1.png"
    },
    2: {
        title: "어둠의 성",
        content: "초원을 지나 성에 도착한 왕자.\n성 안에는 번개를 다루는 마법사 아그님이 기다리고 있었다.",
        buttonText: "넘기기",
        background: "img/background/stage2.png"
    },
    3: {
        title: "최후의 방",
        content: "모든 길의 끝에서 왕자는 가논과 마주한다.\n공주를 구하기 위한 마지막 전투가 시작된다.",
        buttonText: "넘기기",
        background: "img/background/stage3.png"
    },
    4: {
        title: "공주 구출",
        content: "가논을 쓰러뜨린 왕자는 마침내 공주를 구출했다.\n왕국에는 다시 평화가 찾아왔다.",
        buttonText: "처음으로",
        background: "img/stage/stage1.png"
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

// 현재 level에 맞는 시나리오를 storyScreen에 출력합니다.
// 화면 전환은 기존 screenMove 함수를 그대로 사용해 다른 화면 로직과 섞이지 않게 합니다.
function showStoryScreen() {
    const story = storyData[level] || storyData[1];

    const storyScreen = document.querySelector("#storyScreen");
    const storyTitle = document.querySelector("#storyTitle");
    const storyContent = document.querySelector("#storyContent");
    const storyButton = document.querySelector("#gameButton");

    storyTitle.innerText = story.title;
    storyContent.innerText = story.content;
    storyButton.innerText = story.buttonText;

    storyScreen.style.backgroundImage = `url(${story.background})`;

    screenMove("storyScreen");

	if (storyTimer !== null) {
		clearTimeout(storyTimer);
		storyTimer = null;
	}

	if (level !== 4) {
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

    if (level == 4) {
        screenMove("initScreen");
        return;
    }
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

	if(screenId == "gameScreen") {
		const controlButton = document.querySelector("#controlButton");
		controlButton.innerText = "start";
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
		showStoryScreen();
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

//캐릭터, 공 설정을 위한 변수
// 캐릭터와 공 선택 상태를 저장합니다.
let characterNum = 1;
//characterImg.src = `img/character/${characterNum}.png`; 캐릭터 이미지 선택방식 변경

let ballNum = 1;
const ballImg = new Image();
ballImg.src = `img/ball/${ballNum}.png`;

//캐릭터클래스가 가져올 설정값
// 캐릭터별 미리보기와 상태별 애니메이션 이미지 경로를 관리합니다.
// 상태별 이미지 개수가 달라도 Character 클래스가 배열 길이에 맞춰 재생합니다.
const characterAnimationConfig = {
    1: {
        preview: "img/character/character1/preview.png",
        width: 100,
        height: 150,
        animations: {
            idle: [
                "img/character/character1/idle/idle_1.png"
            ],
            moveLeft: [
                "img/character/character1/move_left/move_left_1.png",
                "img/character/character1/move_left/move_left_2.png",
                "img/character/character1/move_left/move_left_3.png",
                "img/character/character1/move_left/move_left_4.png"
            ],
            moveRight: [
                "img/character/character1/move_right/move_right_1.png",
                "img/character/character1/move_right/move_right_2.png",
                "img/character/character1/move_right/move_right_3.png",
                "img/character/character1/move_right/move_right_4.png"
            ],
            attack: [
                "img/character/character1/attack/attack_1.png",
                "img/character/character1/attack/attack_2.png",
                "img/character/character1/attack/attack_3.png",
                "img/character/character1/attack/attack_4.png",
                "img/character/character1/attack/attack_5.png",
                "img/character/character1/attack/attack_6.png",
                "img/character/character1/attack/attack_7.png",
                "img/character/character1/attack/attack_8.png",
                "img/character/character1/attack/attack_9.png"
            ]
        }
    },

    2: {
        preview: "img/character/2.png",
        width: 100,
        height: 150,
        animations: {
            idle: [],
            moveLeft: [],
            moveRight: [],
            attack: []
        }
    },

    3: {
        preview: "img/character/3.png",
        width: 100,
        height: 150,
        animations: {
            idle: [],
            moveLeft: [],
            moveRight: [],
            attack: []
        }
    }
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

//설정 화면
const SettingScreenSetting = () => {
	const settingScreen = document.querySelector("#settingScreen");
	
	const backButton = settingScreen.querySelector(".backBtn");
	backButton.addEventListener("click", () => {
		screenMove("initScreen");
	});

	const prevCharButton = settingScreen.querySelector("#prevCharButton");
	prevCharButton.addEventListener("click", () => {
		if (characterNum<=1)
			characterNum = 3;
		else
			characterNum--;
		//characterImg.src = `img/character/${characterNum}.png`; 대신 아래로 변경
		updateSelectedCharacter(characterNum);
	});
	const nextCharButton = settingScreen.querySelector("#nextCharButton");
	nextCharButton.addEventListener("click", () => {
		if (characterNum>=3)
			characterNum = 1;
		else
			characterNum++;
		//characterImg.src = `img/character/${characterNum}.png`; 대신 아래로 변경
		updateSelectedCharacter(characterNum);
	});

	const prevBallButton = settingScreen.querySelector("#prevBallButton");
	prevBallButton.addEventListener("click", () => {
		if (ballNum<=1)
			ballNum = 3;
		else
			ballNum--;
		ballImg.src = `img/ball/${ballNum}.png`;
	});
	const nextBallButton = settingScreen.querySelector("#nextBallButton");
	nextBallButton.addEventListener("click", () => {
		if (ballNum>=3)
			ballNum = 1;
		else
			ballNum++;
		ballImg.src = `img/ball/${ballNum}.png`;
	});
};
 
//let skills = {};

const skillList = [
    "베리어 생성",
    "산탄공",
    "시간 느려지기",
    "유체화",
    "관통 공",
    "연쇄 번개",
    "타오르는 공",
    "튕겨 내기"
];

const skillDescription = {
    "베리어 생성": "1초 동안 아래에 베리어를 생성하여 공이 나가는 것을 막습니다.",
    "산탄공": "스킬 사용 후, 처음 공이 바에 튕길 시 공 5개가 추가됩니다.",
    "시간 느려지기": "3초 동안 모든 투사체의 속도가 느려집니다.",
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
