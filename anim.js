////////////////////////////////////////// FUNCTIONS://////////////////////////////////////////
////////////////////////////////////////// JS FUNCTIONS by Ciarán O'Kelly://////////////////////////////////////////
//return reference to object:
function $(stringref,debug){ 
    stringref=stringref.replace(/parent/gi, "parentpatcher");
    var path=stringref.split('.');
    var obj=this.patcher;
    for(i in path){
        if(path[i]=='parentpatcher'){ //up 1 level:
			if(debug)print("up to patcher:"+obj.name);
            obj=obj.parentpatcher;
        }else{
            obj=obj.getnamed(path[i]);
			if(debug)print("found:"+obj.varname);
            if(i!=path.length-1){ //down 1 level:
                obj=obj.subpatcher();
				if(debug)print("in to patcher:"+obj.name);
            }
        }
    }
    return(obj)
}


//search through all max objects and return reference:
function _$(id){
    tempobj=0;
    tempname=id;
    this.patcher.applydeepif (_$act,_$scan);
    delete tempname;
    return(tempobj);
}
function _$act(obj){
    tempobj=obj;
}
function _$scan(obj){
    if(obj.varname==tempname){
        return(true);
    }else{
        return(false);
    }
}

//Frequency to Midi conversion in JS:
function ftom(freq) {
	note=69+12*Math.log(freq/440)/Math.log(2)
	return((note<=0 || note>127) ? false : note);
}


//returns true is number is even
function isEven(someNumber){
    return ((Number(someNumber)%2 == 0) ? true : false);
};
//extract max/min from array:
function maxArray(ar){
    return Math.max.apply( Math, ar );
};
function minArray(ar){
    return Math.min.apply( Math, ar );
};


//easier printing:
function print(msg){
    post(msg+"\n");
}
function trace(msg){
	print(msg);
}
function traceObj(obj){
	var str
	for (key in obj) { //trace a 1d object:          
          str += '   [' + key + ']: '+obj[key],  + "\n"
   }
print(str)
}
//calculate a HSB colour from hertz frequency:
function hertz2hsb(hertz){
	var i=20.6
	var incrementRatio=1.001922
	var hsb=[242,0,0]
	var counter=0;
	while((i*incrementRatio)<hertz){ //increase colour until we hit desired hertz:
		if(hsb[0]==360){//HUE:
			hsb[0]=0
		}else{
			//trace(i)
			hsb[0]++
			hsb[1]+=0.0542 //sat/brightness
		}
		i=i*incrementRatio
	}
	//convert saturation/brightness to usable values:
	//up until now they have been one value 0-200
	hsb[1]=hsb[2]=(hsb[1]<200 ? Math.round(hsb[1]) : 200)
	if(hsb[1]>100){
		hsb[2]=100
		hsb[1]=100-(hsb[1]-100)
	}
	return(hsb)
}
function hsb2rgb(hsb) {
	var red, grn, blu, i, f, p, q, t;
	hsb[0]%=360;
	if(hsb[2]==0) {return(new Array(0,0,0));}
	hsb[1]/=100;
	hsb[2]/=100;
	hsb[0]/=60;
	i = Math.floor(hsb[0]);
	f = hsb[0]-i;
	p = hsb[2]*(1-hsb[1]);
	q = hsb[2]*(1-(hsb[1]*f));
	t = hsb[2]*(1-(hsb[1]*(1-f)));
	if (i==0) {red=hsb[2]; grn=t; blu=p;}
	else if (i==1) {red=q; grn=hsb[2]; blu=p;}
	else if (i==2) {red=p; grn=hsb[2]; blu=t;}
	else if (i==3) {red=p; grn=q; blu=hsb[2];}
	else if (i==4) {red=t; grn=p; blu=hsb[2];}
	else if (i==5) {red=hsb[2]; grn=p; blu=q;}
	red = Math.floor(red*255);
	grn = Math.floor(grn*255);
	blu = Math.floor(blu*255);
	return (new Array(red,grn,blu));
}
//convert Midi Note to hertz frequency:
function mtof(notenum){
	var hertz=440 * Math.pow(2,(notenum-69)/12)
	return(hertz)
}
//trace(mtof(69))

