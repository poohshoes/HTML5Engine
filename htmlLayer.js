//====== SETUP ======
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

var scale = 2;
var canvas = document.createElement("canvas");
var canvasContext = canvas.getContext("2d");
canvas.width = 480 * scale;
canvas.height = 270 * scale;
canvas.style.display = "block";
canvas.style.margin = "0px auto";
//http://www.dbp-consulting.com/tutorials/canvas/CanvasKeyEvents.html
canvas.setAttribute("tabindex", 0);
document.body.appendChild(canvas);
// Blog talking about how to scale the canvas on the various browsers.
// http://phoboslab.org/log/2012/09/drawing-pixels-is-hard
canvasContext.imageSmoothingEnabled = false;
canvasContext.webkitImageSmoothingEnabled = false;
canvasContext.mozImageSmoothingEnabled = false;

//====== INPUT ======
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

//====== UPDATE ======
function update(secondsElapsed) 
{
    var playerAcceleration = new v2();
    if(keysDown[ascii("D")])
    {
        playerAcceleration.x += 1;
        guy.sprite = playerRed;
    }
    if(keysDown[ascii("A")])
    {
        playerAcceleration.x -= 1;
        guy.sprite = playerBlue;
    }
    if(keysDown[ascii("W")])
    {
        playerAcceleration.y += 1;
    }
    if(keysDown[ascii("S")])
    {
        playerAcceleration.y -= 1;
    }
    if(playerAcceleration.x == 0 && playerAcceleration.y == 0)
    {
        guy.sprite.animationSeconds = 0;
    }
    
    v2NormalizeAssign(playerAcceleration);
    v2MultiplyAssign(playerAcceleration, 100);
    moveEntity(guy, playerAcceleration, secondsElapsed);
    
    // Old movement code.
    // var playerAccelerationLength = v2Length(playerAcceleration);
    // if(playerAccelerationLength > 1)
    // {
        // v2MultiplyAssign(playerAcceleration, 1 / Math.sqrt(playerAccelerationLength));
    // }
    
    // // TODO(ian): Limit by max speed.
    // v2MultiplyAssign(playerAcceleration, guy.motion.acceleration);
    // // ddP += -MoveSpec->Drag*Entity->dP;
    // v2SubtractAssign(playerAcceleration, v2Multiply(guy.motion.velocity, guy.motion.drag));
    // // ddP * sqare(dt) * 0.5 + dP * dt
    // var changeInPosition = v2Add(v2Multiply(v2Multiply(playerAcceleration, Math.pow(secondsElapsed, 2)), 0.5), v2Multiply(guy.motion.velocity, secondsElapsed));
    // guy.motion.velocity = v2Add(v2Multiply(playerAcceleration, secondsElapsed), guy.motion.velocity);
    // var newPlayerPosition = v2Add(guy.position, changeInPosition);
    // guy.position = newPlayerPosition;
    
    for(i = 0;
        i < entities.length;
        i++)
    {
        var entity = entities[i];
        var sprite = entity.sprite;
        if(sprite != null && sprite.type == "animated")
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

function moveEntity(entity, acceleration, secondsElapsed)
{
    // todo: handle the case where entity doesn't have a physics?
    
    // ote: casey has a note here saying we need to implement ODE?    
    var drag = 5;
    v2AddAssign(acceleration, v2Multiply(entity.motion.velocity, -drag));
    
    var positionDelta = v2Add(
        v2Multiply(acceleration, 0.5 * Math.pow(secondsElapsed, 2)), 
        v2Multiply(entity.motion.velocity, secondsElapsed)); 
    
    entity.motion.velocity = v2Add(
        entity.motion.velocity, 
        v2Multiply(acceleration, secondsElapsed));
        
    var distanceRemaining = entity.motion.distanceLimit;
    if(distanceRemaining == 0)
    {
        distanceRemaining = 10000;
    }
    
    for(var i = 0;
        i < 4;
        ++i)
    {
        var tMin = 1;
        var positionDeltaLength = v2Length(positionDelta);
        if(positionDeltaLength > 0)
        {
            if(positionDeltaLength > distanceRemaining)
            {
                tMin = (distanceRemaining / positionDeltaLength);
            }
        
            // Note(ian): The 0, 0 is arbitrary.
            var wallNormal = new v2(0, 0);
            var hitEntity = null;
            var desiredPosition = v2Add(entity.position, positionDelta);
            
            // Todo(ian): We might want to do some sort of sim region or broad phase here so that we don't have to check every entity in the game.
            for(var j = 0;
                j < entities.length;
                j++)
            {
                var testEntity = entities[j];
                if(testEntity.physics != null && testEntity != entity)
                {
                    var diameterW = testEntity.physics.size.x + entity.physics.size.x;
                    var diameterH = testEntity.physics.size.y + entity.physics.size.y;
                    var minCorner = v2Multiply(new v2(diameterW, diameterH), -0.5);
                    var maxCorner = v2Multiply(new v2(diameterW, diameterH), 0.5);
                    var rel = v2Subtract(entity.position, testEntity.position);
                    
                    var testResult = TestWall(minCorner.x, rel.x, rel.y, positionDelta.x, positionDelta.y, tMin, minCorner.y, maxCorner.y);
                    tMin = testResult.newTMin;
                    if(testResult.hit)
                    {
                        wallNormal = new v2(-1, 0);
                        hitEntity = testEntity;
                    }
            
                    var testResult = TestWall(maxCorner.x, rel.x, rel.y, positionDelta.x, positionDelta.y, tMin, minCorner.y, maxCorner.y);
                    tMin = testResult.newTMin;
                    if(testResult.hit)
                    {
                        wallNormal = new v2(1, 0);
                        hitEntity = testEntity;
                    }
            
                    var testResult = TestWall(minCorner.y, rel.y, rel.x, positionDelta.y, positionDelta.x, tMin, minCorner.x, maxCorner.x);
                    tMin = testResult.newTMin;
                    if(testResult.hit)
                    {
                        wallNormal = new v2(0, -1);
                        hitEntity = testEntity;
                    }
            
                    var testResult = TestWall(maxCorner.y, rel.y, rel.x, positionDelta.y, positionDelta.x, tMin, minCorner.x, maxCorner.x);
                    tMin = testResult.newTMin;
                    if(testResult.hit)
                    {
                        wallNormal = new v2(0, 1);
                        hitEntity = testEntity;
                    }
                }
            }
            
            entity.position = v2Add(entity.position, v2Multiply(positionDelta, tMin));
            distanceRemaining -= tMin * positionDeltaLength;
            if(hitEntity != null)
            {
                positionDelta = v2Subtract(desiredPosition, entity.position);
                //handleCollision(entity, hitEntity);
                // Note(ian): Ignore this code for objects that handle collisions but don't prevent movement.  Also might want to record the contant and ignore it until contact breaks.
                positionDelta = v2Subtract(positionDelta,
                    v2Multiply(wallNormal, v2Inner(positionDelta, wallNormal)));
                entity.motion.velocity = v2Subtract(entity.motion.velocity,
                    v2Multiply(wallNormal, v2Inner(entity.motion.velocity, wallNormal)));
            }
            else
            {
                break;
            }
        }
        else
        {
            break;
        }
    }
    
    if(entity.motion.distanceLimit != 0)
    {
        entity.motion.distanceLimit = distanceRemaining;
    }
    
    // // TODO(casey): Change to using the acceleration vector
    // if((Entity->dP.X == 0.0f) && (Entity->dP.Y == 0.0f))
    // {
        // // NOTE(casey): Leave FacingDirection whatever it was
    // }
    // else if(AbsoluteValue(Entity->dP.X) > AbsoluteValue(Entity->dP.Y))
    // {
        // if(Entity->dP.X > 0)
        // {
            // Entity->FacingDirection = 0;
        // }
        // else
        // {
            // Entity->FacingDirection = 2;
        // }
    // }
    // else
    // {
        // if(Entity->dP.Y > 0)
        // {
            // Entity->FacingDirection = 1;
        // }
        // else
        // {
            // Entity->FacingDirection = 3;
        // }
    // }
}

// Note(ian): These parameter names are only correct for 1 of the 4 calls.
function TestWall(WallX, RelX, RelY, PlayerDeltaX, PlayerDeltaY, tMin, MinY, MaxY)
{
    var Hit = false;
    var newTMin = tMin;
    
    var tEpsilon = 0.001;
    if(PlayerDeltaX != 0)
    {
        var tResult = (WallX - RelX) / PlayerDeltaX;
        var Y = RelY + tResult*PlayerDeltaY;
        if((tResult >= 0) && (tMin > tResult))
        {
            if((Y >= MinY) && (Y <= MaxY))
            {
                newTMin = Math.max(0, tResult - tEpsilon);
                Hit = true;
            }
        }
    }

    return {
        hit: Hit,
        newTMin : newTMin
        };
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

//====== DRAW ======
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

function drawRectangle(center, size)
{
    var halfSize = v2Divide(size, 2);
    var topLeft = v2Subtract(center, halfSize);
    topLeft.y += size.y;
    canvasContext.fillStyle = 'magenta';
    canvasContext.fillRect(topLeft.x * scale, canvasContext.canvas.height - (topLeft.y * scale), size.x * scale, size.y * scale);
}

function drawCircle(x, y)
{
    var radius = 2 * scale;
    canvasContext.beginPath();
    canvasContext.arc(x * scale, canvasContext.canvas.height - (y * scale), radius, 0, 2 * Math.PI, false);
    canvasContext.fillStyle = 'green';
    canvasContext.fill();
}

function drawEntity(entity)
{
    if(entity.sprite != null)
    {
        var sprite = entity.sprite;    
        var sourceX = 0;
        var sourceY = 0;
        var width = sprite.image.width;
        var height = sprite.image.height;
        
        if(sprite.type == "animated")
        {
            var frame = Math.floor(sprite.animationSeconds * sprite.framesPerSecond);
            sourceX = sprite.frameWidth * frame;
            width = sprite.frameWidth;
            height = sprite.frameHeight;
        }
        
        // TODO(ian): When rounding we should also consider the scale so we can have finer movement.
        var x = entity.position.x * scale;
        x -= width * scale / 2;
        // Note(ian): To normalize with common maths we make y go up.
        var y = canvasContext.canvas.height - (entity.position.y * scale);
        y -= height * scale;
        
        x = Math.round(x);
        y = Math.round(y);
        
        if(sprite.flipH)
        {
            canvasContext.save();
            canvasContext.translate(canvasContext.canvas.width, 0);
            canvasContext.scale(-1, 1);
            x = canvasContext.canvas.width - x - (sprite.frameWidth * scale);
        }
        
        canvasContext.drawImage(sprite.image, sourceX, sourceY, width, height, x, y, width * scale, height * scale);
        
        if(sprite.flipH)
        {
            canvasContext.restore();
        }
    }
    
    if(entity.physics != null)
    {
        drawRectangle(entity.position, entity.physics.size);
    }
    drawCircle(entity.position.x, entity.position.y);
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

function rectanglePhysics(width, height)
{
    this.size = new v2(width, height);
}

function entity(x, y, sprite)
{
    this.position = new v2(x, y);
    this.sprite = sprite;
    this.motion = null;
    this.physics = null;
}

function motion()
{
    this.velocity = new v2();
    this.maxVelocity = 40;
    this.acceleration = 200;
    this.drag = 4;
    this.distanceLimit = 0;
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
guy.motion = new motion();
guy.physics = new rectanglePhysics(8, 8);
addEntity(guy);

var savePoint = new entity(200, 100, new animatedSprite("data/s_save_point_standing.png", 16, 32, 8));
addEntity(savePoint);

var staticSprite = new entity(300, 100, new staticSprite("data/s_man_0.png"));
addEntity(staticSprite);

var wallOffset = new v2(50, 50);
var wallSize = new v2(10, 10);
for(var wallX = 0; wallX <= 10; wallX++)
{
    for(var wallY = 0; wallY <= 10; wallY++)
    {
        if((wallX == 0 || wallX == 10 || wallY == 0 || wallY == 10)
        && wallX != 5 && wallY != 5)
        {
            var wall = new entity(wallX * wallSize.x + wallOffset.x, wallY * wallSize.y + wallOffset.y, null);
            wall.physics = new rectanglePhysics(wallSize.x, wallSize.y);
            addEntity(wall);
        }
    }   
}

var lastUpdateTime;
function main()
{
	var now = Date.now();
    var secondsSinceUpdate = (now - lastUpdateTime) / 1000;
	update(secondsSinceUpdate);
	draw();
    
    // TODO(ian): Move into renderer and apply scale?
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

//====== MATH ======
function v2(x, y)
{
    if(isNaN(x))
    {
        x = 0;
    }
    if(isNaN(y))
    {
        y = 0;
    }
    this.x = x;
    this.y = y;
}

function v2Multiply(one, scalar)
{
    var result = new v2();
    result.x = one.x * scalar;
    result.y = one.y * scalar;
    return result;
}

function v2MultiplyAssign(v2, scalar)
{
    v2.x *= scalar;
    v2.y *= scalar;
}

function v2Divide(one, scalar)
{
    var result = new v2();
    result.x = one.x / scalar;
    result.y = one.y / scalar;
    return result;
}

function v2DivideAssign(one, scalar)
{
    one.x = one.x / scalar;
    one.y = one.y / scalar;
}

function v2Add(one, two)
{
    var result = new v2();
    result.x = one.x + two.x;
    result.y = one.y + two.y;
    return result;
}

function v2AddAssign(one, two)
{
    one.x += two.x;
    one.y += two.y;
}

function v2Subtract(one, two)
{
    var result = new v2();
    result.x = one.x - two.x;
    result.y = one.y - two.y;
    return result;
}

function v2SubtractAssign(one, two)
{
    one.x -= two.x;
    one.y -= two.y;
}

function v2Length(a)
{
    var result = Math.pow(a.x, 2) + Math.pow(a.y, 2);
    result = Math.sqrt(result);
    return result;
}

function v2Inner(a, b)
{
    return Result = a.x*b.x + a.y*b.y;
}

function v2NormalizeAssign(a)
{
    if(a.x != 0 || a.y != 0)
    {
        v2DivideAssign(a, v2Length(a));
    }
}

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