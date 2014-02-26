var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app, {log: false})
  , fs = require('fs')

app.listen(80);

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

var game =  {
  "snakes": [],
  "world":
  {
    "width": 60,
    "height": 20
  },
  "food": [[1,1], [10,10], [59,19]],
  "messages": ["Dean: Hello", "Lloyd: Hi"]
};

io.sockets.on('connection', function (socket) {

  socket.emit('id', socket.id);

  socket.on('start', function (name) {
    var snake = {};
    snake.id = socket.id;
    snake.name = name;
    snake.score = 0;
    snake.velocity = {};
    snake.velocity.x = 1;
    snake.velocity.y = 0;
    snake.dead = false;
    snake.body = [[5,5], [5,6], [5,7]];
    snake.newHead = {};
    snake.newHead.x = null;
    snake.newHead.y = null;
    socket.snake = snake;
    game.snakes.push(snake);
  });

  socket.on('direction', function (direction) {
    console.log(socket.snake.name + ' changed direction to ' + direction);
    if(direction == 'up'      && socket.snake.velocity.y  != 1)  { socket.snake.velocity.x=0 ;  socket.snake.velocity.y=-1;}
    if(direction == 'down'    && socket.snake.velocity.y  != -1) { socket.snake.velocity.x=0 ;  socket.snake.velocity.y=1;}
    if(direction == 'left'    && socket.snake.velocity.x  != 1)  { socket.snake.velocity.x=-1;  socket.snake.velocity.y=0;}
    if(direction == 'right'   && socket.snake.velocity.x  != -1) { socket.snake.velocity.x=1 ;  socket.snake.velocity.y=0;}
  });

  socket.on('disconnect', function() {
    if(socket.snake) console.log(socket.snake.name + ' dcd');    
  });

});


function cycle()
{
  for(var i=0; i<game.snakes.length; i++)
  {
    var snake = game.snakes[i];

    if(snake.dead) continue;

    calculateNewHead(snake);
    
    if(collidesWithWall(snake) || collidesWithSnake(snake))
    {
      snake.dead = true;
    }
    else
    {
      // add new head to beginning
      snake.body.reverse();
      snake.body.push([snake.newHead.x, snake.newHead.y]);
      snake.body.reverse();

      var food = getFoodCollision(snake);
      if(food)
      {
        snake.score++;
        // todo: rm food
      }
      else
      {
        snake.body.pop();
      }
    }
  }

  io.sockets.emit('game', game);
}

// setInterval(cycle, 2000);
setInterval(cycle, 500);


function calculateNewHead(snake)
{
    var headX = snake.body[0][0];
    var headY = snake.body[0][1];
    snake.newHead.x = headX + snake.velocity.x;
    snake.newHead.y = headY + snake.velocity.y;
}

function getFoodCollision(snake)
{
    for(var j=0; j<game.food.length; j++)
    {
      var food = game.food[j];
      var foodX = food[0];
      var foodY = food[1];
      if(snake.newHead.x == foodX && snake.newHead.y == foodY)
      {
        console.log(snake.name + " ate some food");
        return food;
      }
    }
    return false;
}

function collidesWithWall(snake)
{
    var crashed = false;
    
    if(snake.newHead.x == 0) crashed = true;
    if(snake.newHead.x == game.world.width-1) crashed = true;
    if(snake.newHead.y == 0) crashed = true;
    if(snake.newHead.y == game.world.height-1) crashed = true;
    
    if(crashed) console.log(snake.name + " crashed into a wall");

    return crashed;
}

function collidesWithSnake(thisSnake)
{
    for(var j=0; j<game.snakes.length; j++)
    {
      var otherSnake = game.snakes[j];
      if(otherSnake.dead) continue;
      for(var k=0; k<otherSnake.body.length; k++)
      {
        var otherSnakeBodyPartX = otherSnake.body[k][0];
        var otherSnakeBodyPartY = otherSnake.body[k][1];
        if(thisSnake.newHead.x == otherSnakeBodyPartX && thisSnake.newHead.y == otherSnakeBodyPartY)
        {
          console.log(thisSnake.name + " crashed into " + otherSnake.name);
          return true;
        }
      }
    }
    return false;
}
