// Use canvas.scale() to change the scale for larger resolutions?

//https://developer.mozilla.org/en-US/docs/Web/Events
/*click
contextmenu // right button before context menu is shown
dblclick?
fullscreenchange
fullscreenerror
gamepadconnected
gamepaddisconnected
keydown, keypress, keyup
mousedown, mousemove, mouseleave, mouseenter, mouseup, mouseout, mouseover*/

var canvas = document.createElement("canvas");
var canvasContext = canvas.getContext("2d");
canvas.width = 480;
canvas.height = 270;
canvas.style.display = "block";
canvas.style.margin = "0px auto";
//http://www.dbp-consulting.com/tutorials/canvas/CanvasKeyEvents.html
canvas.setAttribute("tabindex", 0);
document.body.appendChild(canvas);

canvas.addEventListener("mousedown", doMouseDown, true);
function doMouseDown(event)
{
    //canvas_x = event.pageX;
}

var keysDown = {};
canvas.addEventListener("keydown", doKeyDown, true);
function doKeyDown(e)
{
	keysDown[e.keyCode] = true;
}
canvas.addEventListener("keyup", doKeyUp, true);
function doKeyUp(e)
{
	keysDown[e.keyCode] = false;
}

function ascii(character)
{
    var result = character.charCodeAt(0);
    return result;
}

function update(secondsElapsed) 
{
    if(keysDown[ascii("D")])
    {
        guySpeed = approach(guySpeed, guyMaxSpeed, guyAcceleration * secondsElapsed);
        guy.sprite = playerRed;
    }
    else if(keysDown[ascii("A")])
    {
        guySpeed = approach(guySpeed, -guyMaxSpeed, guyAcceleration * secondsElapsed);
        guy.sprite = playerBlue;
    }
    else
    {
        guySpeed = approach(guySpeed, 0, guyAcceleration * secondsElapsed);
        guy.sprite.animationSeconds = 0;
    }
    guy.x += guySpeed * secondsElapsed;
        
    for(i = 0;
        i < entities.length;
        i++)
    {
        var entity = entities[i];
        var sprite = entity.sprite;
        if(sprite.type == "animated")
        {
            sprite.animationSeconds += secondsElapsed;
            var numFrames = sprite.image.width / sprite.frameWidth;
            var totalAnimationSeconds = numFrames * (1/sprite.framesPerSecond);
            if(sprite.animationSeconds > totalAnimationSeconds)
            {
                sprite.animationSeconds -= totalAnimationSeconds;
            }
        }
    }
}

function approach(start, destination, rate)
{
    if(start < destination)
    {
        return Math.min(start + rate, destination);
    }
    else
    {
        return Math.max(start - rate, destination);
    }
}

function draw()
{
    // Fill to black.
    canvasContext.fillStyle = "#000000";
    canvasContext.fillRect(0,0,canvas.width,canvas.height);

    /*
    canvasContext.font = "30px Arial";
    canvasContext.fillText("Hello World",10,50);

    canvasContext.beginPath();
    canvasContext.arc(95,50,40,0,2*Math.PI);
    canvasContext.stroke();

    canvasContext.moveTo(0,0);
    canvasContext.lineTo(200,100);
    canvasContext.stroke();*/
    
    for(i = 0;
        i < entities.length;
        i++)
    {
        drawEntity(entities[i]);
    }
}

function drawEntity(entity)
{
    var sprite = entity.sprite;
    if(sprite.type == "static")
    {
        canvasContext.drawImage(sprite.image, entity.x, entity.y);
    }
    else if(sprite.type == "animated")
    {
        var frame = Math.floor(sprite.animationSeconds * sprite.framesPerSecond);
        var sourceX = sprite.frameWidth * frame;
        var sourceY = 0;
        var drawX = entity.x;
        if(sprite.flipH)
        {
            canvasContext.save();
            canvasContext.translate(canvasContext.canvas.width, 0);
            canvasContext.scale(-1, 1);
            drawX = canvasContext.canvas.width - drawX - sprite.frameWidth;
        }
        canvasContext.drawImage(sprite.image, sourceX, sourceY, sprite.frameWidth, sprite.frameHeight, drawX, entity.y, sprite.frameWidth, sprite.frameHeight);
        if(sprite.flipH)
        {
            canvasContext.restore();
        }
    }
}

function staticSprite(name)
{
    this.type = "static";
    this.image = new Image();
    this.image.src = name;
}

function animatedSprite(name, frameWidth, frameHeight, framesPerSecond)
{
    this.type = "animated";
    this.image = new Image();
    this.image.src = name;
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
    this.animationSeconds = 0;
    this.framesPerSecond = framesPerSecond;
    this.flipH = false;
}

function entity(x, y, sprite)
{
    this.x = x;
    this.y = y;
    this.sprite = sprite;
}

var entities = [];
function addEntity(entity)
{
    entities[entities.length] = entity;
}

var playerRed = new animatedSprite("data/s_player_red.png", 16, 32, 8);
var playerBlue = new animatedSprite("data/s_player_blue.png", 16, 32, 8);
playerBlue.flipH = true;
var guy = new entity(100, 100, playerRed);
addEntity(guy);
var guyAcceleration = 150;
var guySpeed = 0;
var guyMaxSpeed = 40;

var savePoint = new entity(200, 100, new animatedSprite("data/s_save_point_standing.png", 16, 32, 8));
addEntity(savePoint);

var lastUpdateTime;
function main()
{
	var now = Date.now();
    var secondsSinceUpdate = (now - lastUpdateTime) / 1000;
	update(secondsSinceUpdate);
	draw();
    
    canvasContext.font = "12px Arial";
    canvasContext.fillStyle = "#FFFFFF";
    canvasContext.fillText(secondsSinceUpdate,10,10);
    
	lastUpdateTime = now;
	requestAnimationFrame(main);
};

function reset()
{
    lastUpdateTime = Date.now();
}

reset();
main();

/*
var FPS = 30;
setInterval(function() {
  update();
  draw();
}, 1000/FPS);*/

/*
window.onload = function() {
    var sources = {
        resource1: "img/sprite1.png",
        resource2: "img/sprite2.png",
        resource3: "img/sprite3.png"
    };
    loadImages(sources, initGame);  // calls initGame after *all* images have finished loading
};

function loadImages(sources, callback) {
    var images = {};
    var loadedImages = 0;
    var numImages = 0;
    for (var src in sources) {
        numImages++;
    }
    for (var src in sources) {
        images[src] = new Image();
        images[src].onload = function(){
            if (++loadedImages >= numImages) {
                callback(images);
            }
        };
        images[src].src = sources[src];
    }
} 

function initGame(images) {
    // some code here...
}*/

//convert s_player_dead_0.png s_player_dead_1.png +append s_player_dead.png