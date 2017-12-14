// [a,b,c,d,e] => [[a,b],[c,d],[e]]
const splitArray = (arr,l = 2) => arr.reduce((prev,next,i) => {
  const last = prev[prev.length-1];
  if(last.length < l) last.push(next)
  else prev.push([next])
  return prev
},[[]]);

class Command {
  constructor(command, params) {
    this.command = command;
    this.params  = params;
  }
  static getFromString(str) {
    let c = str.slice(0,1);
    let nums = str.slice(1).replace(/(\d)-/g, '$1,-').split(",").map(e => parseFloat(e))
    let points = splitArray(nums,2);

    return new Command(c, points)
  }
  toString() {
    return `${this.command}${this.params.join(",")}`
  }
  getAbsolute(_prev) {
    let c = this.command;
    let params = Object.assign([],this.params)
    let prev = Object.assign([],_prev);
    let next = params[params.length-1]
    if(c.match(/[A-Z]/)) { 
      return {command: new Command(c,params), next};
    }

    let newCommand = c.toUpperCase();
    let newParam = params.map( (point,i) => {
      if(c === "v") point = [0,point[0]]
      if(c === "h") point = [point[0],0]
      if(["v","h"].includes(c)) newCommand = "L";
      let newPoint = [
        prev[0] + point[0],
        prev[1] + point[1],
      ]
      return newPoint;
    } )
    next = newParam[newParam.length-1]
    let command = new Command(newCommand, newParam);
    return {command, next}
  }
}
class Path {
  constructor(path) {
    this.path = path;
    this.snap = Snap(path)
    this.default = path.getAttribute("d");
    this.commands = Path.strToCommands(this.default);
  }
  static commandsToStr(commands) {
    return commands.map( command => command.toString() ).join("")
  }
  static strToCommands(str) {
    let splited = str.split(/([a-zA-Z][0-9\,\-\.]+)/g).filter( e => e.match(/^[a-zA-Z]/) )
    return splited.map( str => Command.getFromString(str) )
  }
  update(commands) {
    let str = Path.commandsToStr(commands);
    this.path.setAttribute("d",str)
  }

  offset(fn) {
    // fn : point:2vec, index -> diff(2vec)
    let moved = Path.getAbsolute(this.commands).map( (c,i) => {
      let offsetPoints = c.params.map( point => fn(point,i));
      return new Command(c.command, offsetPoints);
    } )
    this.update(moved)
  }
  absolute() {
    let abs = Path.getAbsolute(this.commands)
    this.update(abs)
  }
  setDefault() {
    this.path.setAttribute("d",this.default)
  }
  linear() {
    let abs = Path.getAbsolute(this.commands)
    let l = Path.getLinear(abs)
    this.update(l);
  }
  static getLinear(commands) {
    let newCommands = [];
    commands.forEach( ({command,params},i) => {
      let newParams = params.map( point => [1000 - i*4,200] )
      newCommands.push( new Command(command, newParams) );
    } )
    return newCommands;
  }
  static getAbsolute(commands){
    let prev = [0,0];
    return commands.map( c => {
      let {command,next} = c.getAbsolute(prev);
      prev = next;
      return command;
    } )
  }
}
var params = location.href
  .split("?")
  .filter( (_,i) => i !== 0  )
  .map( str => str.split("=")  )
  .map( arr => ({[arr[0]]: arr[1]})  )
  .reduce( (obj, e) => Object.assign(obj, e), {} );

var st0 = document.querySelector(".st0");
var st1 = document.querySelector(".st1")
var st2 = document.querySelector(".st2")
var st3 = document.querySelector(".st3")
var st = [st1, st2, st3]
var path = new Path(st0)
let sec = 0;
let wait = 2;
let ids = []
tsumami.oninput  = e => setByou(parseFloat(e.target.value))
tsumami_wait.oninput  = e => setWait(parseFloat(e.target.value))

let setByou = s => sec = byou.innerHTML = s;
let setWait = s => wait = byou_wait.innerHTML = s;

let defaultTime = params.time ? parseFloat(params.time) : 1.5;
let defaultWait = params.wait ? parseFloat(params.wait) : 1.8;

setByou(defaultTime);
setWait(defaultWait);
function reset() {
  st0.style.webkitanimation = st0.style.animation = "";
  st.forEach( (e,i) => e.style.animation = "" );
  ids.forEach( i => clearInterval(i) );
  ids = [];

}
function draw(anime) {
  start = new Date();
  path.linear();
  path.snap.animate({d: path.default}, sec * 1000, mina.easeinout)
  let str = `${anime} ${sec}s ease-in-out forwards`;
  st0.style.webkitanimation = st0.style.animation = str;
  st.forEach( (e,i) => {
    let idx = setTimeout(_ => {
      e.style.webkitanimation = e.style.animation = `fadeIn 1s forwards`;

    }, wait * 1000);
    ids.push(idx);

  } )
}

var simplex = new SimplexNoise(Math.random);
var start = new Date();
const add = ([a0,a1],[b0,b1]) => [a0+b0,a1+b1]
const mult = (num, [a0,a1]) => [num*a0,num*a1]

let pulse = t => (0 <= t  && t <= 1 ) ? (1- Math.cos(2*t*Math.PI))/2 : 0;
function frame() {
  let now = new Date();
  time = now - start;
  let sec = time/1000;

  path.offset( (pos, i) => {
    let [x,y] = pos;
    let dx = 2 * simplex.noise2D(now/1000, x/100)
    let dy = 2 * simplex.noise2D(now/1000, y/100)
    let d  = [dx,dy]
    if( sec > 2 ) start = new Date();
    let noise = simplex.noise2D(now/1000,sec)/3+1;
    let diff =  noise * pulse(sec - x/1000);
    let basePos = add(pos,d);
    return add( basePos, [0,-diff * 10]);
  })
  requestAnimationFrame(frame)
}
frame()

