/*main.js의 전역변수
let level = 1;
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

let life = 100;
let count = 5;

window.addEventListener("load", ()=>{
	canvas = document.querySelector('#canvas');
    context = canvas.getContext('2d');
    canvasWidth = canvas.width;
    canvasHeight = canvas.height;
	
	initAnimation();

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
        if (this.y > canvasHeight - this.radius - bar.height && (this.x - this.radius >= bar.x && this.x + this.radius <= bar.x + bar.width)) {
        	this.dy = -this.dy;
        }

        //바닥에 닿았을 때
        if (this.y > canvasHeight - this.radius) {
        	count -= 1;
        	updateUi();
        	initAnimation();
        }

        //벽돌에 부딪혔을 때





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
        this.y = canvasHeight - this.height - 10;
    }

    draw() {
        context.beginPath();
        context.rect(this.x, this.y, this.width, this.height);
        context.fillStyle = "#0095DD";
        context.fill();
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