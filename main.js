//전역변수
let level = 1;


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
		screenMove("storyScreen");
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
let characterNum = 1;
const characterImg = new Image();
characterImg.src = `img/character/${characterNum}.png`;

let ballNum = 1;
const ballImg = new Image();
ballImg.src = `img/ball/${ballNum}.png`;


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
		characterImg.src = `img/character/${characterNum}.png`;
	});
	const nextCharButton = settingScreen.querySelector("#nextCharButton");
	nextCharButton.addEventListener("click", () => {
		if (characterNum>=3)
			characterNum = 1;
		else
			characterNum++;
		characterImg.src = `img/character/${characterNum}.png`;
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

	//음악 on/off기능?

};

<<<<<<< HEAD
 
//let skills = {};
let skills = [ 		//테스트 용
	"스킬1",
	"스킬2",
	"스킬3"
];
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
