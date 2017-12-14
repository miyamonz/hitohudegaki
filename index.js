const splitArray = (arr,l = 2) => arr.reduce((prev,next,i) => {
  const last = prev[prev.length-1];
  if(last.length < l) last.push(next)
  else prev.push([next])
  return prev
},[[]]);
class PathCommand {
  constructor(command, params) {
    this.command = command;
    this.params  = params;
  }
  toString() {
    return `${this.command}${this.params.join(",")}`
  }
}
class PathMove {
  constructor(path) {
    this.path = path;
    this.snap = Snap(path)
    this.default = path.getAttribute("d");
    this.commands = this.strToCommands(this.default);
    this.absCommands = this.getAbsolute(this.commands);
  }
  commandsToStr(commands) {
    return commands.map( command => command.toString() ).join("")
  }
  update(commands) {
    let str = this.commandsToStr(commands);
    this.path.setAttribute("d",str)
  }

  offset(fn) {
    // fn : point, index -> diff(2vec)
    let moved = this.getAbsolute(this.commands).map( (c,i) => {
      let offsetPoints = c.params.map( point => {
        let offset = fn(point,i)
        let added = [
          point[0] + offset[0],
          point[1] + offset[1],
        ]
        return added
      } )
      return new PathCommand(c.command, offsetPoints);
    } )
    this.update(moved)
  }
  strToCommands(str) {
    let commands = [];
    let pathData = str.split(/([a-zA-Z])/g)
      .filter((e,i,a) => e != "");
    for(let i = 0; i < pathData.length; i += 2) {
      const nums = pathData[i + 1]
        .replace(/(\d)-/g, '$1,-')
        .split(',')
        .map(str => parseFloat(str));
      let points = splitArray(nums,2)
      commands.push(new PathCommand(pathData[i], points) );
    }
    return commands;
  }
  absolute() {
    this.abs = this.getAbsolute(this.commands)
    this.update(this.abs)
  }
  setDefault() {
    this.path.setAttribute("d",this.default)
  }
  linear() {
    this.abs = this.getAbsolute(this.commands)
    let l = this.getLinear(this.abs)
    this.update(l);
  }
  getLinear(commands) {
    let newCommands = [];
    commands.forEach( ({command,params},i) => {
      let newParams = params.map( point => [1000 - i*4,200] )
      newCommands.push( new PathCommand(command, newParams) );
    } )
    return newCommands;
  }
  getAbsolute(commands){
    let newCommands = [];
    let prev = [0,0]
    commands.forEach( (e,i) => {
      if(e.command.match(/^[A-Z]$/)) {
        prev = e.params[0]
        newCommands.push({
          command: e.command,
          params: e.params,
        })
      }else {
        let command = e.command;
        command = command.toUpperCase();
        let params = e.params.map( (point, pi) => {
          if(e.command === "v") point = [0,point[0]]
          if(e.command === "h") point = [point[0],0]
          if(["v","h"].includes(e.command)) command = "L";
          let newPoint = [
            prev[0] + point[0],
            prev[1] + point[1],
          ]
          if(pi === e.params.length-1) prev = newPoint;
          return newPoint;
        } )
        newCommands.push( {command, params} )
      }
    } )
    return newCommands;
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
var pathMove = new PathMove(st0)
// var tsumami = document.querySelector("#tsumami")
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
  console.log(tsumami)
  // pathMove.linear();
  pathMove.snap.animate({d: pathMove.default}, sec * 1000, mina.easeinout)
  let str = `${anime} ${sec}s ease-in-out forwards`;
  console.log(str)
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
function frame(time) {
  let now = new Date();
  time = now - start;

  let sec = time/1000;
  pathMove.offset( (pos, i) => {
    let [x,y] = pos;
    var dx = 2 * simplex.noise2D(now/1000, x/100)
    var dy = 2 * simplex.noise2D(now/1000, y/100)
    if( sec > 2 ) start = new Date();
    let pulse = t => (0 <= t  && t <= 1 ) ? Math.sin(t*Math.PI)*Math.sin(t*Math.PI) : 0;
    let diff = (simplex.noise2D(now/1000,sec)/3+1) * pulse(sec - x/1000);
    return [dx,dy + - diff * 10];
  })
  requestAnimationFrame(frame)
}
frame(0)

