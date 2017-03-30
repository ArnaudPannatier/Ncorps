var c;
var Ncorps = {
	N : 50,
	treshold : 0.5,
	minM : 20000,
	maxM : 100000,
	maxForce : 0,
	gamma : 1,
	xsi : 0.58,
	G :1e-5,
	dt : 0.001,
	t : 20,
	time : 0,
	relativeTaille : 30,
	bodies : new Array(),
	stop : false,
	closeEncounter : 0.0001,
	depth : 30,
	frottement : 0.03,
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
			Ncorps.placeBody(Ncorps.Tree, b,1);
		});
	},
	placeBody : function(cur, b, depth){
		if(Ncorps.isinRect(b)){
			
			cur.cm.x = (cur.cm.x*cur.totalMass+b.masse*b.x)/(b.masse+cur.totalMass);	
			cur.cm.y = (cur.cm.y*cur.totalMass+b.masse*b.y)/(b.masse+cur.totalMass);		
			cur.totalMass += b.masse;

			if(cur.hasChildren){
				if(depth <= Ncorps.depth){
					Ncorps.placeBody(Ncorps.findQuadrant(cur,b), b, depth+1);
				}else{
					Ncorps.fusionne(cur, b);
				}
			}else{
				if(cur.isEmpty){

					cur.body = b;
					cur.isEmpty = false;
				}else{
					Ncorps.makeChilrenAndPlace(cur,b,depth);

				}
			}

		}else{

			Ncorps.shiftToRect(b);

		}
	},
	supprime : function(b){
		var ind = Ncorps.bodies.indexOf(b);
		if(ind > -1){
			Ncorps.bodies.splice(ind,1);
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
	makeChilrenAndPlace : function(cur,b,depth){
		cur.hasChildren = true;
		c = cur.body;
		midx = (cur.stpt.x + cur.endpt.x)/2;
		midy = (cur.stpt.y + cur.endpt.y)/2;

		cur.nw = new Node(cur.stpt,{x:midx, y: midy});
		cur.sw = new Node({x: cur.stpt.x, y : midy }, {x: midx, y : cur.endpt.y});
		cur.ne = new Node({x: midx, y : cur.stpt.y},{x:cur.endpt.x, y:midy});
		cur.se = new Node({x:midx, y: midy}, cur.endpt);

		Ncorps.placeBody(cur,b,depth+1);
		Ncorps.placeBody(cur,c, depth +1);
	},
	fusionne : function(cur,b){
		c = cur.body;

		var end = Ncorps.bodies.length;
		Ncorps.bodies[end] = {};
		Ncorps.bodies[end].masse =( c.masse + b.masse > Ncorps.maxM*2) ? Ncorps.maxM*2 : c.masse + b.masse ;
		Ncorps.bodies[end].x = (c.x*c.masse+b.masse*b.x)/(b.masse+c.masse);
		Ncorps.bodies[end].y = (c.y*c.masse+b.masse*b.y)/(b.masse+c.masse);
		Ncorps.bodies[end].radius = Ncorps.gamma*Math.pow(Ncorps.bodies[end].masse, 1/Ncorps.xsi);
		Ncorps.bodies[end].force = {x:0,y:0};
		

		//conservation of momentum
		Ncorps.bodies[end].vx = (b.vx*b.masse+c.vx*c.masse)/(c.masse+b.masse);
		Ncorps.bodies[end].vy = (b.vy*b.masse+c.vy*c.masse)/(c.masse+b.masse);
		cur.body = Ncorps.bodies[end];

		Ncorps.supprime(c);
		Ncorps.supprime(b);
		Ncorps.N = Ncorps.bodies.length;
		$('#N').text(Ncorps.N);

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
				Ncorps.maxForce = Ncorps.normaliseAffichage(b);
			
		});
	},
	getEcin : function(){
		var Ecin = 0;
		Ncorps.bodies.forEach(function(b){	
			Ecin += 0.5*b.masse*(b.vx*b.vx+b.vy*b.vy);
		});
		return Ecin;

	},
	getEpot : function(){
		var Epot = 0;
		Ncorps.bodies.forEach(function(b){
			Epot -= 0.5*(b.x*b.force.x+b.y*b.force.y); 
		});
		return Epot;


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

		
			Stat.draw();


		},



		evolue : function(){
			if(!Ncorps.stop){
				Ncorps.time += Ncorps.t; 
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
				Ncorps.bodies[end] = {};
				Ncorps.bodies[end].masse = Ncorps.randomMasse;
				Ncorps.bodies[end].x = e.clientX/Ncorps.Lx;
				Ncorps.bodies[end].y = e.clientY/Ncorps.Lx;
				Ncorps.bodies[end].radius = Ncorps.randomRadius;
				Ncorps.bodies[end].force = {x:0,y:0};
				Ncorps.bodies[end].vx = 0;
				Ncorps.bodies[end].vy = 0;
				Ncorps.createTree();
				Ncorps.getForces();
				Ncorps.draw();

				Ncorps.N = Ncorps.bodies.length;
				$('#N').text(Ncorps.N);
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

			$('#N').text(Ncorps.N);

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
			$(window).keypress(function(evt){
				var e = evt || event;
    			var code = e.keyCode || e.which;
				if(code == 32){
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
		//cap 
		x2 = x1+norm*Math.cos(alpha);
		y2 = y1+norm*Math.sin(alpha);
		vec = {x: x2-x1, y :y2-y1};
		vec.x /= Math.sqrt(vec.x*vec.x+vec.y*vec.y); 
		vec.y /= Math.sqrt(vec.x*vec.x+vec.y*vec.y); 

		vecn = {x: y2-y1, y :x2-x1};
		vecn.x /= Math.sqrt(vecn.x*vecn.x+vecn.y*vecn.y); 
		vecn.y /= Math.sqrt(vecn.x*vecn.x+vecn.y*vecn.y); 
		
    var head= 10;   // length of head in pixels
    c.beginPath();
    c.moveTo(x1,y1);
    c.lineTo(x2,y2);
    c.lineTo(x2-head*Math.cos(alpha-Math.PI/6),y2-head*Math.sin(alpha-Math.PI/6));
    c.lineTo(x2-head*Math.cos(alpha+Math.PI/6),y2-head*Math.sin(alpha+Math.PI/6));

    c.lineTo(x2,y2);

    c.fill();
    c.stroke();


};
var Stat = {
	tour : 5000,
	series : {Ecin : [], Epot : []},
	offset : 0.1,

	draw : function(){

		Stat.container = document.getElementById('Stat');
		var w = window.innerWidth/2;
		var h = window.innerHeight; 

		Stat.series.Ecin.push(Ncorps.getEcin());
		Stat.series.Epot.push(Ncorps.getEpot());


		Stat.container.width = w;
		Stat.container.height = h;
		if(Stat.container.getContext){
			Stat.ctxStat = Stat.container.getContext('2d');
			cS = Stat.ctxStat;
			cS.globalAlpha = 0.5;
			
			cS.lineWidth = 3;
			cS.lineJoin='round';
			cS.shadowBlur=5;
			
			cS.clearRect(0,0,w,h);
			
			//Ecin
			cS.shadowColor="#f00"; 
			cS.strokeStyle= "#f00";
			cS.beginPath();
			
			var points = Stat.dataEcinToPoints(w,h);
			cS.moveTo(points[0].x , points[0].y);
			points.forEach(function(p){
				cS.lineTo(p.x, p.y);	
			});
			
			cS.stroke();
			cS.font="20px Arial";
			cS.fillStyle = "#f00";
			Stat.textLine(cS,"Ecin", points[points.length-1].y, w, true);
			
			//Epot
			cS.shadowColor="#ff0"; 
			cS.strokeStyle= "#ff0";
			cS.beginPath();
			
			var points = Stat.dataEpotToPoints(w,h);
			cS.moveTo(points[0].x , points[0].y);
			points.forEach(function(p){
				cS.lineTo(p.x, p.y);	
			});
			
			cS.stroke();
			cS.font="20px Arial";
			cS.fillStyle = "#ff0";
			Stat.textLine(cS,"Epot", points[points.length-1].y, w, true);
			


			Stat.drawMin(cS,h,w);



			//console.log(Ncorps.getEcin());

			
		}
	},
	textLine : function(c,str,h,w, center=false){
		
		c.setLineDash([5, 4]);
		if(center){
			c.fillText(str, 0, h+5);

		}else{
		c.fillText(str, 0, h-5);
		}
		var width = c.measureText(str).width;
		c.beginPath();
		c.moveTo(width+4, h);
		c.lineTo(w, h);
	

		c.stroke();

	},
	drawMin(c,h,w){
		
		c.font="20px Arial";
		c.lineWidth = 1;
		c.lineJoin='round';
		c.fillStyle = "#fff";
		c.shadowBlur=0;
		c.shadowColor="#fff"; 
		c.strokeStyle= "#fff";

		var textMin = Stat.format(Stat.min);
		var hmin = h*(1-Stat.offset);
		var hmax = h*Stat.offset;
		Stat.textLine(c, Stat.format(Stat.min), hmin,w);
		Stat.textLine(c, Stat.format(Stat.max), hmax,w);


	},
	format : function(i){
		var txt = Math.floor(i*100)/100;
		txt += " [J]";
		return txt;
	},
	TimeToX : function(t,w){
		return (w == 0)? 0 : (t%Stat.tour)*w/Stat.tour;
	},
	IndexToX : function(dt,i,w,l){
		var x = 0;
		if(dt*l < Stat.tour){
			x = dt*i/Stat.tour;

		}else{
			x = (dt*i)/(dt*l);

		}

		return (w == 0)? 0 : x*w;
	},
	maxSeries : function(){
		max = [];
		for (var s in Stat.series){
			
			max.push(Math.max(...Stat.series[s]));
		}

		return Math.max(...max);
	},
	minSeries : function(){
		min = [];
		for (var s in Stat.series){
			min.push(Math.min(...Stat.series[s]));
		}
		return Math.min(...min);


	},
	dataEcinToPoints : function(w,h){
		var ret = [];
		Stat.max = Stat.maxSeries();
		Stat.min = Stat.minSeries();
		Stat.max -= Stat.min;
	

		Stat.series.Ecin.forEach(function(s){
			// on place les données entre 0 et 1 
			var norm = (s-Stat.min)/Stat.max;
			// gérer l'affichage 
			var display = h-2*h*Stat.offset;
			var hauteur = h*Stat.offset+display*(1-norm);  

			ret.push({x: Stat.IndexToX(Ncorps.t, ret.length+1, w, Stat.series.Ecin.length), y: hauteur});


		});

		return ret;


	},
	dataEpotToPoints : function(w,h){
		var ret = [];
		Stat.max = Stat.maxSeries();
		Stat.min = Stat.minSeries();
		Stat.max -= Stat.min;


		Stat.series.Epot.forEach(function(s){
			// on place les données entre 0 et 1 
			var norm = (s-Stat.min)/Stat.max;
			// gérer l'affichage 
			var display = h-2*h*Stat.offset;
			var hauteur = h*Stat.offset+display*(1-norm);  

			ret.push({x: Stat.IndexToX(Ncorps.t, ret.length+1, w, Stat.series.Epot.length), y: hauteur});

		});

		return ret;


	},
}


window.onload = function(){
	Ncorps.init();
};