//Frequency to Midi conversion:
function ftom(freq) {
	var note=69+12*Math.log(freq/440)/Math.log(2)
	return((note<=0 || note>127) ? 0 : note);
}

//notenum to Y position conversion. Use relativeNotenum parameter to offset result relative to other notes
function mtoy(notenum,resY,relativeNotenum){
	var offsetBottom=0.1
	if(relativeNotenum) notenum=notenum-relativeNotenum
	var perc=(127-notenum)/127 //invert
	return((resY-offsetBottom)*perc)
}


////////////////////////////////////////// ANIMATE://////////////////////////////////////////

//SETTINGS:
var ctx = "VA";				//name of ctx instance
var startX = 1;					//starting position of discs
var totaldiscs = 250			//resolution or number of discs
var Ztilt = -0.2				//Z axis depth discs should animate towards
var scenebounds = [15,7,10]		//edge of screen
var scaleY = 7

//SETUP:
var discs = new Array();
var available = new Array(); // indexes of all unused discs

// for the anim.drive rotateto message
var e2q = new JitterObject("jit.euler2quat");

// create all our discs first:
for(var i=0; i<totaldiscs; i++) {
	
	// initialize the disc:
	discs.push({
		'id':		i,
		'shape':	new JitterObject("jit.gl.gridshape", ctx),
		'node':		new JitterObject("jit.anim.node"),
		'drive':	new JitterObject("jit.anim.drive")
	})
	var d = discs[i]
	d.shape.shape = 'circle';
	d.shape.anim = discs[i].node.name;
	d.node.movemode = "local";
	d.drive.targetname = d.node.name;
	d.node.position=[ scenebounds[0], 0, 0 ];
	
	//make it available for use by goDisc:
	available.push(i);
}

function anything() {
	var a = arrayfromargs(messagename, arguments);
   //print("JS:received from inlet "+inlet+":" + a);
    switch(messagename){
		
		// every frame
		case 'bang':
			for(var i=0; i<totaldiscs; i++) { //check if agent is out of bounds:
				var d = discs[i]
				var pos = d.node.position;
				if( Math.abs(pos[0])>scenebounds[0] || Math.abs(pos[1])>scenebounds[1] || Math.abs(pos[2])>scenebounds[2] ) {
					d.drive.move(0,0,0); //stop animation
					available.push(i)
				}
			}
			// do turn function
			//turn();
		break;
		
		//takes in midi note and velocity and triggers a disc to move
		case 'goDisc':
			//CALCULATE PROPERTIES:
			var rgb = hsb2rgb(hertz2hsb(mtof(a[1])));
			for(var i=0; i<rgb.length;i++){
                rgb[i] /= 255
            }
			var size = a[2]/127;
			var posY = a[1]/127*(scaleY*2) - scaleY
			
			//APPLY PROPERTIES:
			var d = discs[available.shift()] //remove first index from available[]
			d.node.position=[ startX, posY, 0 ];
			d.drive.move(-0.5, 0, Ztilt);
			d.shape.color= [rgb[0],rgb[1],rgb[2], 0.5];
			d.node.scale=[size,size,2];


			
		break;
		
	}
	
	gc() //garbage collect
}

function turn() { //obselete:
	for(var ad in adrives) {
		// randomly turn some agents
		if(Math.random() > 0.8) {
			e2q.euler = [Math.random()*360,Math.random()*360,Math.random()*360];
			var rtoargs = e2q.quat;
			rtoargs[4] = Math.random()+0.5;
			adrives[ad].rotateto(rtoargs);
		}
	}
}

function initagent(gshape, anode, adrive) {
	
		
	// create random orientation and move:
	//gshape.rotatexyz = [Math.random()*360,Math.random()*360,Math.random()*360];
	//adrive.move(-Math.random(), 0, -0.1);	
}
initagent.local=1;

function reset() {
	for(i=0; i<totaldiscs; i++) {
		initagent(gshapes[i], adrives[i]);
	}
}
