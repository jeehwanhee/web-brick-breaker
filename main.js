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
		screenMove("startGameScreen");
		level = 1;
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

	//게임시작 버튼 처리는 game.js에서

	const levelButtons = startGameScreen.querySelectorAll("#selectLevel > div");
	levelButtons.forEach((levelButton, idx) => {
		const changeLevel = (newLevel) => {
			level = newLevel;
			const img = startGameScreen.querySelector("#levelImg");
			img.src = `img/boss${level}`;
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

const SettingScreenSetting = () => {
	const settingScreen = document.querySelector("#settingScreen");
	
	const backButton = settingScreen.querySelector(".backBtn");
	backButton.addEventListener("click", () => {
		screenMove("initScreen");
	});
};