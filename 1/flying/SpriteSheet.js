var OBJECT_PLAYER = 1,
		OBJECT_PLAYER_PROJECTILE = 2,
		OBJECT_ENEMY = 4,
		OBJECT_ENEMY_PROJECTILE = 8,
		OBJECT_POWERUP = 16;


var Game = new function() {
	this.initialize = function (canvasElementId, sprite_data, callback) {
		this.canvas = document.getElementById(canvasElementId);
		this.width = this.canvas.width;
		this.height = this.canvas.height;

		this.ctx = this.canvas.getContext && this.canvas.getContext('2d');
		if (!this.ctx) { return alert("Please upgrade your browser to play"); }

		this.setupInput();
		this.loop();
		SpriteSheet.load(sprite_data, callback);
	};

	var KEY_CODES = {37:'left', 39:'right', 32:'fire' };
	this.keys = {};
	this.setupInput = function() {
		window.addEventListener('keydown', function(e) {
			if(KEY_CODES[event.keyCode]) {
				Game.keys[KEY_CODES[event.keyCode]] = true;
				e.preventDefault();
			}
		},false);
		window.addEventListener('keyup', function(e) {
			if(KEY_CODES[event.keyCode]) {
				Game.keys[KEY_CODES[event.keyCode]] = false;
				e.preventDefault();
			}
		},false);
	};

	var boards = [];
	this.loop = function() {
		var dt = 30/1000;
		for(var i=0, len = boards.length;i<len;i++) {
			if(boards[i]) {
				boards[i].step(dt);
				boards[i] && boards[i].draw(Game.ctx);
			}
		}
		setTimeout(Game.loop, 30);
	};

	this.setBoard = function(num,board) { boards[num] = board; };
};

var Sprite = function() {};
Sprite.prototype.setup = function(sprite, props) {
	this.sprite = sprite;
	this.merge(props);
	this.frame = this.frame || 0;
	this.w = SpriteSheet.map[sprite].w;
	this.h = SpriteSheet.map[sprite].h;
};

Sprite.prototype.merge = function(props) {
	if(props) {
		for (var prop in props) {
			this[prop] = props[prop];
		}
	}
};

Sprite.prototype.draw = function(ctx) {
	SpriteSheet.draw(ctx, this.sprite, this.x, this.y, this.frame);
};

Sprite.prototype.hit = function(damage) {
	this.board.remove(this);
};

var SpriteSheet = new function() {
	this.map = { };
	this.load = function(spriteData, callback) {
		this.map = spriteData;
		this.image = new Image();
		this.image.onload = callback;
		this.image.src = 'images/sprites.png';
	};
	this.draw = function(ctx, sprite, x, y, frame) {
		var s = this.map[sprite];
		if(!frame) frame = 0;
		ctx.drawImage(this.image, s.sx + frame * s.w,
									s.sy, s.w, s.h, x, y, s.w, s.h);
	}
}


var StarField = function(speed, opacity, numStars, clear) {
	var stars = document.createElement("canvas");
	stars.width = Game.width;
	stars.height = Game.height;
	var starCtx = stars.getContext("2d");

	var offset = 0;

	if(clear) {
		starCtx.fillStyle = "#000";
		starCtx.fillRect(0,0,stars.width,stars.height);
	}

	starCtx.fillStyle = "#FFF";
	starCtx.globalAlpha = opacity;
	for (var i=0;i<numStars;i++) {
		starCtx.fillRect(Math.floor(Math.random()*stars.width),
										 Math.floor(Math.random()*stars.height),
										 2,
										 2);
	}

	this.draw = function(ctx) {
		var intOffset = Math.floor(offset);
		var remaining = stars.height - intOffset;
		if (intOffset > 0) {
			ctx.drawImage(stars,
										0, remaining,
										stars.width, intOffset,
										0, 0,
										stars.width, intOffset);
		}
		if (remaining > 0) {
			ctx.drawImage(stars,
										0, 0,
										stars.width, remaining,
										0, intOffset,
										stars.width, remaining);
		}
	}

	this.step = function(dt) {
		offset += dt * speed;
		offset = offset % stars.height;
	}
}

var TitleScreen = function TitleScreen(title, subtitle, callback) {
	this.step = function(dt) {
		if (Game.keys['fire'] && callback) callback();
	};
	
	this.draw = function(ctx) {
		ctx.fillStyle = "#FFFFFF";
		ctx.textAlign = "center";

		ctx.font = "bold 40px bangers";
		ctx.fillText(title,Game.width/2,Game.height/2);

		ctx.font = "bold 20px bangers";
		ctx.fillText(subtitle,Game.width/2,Game.height/2 + 40);
	};
}

var PlayerShip = function() {
	this.setup('ship', {vx:0, frame:0, reloadTime: 0.25, maxVel: 200});

	this.reload = this.reloadTime;
	this.x = Game.width/2 - this.w/2;
	this.y = Game.height - this.h;
	this.vx = 0;

	this.step = function(dt) {
		this.maxVel = 200;
		this.step = function(dt) {
			if (Game.keys['left']) {this.vx = -this.maxVel}
			else if (Game.keys['right']) { this.vx = this.maxVel;}
			else { this.vx = 0; }

			this.x += this.vx * dt;
			if (this.x < 0) {this.x = 0;}
			else if (this.x > Game.width - this.w) {
				this.x = Game.width - this.w;
			}
			this.reload -= dt;
			if(Game.keys['fire'] && this.reload < 0) {
				Game.keys['fire'] = false;
				this.reload = this.reloadTime;
				this.board.add(new PlayerMissile(this.x, this.y+this.h/2));
				this.board.add(new PlayerMissile(this.x+this.w, this.y+this.h/2));
			}
		}
	}
};

