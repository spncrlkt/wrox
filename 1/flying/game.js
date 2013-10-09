var sprites = {
		ship: {sx: 0, sy: 0, w: 38, h: 42, frames:1},
		missile: {sx: 0, sy:42, w: 6, h:20, frames:1},
		enemy_purple: {sx:37, sy:0,w:42,h:42,frames:1},
		enemy_bee: {sx:79, sy:0,w:37,h:42,frames:1},
		enemy_ship: {sx:116, sy:0,w:42,h:42,frames:1},
		enemy_circle: {sx:158, sy:0,w:33,h:32,frames:1},
		explosion: { sx:0, sy:71, w: 64, h:45, frames:12}
};

var enemies = {
	straight: {x:0 , y:-50 , sprite: 'enemy_ship', 
					E:100, health:10},
	ltr: {x:0 , y:-100 , sprite: 'enemy_purple', 
					B:200, C:1, E:200, health:10},
	circle: {x:400 , y:-50 , sprite: 'enemy_circle', 
					A:0, B:-200, C:1, E:20, F:200, G:1, H: Math.PI/2, health:10},
	wiggle: {x:100 , y:-50 , sprite: 'enemy_bee', 
					B:100, C:4, E:100, health:20},
	step: {x:0 , y:-50 , sprite: 'enemy_circle', 
					B:300, C:1.5, E:60, health:10}
};

var startGame = function() {
	Game.setBoard(0, new StarField(20,0.4,100,true));
	Game.setBoard(1, new StarField(50,0.6,100));
	Game.setBoard(2, new StarField(100,1.0,100));
	Game.setBoard(3, new TitleScreen("Alien Invasion",
																	 "Press space to start playing",
																	 playGame));
}

var playGame = function() {
	var board = new GameBoard();
	board.add(new PlayerShip());
	board.add(new Level(level1,winGame));
	Game.setBoard(3,board);
}
var winGame = function() {
	Game.setBoard(3,new TitleScreen("You win!",
																	"Press fire to play again",
																	playGame));
};

var loseGame = function() {
	Game.setBoard(3,new TitleScreen("You lose!",
																	"Press fire to play again",
																	playGame));
};
	

window.addEventListener("load", function() {
	Game.initialize("game", sprites, startGame);
});

var level1 = [
	//start ,   end,   gap, type,  override
	[0,        4000, 500, 'step'],
	[6000,    13000, 800, 'ltr'],
	[12000,   16000, 400, 'circle'],
	[18200,   20000, 500, 'straight', {x: 150} ],
	[18200,   20000, 500, 'straight', {x: 100} ],
	[18400,   20000, 500, 'straight', {x: 200} ],
	[22000,   25000, 400, 'wiggle', {x: 300} ],
	[22000,   25000, 400, 'wiggle', {x: 200} ]
]

