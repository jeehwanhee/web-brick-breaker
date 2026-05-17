/*main.js, gameConfig.js의 전역변수
let level = 1;
let bricks = [];
*/

let rightPressed = false;
let leftPressed = false;

let ball = null;
let bar = null;
let skills = []; //처리를 어떻게 해야할 지 고민

let canvas = null;
let context = null;
let canvasWidth = null;
let canvasHeight = null;

let isRunning = false;
let animationId;

let life;
let count;
let power;

window.addEventListener("load", () => {
    const gameButton = document.querySelector("#gameButton");
    gameButton.addEventListener("click", () => {
        initScreen();
        initAnimation();
        screenMove("gameScreen");
    });

    screenBack();
	
    canvas = document.querySelector('#canvas');
    context = canvas.getContext('2d');
    canvasWidth = canvas.width;
    canvasHeight = canvas.height;

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
});

const initScreen = () => {
    //난이도 선택으로 결정되는 전역변수 등등
    
    life = 100;
    count = 5;
    power = 20;
    level1Bricks();
};

const initAnimation = () => {
    const x = canvasWidth / 2;
    const y = canvasHeight - 30;
    const dx = 6;
    const dy = -6;
    const color = "#FF0000";
	ball = new Ball(x,y,dx,dy,color);

	bar = new Bar();
};

const animate = () => {
	if (!isRunning) {
		return;
	}

    context.clearRect(0, 0, canvasWidth, canvasHeight);
    ball.update();
    bar.update();
    bricks.forEach((brick) => {
        brick.draw();
    });
    animationId = requestAnimationFrame(animate);
};

const startGame = () => {
	animate();
};


const updateUi = () => {
	const lifeText = document.querySelector("#life");
	const countText = document.querySelector("#count");

	lifeText.innerText = `내 체력 : ${life} / 100`;
	countText.innerText = `남은 부메랑 : ${count}`;
};


const screenBack = () => {
    const gameScreen = document.querySelector("#gameScreen");

    const backButton = gameScreen.querySelector(".backBtn");
    backButton.addEventListener("click", () => {
        if(confirm("정말 종료하시겠습니까?")) {
            screenMove("initScreen");

            cancelAnimationFrame(animationId);
            isRunning = false;
            context.clearRect(0, 0, canvasWidth, canvasHeight);
        }
    });
}