PlayerShip.prototype = new Sprite();
PlayerShip.prototype.type = OBJECT_PLAYER;
PlayerShip.prototype.hit = function(damage) {
	if(this.board.remove(this)) {
		loseGame();
	}
};

var PlayerMissile = function(x,y) {
	this.setup('missile', {vy: -700, damage:10 });
	this.x = x - this.w/2;
	this.y = y - this.h;
};

PlayerMissile.prototype = new Sprite();
PlayerMissile.prototype.type = OBJECT_PLAYER_PROJECTILE;

PlayerMissile.prototype.step = function(dt) {
	this.y += this.vy * dt;
	var collision = this.board.collide(this,OBJECT_ENEMY);
	if (collision) {
		collision.hit(this.damage);
		this.board.remove(this);
	} else if (this.y < -this.h) {
		this.board.remove(this);
	}
};


var Enemy = function(blueprint, override) {
	this.merge(this.baseParameters);
	this.setup(blueprint.sprite,blueprint);
	this.merge(override);
}
Enemy.prototype = new Sprite();
Enemy.prototype.type = OBJECT_ENEMY;
Enemy.prototype.baseParameters = { A: 0, B: 0, C: 0, D: 0,
												 					 E: 0, F: 0, G: 0, H: 0, t: 0 };

Enemy.prototype.step = function(dt) {
	this.t += dt;
	this.vx = this.A + this.B * Math.sin(this.C * this.t + this.D);
	this.vy = this.E + this.F * Math.sin(this.G * this.t + this.H);
	this.x += this.vx * dt;
	this.y += this.vy * dt;

	var collision = this.board.collide(this,OBJECT_PLAYER);
	if (collision) {
		collision.hit(this.damage);
		this.board.remove(this);
	}

	if (this.y > Game.height ||
			this.x < -this.w ||
			this.x > Game.width) {
				this.board.remove(this);
	}
}

Enemy.prototype.hit = function(damage) {
	this.health -= damage;
	if(this.health<=0) {
		if(this.board.remove(this)) {
			this.board.add(new Explosion(this.x + this.w/2,
																	 this.y + this.h/2));
		}
	}
}

var Explosion = function(centerX, centerY) {
	this.setup('explosion', {frame:0});
	this.x = centerX - this.w/2;
	this.y = centerY - this.h/2;
	this.subFrame = 0;
}
Explosion.prototype = new Sprite();
Explosion.prototype.step = function(dt) {
	this.frame = Math.floor(this.subFrame++/3);
	if (this.subFrame >= 36) {
		this.board.remove(this);
	}
}

var GameBoard = function () {
	var board = this;
	this.objects = [];
	this.cnt = [];
	this.add = function(obj) {
		obj.board = this;
		this.objects.push(obj);
		this.cnt[obj.type] = (this.cnt[obj.type] || 0) + 1;
		return obj;
	};

	// Mark for removal
	this.remove = function(obj) {
		var wasStillAlive = this.removed.indexOf(obj) == -1;
		if (wasStillAlive) {this.removed.push(obj);}
		return wasStillAlive;
	}
	this.resetRemoved = function() {this.removed = [];}

	this.finalizeRemoved = function() {
		for(var i=0, len=this.removed.length;i<len;i++) {
			var idx = this.objects.indexOf(this.removed[i]);
			if(idx != -1) {
				this.cnt[this.removed[i].type]--;
				this.objects.splice(idx,1);
			}
		}
	};

	this.iterate = function(funcName) {
		var args = Array.prototype.slice.call(arguments,1);
		for(var i=0, len = this.objects.length;i<len;i++) {
			var obj = this.objects[i];
			obj[funcName].apply(obj,args);
		}
	}

	this.detect = function(func) {
		for(var i=0, val=null, len=this.objects.length; i < len; i++) {
			if(func.call(this.objects[i])) return this.objects[i];
		}
		return false;
	};

	this.step = function(dt) {
		this.resetRemoved();
		this.iterate('step',dt);
		this.finalizeRemoved();
	};

	this.draw = function(ctx) {
		this.iterate('draw',ctx);
	}

	this.overlap = function(o1, o2) {
		return !((o1.y+o1.h-1<o2.y) || (o1.y>o2.y+o2.h-1) ||
						 (o1.x+o1.w-1<o2.x) || (o1.x>o2.x+o2.w-1));
	};

	this.collide = function(obj,type) {
		return this.detect(function() {
			if(obj != this) {
				var col = (!type || this.type & type) && board.overlap(obj,this);
				return col ? this : false;
			}
		});
	};
}				

var Level = function(levelData, callback) {
	this.levelData = [];
	for(var i=0; i<levelData.length; i++) {
		this.levelData.push(Object.create(levelData[i]));
	}
	this.t = 0;
	this.callback = callback;
}

Level.prototype.step = function(dt) {
	var idx = 0, remove = [], curShip = null;

	this.t += dt*1000;
	while((curShip = this.levelData[idx]) &&
				(curShip[0] < this.t + 2000)) {
		if(this.t > curShip[1]) {
			remove.push(curShip);
		} else if (curShip[0] < this.t) {
			var enemy = enemies[curShip[3]],
					override = curShip[4];

			this.board.add(new Enemy(enemy,override));

			curShip[0] += curShip[2];
		}
		idx++;
	}
	for(var i=0, len=remove.length;i<len;i++) {
		var idx = this.levelData.indexOf(remove[i]);
		if(idx != -1) this.levelData.splice(idx,1);
	}
	if (this.levelData.length == 0 && this.board.cnt[OBJECT_ENEMY] == 0) {
		if (this.callback) this.callback();
	}
};

Level.prototype.draw = function(ctx) { };
