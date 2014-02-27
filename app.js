var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app, {log: false})
  , fs = require('fs')

app.listen(80);
console.log("Server started");

function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}

var game =  {};
var liveSnakeCount = 0;
var lowestScore    = 0;
var highestScore   = 0;
var SPEED_STANDBY  = 2000;
// var SPEED_SLOW     = 2000;
var SPEED_SLOW     = 225;
var SPEED_NORMAL   = 200;
var SPEED_FAST     = 175;
var SPEED_FASTEST  = 150;
var GAME_WIDTH     = 30;
var GAME_HEIGHT    = 20;
resetGame();
cycle();

function resetGame()
{
  game = {
    "snakes": [],
    "food": [],
    "world":
    {
      "width": GAME_WIDTH,
      "height": GAME_HEIGHT
    }
  };
}


io.sockets.on('connection', function (socket) {

  socket.emit('id', socket.id);

  socket.on('start', function (name) {
    console.log(name + " started");
    if(socket.snake) socket.snake.id = null;
    socket.snake = newSnake();
    socket.snake.id = socket.id;
    socket.snake.name = name;
    game.snakes.push(socket.snake);
  });

  socket.on('direction', function (direction) {
    if(!socket.snake) return;
    if(socket.snake.dead) return;

    // console.log(socket.snake.name + ' changed direction to ' + direction);
    if(direction == 'up'      && socket.snake.previousVelocity.y  != 1)  { socket.snake.velocity.x=0 ;  socket.snake.velocity.y=-1; }
    if(direction == 'down'    && socket.snake.previousVelocity.y  != -1) { socket.snake.velocity.x=0 ;  socket.snake.velocity.y=1; }
    if(direction == 'left'    && socket.snake.previousVelocity.x  != 1)  { socket.snake.velocity.x=-1;  socket.snake.velocity.y=0; }
    if(direction == 'right'   && socket.snake.previousVelocity.x  != -1) { socket.snake.velocity.x=1 ;  socket.snake.velocity.y=0; }
  });

  socket.on('disconnect', function() {
    if(socket.snake)
    {
      console.log(socket.snake.name + ' dcd');
      kill(socket.snake);
    }
  });

});


function cycle()
{
  if(liveSnakeCount == 0)
  {
    setTimeout(cycle, SPEED_STANDBY);
    return;
  }

  if(     lowestScore < 3)  setTimeout( cycle, SPEED_SLOW);
  else if(lowestScore < 7)  setTimeout( cycle, SPEED_NORMAL);
  else if(lowestScore < 15) setTimeout( cycle, SPEED_FAST);
  else setTimeout(                      cycle, SPEED_FASTEST);

  lowestScore = 100;
  for(var i=0; i<game.snakes.length; i++)
  {
    var snake = game.snakes[i];

    if(!snake.id) kill(snake);

    if(snake.dead)
    {
      if(!snake.decay)
      {
        snake.decay = 1;
      }
      else
      {
        if(++snake.decay > 100) game.snakes.splice(i,1);
      }
      continue;
    }

    calculateNewHead(snake);

    if(collidesWithWall(snake.newHead))
    {
      console.log(snake.name + " ran into a wall", snake.newHead);
      kill(snake);
    }

    var colliedSnake = collidesWithSnake(snake.newHead);
    if(colliedSnake)
    {
      console.log(snake.name + " ran into " + colliedSnake);
      kill(snake);
    }

    if(snake.dead) continue;

    snake.body.unshift(snake.newHead.slice(0));

    var collidedFood = collidesWithFood(snake.newHead);
    if(collidedFood)
    {
      snake.score++;
      game.food.splice(game.food.indexOf(collidedFood), 1);
      // console.log(snake.name + " got some food. new score: " + snake.score);
    }
    else
    {
      snake.body.pop();
    }

    if(snake.score < lowestScore) lowestScore = snake.score;
  }

  if(!enoughFood()) moreFood();
  io.sockets.emit('game', game);
}

function newSnake()
{
  // todo: random position & velocity
  var snake = {};
  snake.score = 0;
  snake.velocity = {};
  snake.velocity.x = -1;
  snake.velocity.y = 0;
  snake.previousVelocity = {};
  snake.previousVelocity.x = null;
  snake.previousVelocity.y = null;
  snake.dead = false;
  snake.newHead = [null,null];
  snake.body = getNewSnakeBody(); //[[8,5], [9,5], [10,5]];
  liveSnakeCount++;
  return snake;
}

function getNewSnakeBody()
{
  var tries = 0;
  var coord = randomCoord();
  coord[0] = Math.floor(coord[0]/2)+(game.world.width/2)-3; // right-hand side
  var body = [];
  body.push(coord);
  body.push([coord[0]+1, coord[1]]);
  body.push([coord[0]+2, coord[1]]);
  return body;
}

function calculateNewHead(snake)
{
    var headX = snake.body[0][0];
    var headY = snake.body[0][1];
    snake.newHead[0] = headX + snake.velocity.x;
    snake.newHead[1] = headY + snake.velocity.y;
    snake.previousVelocity.x = snake.velocity.x;
    snake.previousVelocity.y = snake.velocity.y;
}

function collidesWithFood(coords)
{
    for(var j=0; j<game.food.length; j++)
    {
      var food = game.food[j];
      var foodX = food[0];
      var foodY = food[1];
      if(coords[0] == foodX && coords[1] == foodY)
      {
        return food;
      }
    }
    return false;
}

function moreFood()
{
  var food = randomCoord();
  var tries = 0;
  while(collidesWithSnake(food))
  {
    food = randomCoord();
    if(++tries > 5) continue;
  }

  while(collidesWithFood(food))
  {
    food = randomCoord();
    if(++tries > 5) continue;
  }
  
  // while(inFrontOfSnake)
  
  game.food.push(food);

  if(!enoughFood()) moreFood();
}

function randomCoord()
{
  var x = (Math.floor(Math.random()*(game.world.width-2))+1);
  var y = (Math.floor(Math.random()*(game.world.height-2))+1);
  return [x,y];
}

function collidesWithWall(coords)
{
  if(coords[0] == 0) return true;
  if(coords[0] == game.world.width-1) return true;
  if(coords[1] == 0) return true;
  if(coords[1] == game.world.height-1) return true;
  return false;
}

function collidesWithSnake(coords)
{
    for(var j=0; j<game.snakes.length; j++)
    {
      var snake = game.snakes[j];
      if(snake.dead) continue;
      for(var k=0; k<snake.body.length; k++)
      {
        var bodyPartX = snake.body[k][0];
        var bodyPartY = snake.body[k][1];
        if(coords[0] == bodyPartX && coords[1] == bodyPartY)
        {
          return snake.name;
        }
      }
    }
    return false;
}

function enoughFood()
{
  // return (game.food.length > 5);
  return (game.food.length >= Math.ceil(liveSnakeCount/2));
}

function kill(snake)
{
  if(snake.dead) return;
  snake.dead = true;
  liveSnakeCount--;
}
