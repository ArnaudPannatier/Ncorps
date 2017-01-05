var c;
var Ncorps = {
	N : 100,
	treshold : 0.5,
	minM : 20000,
	maxM : 100000,
	maxForce : 0,
	gamma : 1,
	xsi : 0.58,
	G :1e-5,
	dt : 0.0005,
	t : 20,
	relativeTaille : 70,
	bodies : new Array(),
	stop : false,
	closeEncounter : 0.0001,
	frottement : 0.01,
	ombre : 20,
	miseazero : function(){
		Ncorps.createRandom(Ncorps.N);
		Ncorps.createTree();
	},
	createRandom : function(n){
		for (var i = 0; i < n; i++) {
			Ncorps.bodies[i] = {};
			Ncorps.bodies[i].masse = Ncorps.minM+Math.floor(Math.random()*(Ncorps.maxM-Ncorps.minM));
			Ncorps.bodies[i].x = Math.random();
			Ncorps.bodies[i].y = Math.random()/Ncorps.ratio;
			Ncorps.bodies[i].radius = Ncorps.gamma*Math.pow(Ncorps.bodies[i].masse, 1/Ncorps.xsi);
			Ncorps.bodies[i].force = {x:0,y:0};
			Ncorps.bodies[i].vx = Math.random();
			Ncorps.bodies[i].vy = Math.random()/Ncorps.ratio;
		}

	},

	createTree : function(){
		Ncorps.Tree = new Node({x: 0,y:0}, {x : 1, y: 1/Ncorps.ratio});
		Ncorps.bodies.forEach(function(b){
			Ncorps.placeBody(Ncorps.Tree, b);
		});
	},
	placeBody : function(cur, b){
		if(Ncorps.isinRect(b)){

			cur.cm.x = (cur.cm.x*cur.totalMass+b.masse*b.x)/(b.masse+cur.totalMass);	
			cur.cm.y = (cur.cm.y*cur.totalMass+b.masse*b.y)/(b.masse+cur.totalMass);		
			cur.totalMass += b.masse;

			if(cur.hasChildren){
				Ncorps.placeBody(Ncorps.findQuadrant(cur,b), b);
			}else{
				if(cur.isEmpty){

					cur.body = b;
					cur.isEmpty = false;
				}else{
					Ncorps.makeChilrenAndPlace(cur,b);

				}
			}
		}else{
/*			var ind = Ncorps.bodies.indexOf(b);
			if(ind > -1){
				Ncorps.bodies.splice(ind,1);
			}*/
			//Ncorps.shiftToRect(b);
			Ncorps.rebondit(b);

		}
	},
	rebondit : function(b){
		if((b.x <= 0 && b.vx <= 0) || (b.x >= 1 && b.vx >= 0)){
			b.vx = -b.vx;
		}
		if((b.y <= 0 && b.vy <=0)||(b.y >= 1/Ncorps.ratio && b.vy >=0)){
			b.vy = -b.vy;
		}


	},
	shiftToRect: function(b){
		if(b.x <= 0){
			b.x+=1;
		}
		if(b.x >= 1){
			b.x -=1;
		}
		if(b.y <= 0){
			b.y+=1;
		}
		if(b.y >= 1/Ncorps.ratio){
			b.y -=1/Ncorps.ratio;
		}


	},
	isinRect : function(b){
		return (b.x>=0 &&b.x <=1) && (b.y>=0 &&b.y <=1/Ncorps.ratio);
	},
	makeChilrenAndPlace : function(cur,b){
		cur.hasChildren = true;
		c = cur.body;
		midx = (cur.stpt.x + cur.endpt.x)/2;
		midy = (cur.stpt.y + cur.endpt.y)/2;

		cur.nw = new Node(cur.stpt,{x:midx, y: midy});
		cur.sw = new Node({x: cur.stpt.x, y : midy }, {x: midx, y : cur.endpt.y});
		cur.ne = new Node({x: midx, y : cur.stpt.y},{x:cur.endpt.x, y:midy});
		cur.se = new Node({x:midx, y: midy}, cur.endpt);

		Ncorps.placeBody(cur,b);
		Ncorps.placeBody(cur,c);
	},
	findQuadrant : function(cur,b){
		relx = b.x-cur.stpt.x;
		midx = (cur.stpt.x + cur.endpt.x)/2-cur.stpt.x; 
		rely = b.y-cur.stpt.y;
		midy = (cur.stpt.y + cur.endpt.y)/2-cur.stpt.y;

		if(relx < midx){
			if(rely < midy)
				return cur.nw;
			else
				return cur.sw;
		}else {
			if(rely < midy)
				return cur.ne;
			else
				return cur.se;
		}

	},
	exploreTree : function(n,f){
		f(n);
		if(n.hasChildren){
			Ncorps.exploreTree(n.nw,f);
			Ncorps.exploreTree(n.sw,f);
			Ncorps.exploreTree(n.ne,f);
			Ncorps.exploreTree(n.se,f);
		}
	},
	exploreTreeAddForce : function(n,b){
		if(n.hasChildren){
			s = n.endpt.x-n.stpt.x;
			d = Math.sqrt((b.x-n.cm.x)*(b.x-n.cm.x)+(b.y-n.cm.y)*(b.y-n.cm.y));

			if(s/d > Ncorps.treshold){
				Ncorps.exploreTreeAddForce(n.nw,b);
				Ncorps.exploreTreeAddForce(n.sw,b);
				Ncorps.exploreTreeAddForce(n.ne,b);
				Ncorps.exploreTreeAddForce(n.se,b);
				
			}else {
				var d2 = Math.sqrt((b.x-n.cm.x)*(b.x-n.cm.x)+(b.y-n.cm.y)*(b.y-n.cm.y));
				if(d2 > Ncorps.closeEncounter){
					var force = -Ncorps.G*n.totalMass/d2;

					angle = Math.atan2(b.y-n.cm.y,b.x-n.cm.x);
					b.force = {x: b.force.x+force*Math.cos(angle)-Ncorps.frottement*b.vx, y : b.force.y+force*Math.sin(angle)-Ncorps.frottement*b.vy};
				}

			}
		}else {


			var d2 = Math.sqrt((b.x-n.cm.x)*(b.x-n.cm.x)+(b.y-n.cm.y)*(b.y-n.cm.y));
			if(d2 > Ncorps.closeEncounter){
				var force = -Ncorps.G*n.totalMass/d2;

				angle = Math.atan2(b.y-n.cm.y,b.x-n.cm.x);
				b.force = {x: b.force.x+force*Math.cos(angle) -Ncorps.frottement*b.vx, y : b.force.y+force*Math.sin(angle)-Ncorps.frottement*b.vy};
			}

		}
	},

	getForces : function(){
		Ncorps.bodies.forEach(function(b){	
			b.force = {x:0,y:0};		
			Ncorps.exploreTreeAddForce(Ncorps.Tree,b);
			if(Ncorps.normaliseAffichage(b) > Ncorps.maxForce)	
				Ncorps.maxForce = Ncorps.normaliseAffichage(b) ;
			
		});
	},
	draw : function(){
		c = Ncorps.ctx;
		c.clearRect(0, 0, Ncorps.container.width, Ncorps.container.height);

		c.shadowBlur = 10;
		c.shadowColor = "white";
	
		Ncorps.bodies.forEach(function(b){

			c.shadowBlur = Ncorps.ombre;
			c.beginPath();
			c.arc(b.x*Ncorps.Lx, b.y*Ncorps.Lx, Ncorps.normalise(b.radius), 0, 2 * Math.PI, false);
			c.fillStyle = "#ecf0f1";
			c.fill();

			c.shadowBlur = 0;
			c.strokeStyle="#f00";
			c.fillStyle="#f00";
			drawArrow(c, b.x*Ncorps.Lx, b.y*Ncorps.Lx, Math.atan2(b.force.y,b.force.x), Ncorps.normaliseAffichage(b)/Ncorps.maxForce*100);



		});

		c.shadowBlur = 0;
		c.lineWidth = 0.5;
		Ncorps.exploreTree(Ncorps.Tree, function(n){
			c.beginPath();
			c.moveTo(n.endpt.x*Ncorps.Lx,n.stpt.y*Ncorps.Lx);
			c.lineTo(n.endpt.x*Ncorps.Lx,n.endpt.y*Ncorps.Lx);
			c.lineTo(n.stpt.x*Ncorps.Lx,n.endpt.y*Ncorps.Lx);
			c.strokeStyle="#ecf0f1";
			c.stroke();

		});
		c.shadowBlur = Ncorps.ombre;
		c.shadowColor = "black";
		c.beginPath();
		c.arc(Ncorps.Tree.cm.x*Ncorps.Lx, Ncorps.Tree.cm.y*Ncorps.Lx, 3, 0, 2 * Math.PI, false);
			//c.fillStyle = "#2ecc71";
			c.fillStyle ="#000";
			c.fill();




		},
		evolue : function(){
			if(!Ncorps.stop){
				Ncorps.bodies.forEach(function(b){
					b.x = b.x + b.vx*Ncorps.dt;
					b.y = b.y + b.vy*Ncorps.dt;

					b.vx = b.vx+b.force.x*Ncorps.dt;
					b.vy = b.vy+b.force.y*Ncorps.dt;

				});
				Ncorps.createTree();
				Ncorps.getForces();
				Ncorps.draw();
			}
		},
		normalise : function(r){
			return r/(Ncorps.gamma*Math.pow(Ncorps.maxM, 1/Ncorps.xsi))*Ncorps.Ly/Ncorps.relativeTaille;
		},
		normaliseAffichage : function(b){
			return Math.abs(Math.log(b.force.x*b.force.x+b.force.y*b.force.y+1));


		},
		addBodyClickInit : function(){
			var ombCorr = Ncorps.ombre+4;

			Ncorps.randomMasse = Ncorps.minM+Math.floor(Math.random()*(Ncorps.maxM-Ncorps.minM));
			Ncorps.randomRadius = Ncorps.gamma*Math.pow(Ncorps.randomMasse, 1/Ncorps.xsi)
			Ncorps.randomSize = Ncorps.normalise(Ncorps.randomRadius);

			Ncorps.newCorps = document.getElementById('newCorps');
			
			Ncorps.newCorps.width = 2*Ncorps.randomSize+ombCorr;
			Ncorps.newCorps.height = 2*Ncorps.randomSize+ombCorr;
			if(Ncorps.newCorps.getContext){
				Ncorps.ctxNew = Ncorps.newCorps.getContext('2d');
				cN = Ncorps.ctxNew;
				cN.globalAlpha = 0.5;
				cN.clearRect(0, 0, 2*Ncorps.randomSize+ombCorr, 2*Ncorps.randomSize+ombCorr);

				cN.shadowBlur = Ncorps.ombre;
				cN.shadowColor = "white";
				cN.fillStyle = "#ecf0f1";
				cN.beginPath();
				cN.moveTo(0,0);
				cN.arc(Ncorps.randomSize+ombCorr/2, Ncorps.randomSize+ombCorr/2, Ncorps.randomSize, 0, 2 * Math.PI, false);
				Ncorps.ctxNew.fill();	
			}
			$(window).mousemove(function(e){
				Ncorps.newCorps.style.top = e.clientY - (Ncorps.randomSize + ombCorr/2) +"px";
				Ncorps.newCorps.style.left = e.clientX - (Ncorps.randomSize + ombCorr/2)+"px";
			});


		},
		addBodyClick : function(){
			var ombCorr = Ncorps.ombre+4;
			Ncorps.addBodyClickInit();

			$(window).click(function(e){

				var end = Ncorps.bodies.length;
				console.log(end);
				Ncorps.bodies[end] = {};
				Ncorps.bodies[end].masse = Ncorps.randomMasse;
				Ncorps.bodies[end].x = e.clientX/Ncorps.Lx;
				Ncorps.bodies[end].y = e.clientY/Ncorps.Lx;
				Ncorps.bodies[end].radius = Ncorps.randomRadius;
				Ncorps.bodies[end].force = {x:0,y:0};
				Ncorps.bodies[end].vx = 0;
				Ncorps.bodies[end].vy = 0;
				console.log(Ncorps.bodies);
				Ncorps.createTree();

				Ncorps.addBodyClickInit();



			});

		},
		init : function(){

			Ncorps.container = document.getElementById('container');
			Ncorps.container.width = window.innerWidth;
			Ncorps.container.height = window.innerHeight;
			Ncorps.Lx = Ncorps.container.width;
			Ncorps.Ly = Ncorps.container.height;
			Ncorps.ratio = Ncorps.Lx/Ncorps.Ly;

			if(Ncorps.container.getContext){ 

				Ncorps.ctx = Ncorps.container.getContext('2d'); 
				c = Ncorps.ctx;

				Ncorps.miseazero();

				Ncorps.getForces();

				Ncorps.draw();
				setInterval(Ncorps.evolue, Ncorps.t);
			}
			$(window).resize(function(){
				Ncorps.container.width = window.innerWidth;
				Ncorps.container.height = window.innerHeight;
				Ncorps.Lx = Ncorps.container.width;
				Ncorps.Ly = Ncorps.container.height;

				Ncorps.ratio = Ncorps.Lx/Ncorps.Ly;
				if(Ncorps.container.getContext){ 
					Ncorps.draw();
				}
			});
			$(window).keypress(function(e){
				if(e.keyCode == 32){
					Ncorps.stop = (Ncorps.stop)? false : true;
				}
			});
			Ncorps.addBodyClick();


		}
	};
	function Node(stpt,endpt){
		this.stpt = stpt,
		this.endpt = endpt,
		this.totalMass = 0,
		this.cm = {x : 0,y : 0}, 
		this.nw = {},
		this.ne = {},
		this.sw = {},
		this.se = {},
		this.isEmpty = true,
		this.hasChildren = false
	};
	function drawArrow(c,x1,y1,alpha,norm){
		x2 = x1+norm*Math.cos(alpha);
		y2 = y1+norm*Math.sin(alpha);
		vec = {x: x2-x1, y :y2-y1};
		vec.x /= Math.sqrt(vec.x*vec.x+vec.y*vec.y); 
		vec.y /= Math.sqrt(vec.x*vec.x+vec.y*vec.y); 

		vecn = {x: y2-y1, y :x2-x1};
		vecn.x /= Math.sqrt(vecn.x*vecn.x+vecn.y*vecn.y); 
		vecn.y /= Math.sqrt(vecn.x*vecn.x+vecn.y*vecn.y); 
		c.beginPath();
		c.moveTo(x1,y1);
		c.lineTo(x2,y2);
	//c.lineTo(x2-10*vec.x, y2-10*vec.y);
	//c.lineTo(x2-10*vec.x+5*vecn.x,y2-10*vec.y+5*vecn.y);
	//c.lineTo(x2-10*vec.x-5*vecn.x,y2-10*vec.y-5*vecn.y);
	
	c.lineTo(x2,y2);
	c.stroke();
	c.fill();


}


window.onload = function(){
	Ncorps.init();
};