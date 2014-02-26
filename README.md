1. Purpose and Principles
	Why. What problem are we trying to solve
		Want to make a game. Should be fun and easy to get into.
	What are our boundaries
		Only got 3 days to build it in spare time
	
2. Outcome Visioning
	What will it look like when it's done
		must have:
			You will be able to move a snake around a playing field
			food will randomly appear
			you can consume the food to increase the size of your snake
			your score increases as you eat the food
			running into the boundaries or your own snake kills you
			you are shown your score (screen-shottable)
			you can re-start with a new snake
		additional features:
			multiple players can join and leave
			the world size fluctuates with the number of players
			the food frequency fluctuates with the number of players
			all names and scores are shown on-screen in descending order
			snakes have the player above them
			chat-log, as well as arrows for directions, messages can be typed

3. Brainstorming
	What's involved
		client
		server
	Any other thoughts
		graphics?
		sound-effects?
	
4. Organising
	Priorities

	Order of events
	
5. Next Actions
	What actions must be done
	Who will do them

a snake has:
	name 		string
	parts		array of xy coords
	velocity	object with x and y properties
	score 		int

each keypress:
	send keypress to server

on server keypress
	set snake's velocity:
	up:		if(y != -1)	x=0,y=1
	down: 	if(y != 1)	x=0,y=-1
	left:	if(x != -1)	x=-1,y=0
	right:	if(x != 1)	x=1,y=0

each cycle:
	move snakes
	if(food time)
		create food
	fi
	resize world
	send game state to each client

move snake:
	new head x = old head x + velocity x
	new head y = old head y + velocity y
	add new head to array
	if new head on snake or wall
		set velocity = 0
		send gameover
	else if new head on food
		remove food
		increase score
	else
		old tail from array
	fi

food time?
	if time till next food = 0
		return true
	else
		decrease time till next food
		return false
	fi

create food
	choose random coord within bounds
	while (coord collides with snake)
		choose random coord within bounds
	end while
	create food at coord

resize world
	if (too many snakes for this world size)
		increase world size
	if (too few snakes for this world size)
		if (no snakes would be affected by world shrink)
			decrease world size
		fi
	fi

create game state
	{
		"snakes": 
		[
			{
				"name": "Dean",
				"score": 2,
				"body": [[2,3], [3,3], [3,2], [3,1], [4,1]]
			},
			{
				"name": "Lloyd",
				"score": 41,
				"body": [[2,3], [3,3], [3,2], [3,1]]
			}
		],
		"world":
		{
			"width": 20,
			"height": 10
		},
		"food": [[0,0], [-5,4]],
		"messages": ["Dean: Hello", "Lloyd: Hi"]
	}

client recieve game state
	draw world
	draw snakes
	draw food
	draw scoreboard
	draw messages

client keypress
	if up/down/left/right
		send direction to server
	if legal message character
		add to message composer
	if backspace
		rm from message composer
	if return/enter
		send message to server
	fi




eg snake:

3 O#
2  #
1  ##
01234

{2,3}, {3,3}, {3,2}, {3,1}, {4,1}
