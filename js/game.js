/*
 * @Author: gaiwa gaiwa@163.com
 * @Date: 2023-08-11 16:47:07
 * @LastEditors: gaiwa gaiwa@163.com
 * @LastEditTime: 2023-08-15 14:34:37
 * @FilePath: \html\work\js\game\js\game.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
const ballsData = [];
const oCon = document.querySelector('.container');
const oGameArea = document.querySelector('.game-area');
const oBallArea = document.querySelector('.ball-area');
const oArrow = document.querySelector('.arrow');
const oBullet = document.querySelector('.bullet');
const oStart = document.querySelector('.btn-start');
const oScore = document.querySelector('.score');
const size = 44;
const maxH = oBallArea.offsetHeight, maxW = oBallArea.offsetWidth, maxRows = ~~(maxH/size), maxColumns = ~~(maxW/size);
let idx = 0;
let bullet  = { color: 'red' };
let score = 0;
let gameCondition = false;


init();
initArrow();
initBullet();
function init(){
  let fragment = document.createDocumentFragment();
  for(let i=0; i<maxRows; i++){
    let c = (i % 2 === 0) ? 0 : 1;
    for(let j=0; j<maxColumns - c; j++){
      let ele = document.createElement('div');
      ele.classList.add('ball');
      let left = size * (j + (i%2)/2);
      let top = (i * (size - (i && 6)));
      let color = randomColor();
      let ball = new Proxy({
        left, top, color, ele, connect: false, idx, row: i
      },{
        set(target, key, value){
          if(key === 'connect' && value === false) {
            dropOff(ballsData[target.idx].ele);
          }
          target[key] = value;
        }
      });
      setStyle(ele,{
        display: 'none',
      });
      fragment.appendChild(ele);
      ballsData.push(ball);
      idx++;
    }
  }
  oBallArea.appendChild(fragment);
}

function initArrow(){
  setStyle(oArrow, {
    left: (oBallArea.offsetWidth / 2) - (oArrow.offsetWidth / 2) + 'px',
    top: (oBallArea.offsetHeight) - (oArrow.offsetHeight /2 + 10) + 'px',
    transformOrigin: '37px 47px',
  });
}

function initBullet(){
  let color = randomColor();
  oBullet.style.cssText = '';
  bullet.color = color;
  setStyle(oBullet,{
    display: 'block',
    backgroundColor: color,
    left: (oBallArea.offsetWidth / 2) - (size/ 2) + 'px',
    top: (oBallArea.offsetHeight) - (size/ 2) + 'px',
    zIndex: 1,
    transformOrigin: `${(size/ 2)}px ${(size/ 2)}px`,
  })
}

function randomColor(){
  const COLORS = ['#fa5a5a','#f0d264','#82c8a0','#7fccde','#6698cb','#cb99c5'];
  return COLORS[~~(Math.random()*COLORS.length)];
}



oGameArea.addEventListener('mousemove',function(e){
  let ex = e.clientX, ey = e.clientY;
  let oy = oArrow.getBoundingClientRect().top;
  let ox = oArrow.getBoundingClientRect().left;
  ox += oArrow.offsetHeight / 2;
  oy += oArrow.offsetHeight / 2 + 10 + oBullet.offsetHeight / 2;
  let iAngle = Math.abs(Math.atan2(ey - oy, ex - ox) * 180 / Math.PI);
  iAngle = Math.min(170, Math.max(10, iAngle));
  iAngle = -iAngle * Math.PI / 180;
  iAngle += Math.PI / 2;
  oArrow.style.transform = `rotate(${iAngle * 180 / Math.PI}deg)`;
  oBullet.style.transform = `rotate(${iAngle * 180 / Math.PI}deg)`;
},false);

oBallArea.addEventListener('mousedown',function(){
  if(!gameCondition){
    return false;
  }
  let iAngle = Number(oArrow.style.transform.match(/rotate\((.+)deg\)/)?.[1]);
  let timer, speed = 18;
  let _speedX = speed;
  clearInterval(timer);
  timer = setInterval( () => {
    let x = oBullet.offsetLeft, y = oBullet.offsetTop;
    if(x< 0 || x>(oBallArea.offsetWidth - size)){
      _speedX *= -1;
    }
    let collisionBalls = collisionBall({x,y});
    if (collisionBalls?.length > 0){
      let collisionIdx = getShortDistance(collisionBalls);
      let targetIdx = getFreeSpace(collisionIdx, x, y);
      if (targetIdx.length === 0){
        alert(`游戏结束!你的得分为${score}`);
        clearInterval(timer);
        oStart.classList.remove('active');
        ballsData.forEach(item=>item.ele.style.cssText = `display: none`);
        initArrow();
        initBullet();
        score = 0;
        oScore.innerText = score;
        return false;
      }
      hitTarget(targetIdx);
      oScore.innerText = score;
      clearInterval(timer);
      return false;
    }
    x+= _speedX * Math.cos((iAngle - 90) * Math.PI / 180);
    y+= speed * Math.sin((iAngle - 90) * Math.PI / 180);
    oBullet.style.left = x + 'px';
    oBullet.style.top = y + 'px';
  },1000/60);
},false);

oStart.addEventListener('click',function(e){
  init();
  e.target.classList.add('active');
  gameCondition = e.target.className.includes('active');
  if(!gameCondition){
    return false;
  }
},false);

function findSiblings(idx = 0) {
  let { tens, units } = getDigit(idx);
  return getRightSlot(idx, {
    tl: (tens - 1) * 10 + (units - 0),
    tr: (tens - 1) * 10 + (units + 1),
    ml: (tens - 0) * 10 + (units - 1), 
    mr: (tens - 0) * 10 + (units + 1), 
    bl: (tens + 1) * 10 + (units - 1), 
    br: (tens + 1) * 10 + (units - 0)
  });
}

function isRightSlot(sRow, row, padNum){
  return (row+padNum)===sRow;
}

function getRightSlot(idx = 0,{tl, tr, ml, mr, bl, br} = {}){
  const diffRow = {
    t: -1,
    m: 0,
    b: 1
  }
  let row = ballsData[idx].row;
  return Object.entries({tl, tr, ml, mr, bl, br}).reduce((acc,[key,value])=>{
    acc[key] = (ballsData[value] && isRightSlot(ballsData[value].row, row, diffRow[key[0]]))? value : null;
    return acc;
  },{})
}

function getDigit(num){
  return {
    tens: ~~(num/10),
    units: ~~(num%10)
  }
}

function getSameTypeSiblings(idx, color = false){
  return Object.entries(findSiblings(idx)).map(([key,value]) => value).filter(item =>{
    if (!ballsData[item]){
      return false;
    }
    let flag = (ballsData[item].connect === true);
    if(color && ballsData[idx].ele.style.display!== 'none'){
      return ballsData[item].color === ballsData[idx].color;
    }
    return flag;
  });
}

function findSeriesNode(sameColorSiblings = [],color){
  let collectArr = sameColorSiblings.slice();
  recu(collectArr);
  function recu(arr){
    for(let i = 0; i<arr.length; i++){
      let siblings = getSameTypeSiblings(arr[i], color);
      siblings = siblings.filter(item => {
        return (collectArr.indexOf(item) === -1) && (ballsData[item].ele.style.display === 'block');
      });
      collectArr = collectArr.concat(siblings);
      if(siblings.length>0){
        recu(siblings);
      }
    }
  }
  return collectArr;
}

function traceConnect(){
  let loseConnenctBalls = [];
  for(let i = 0, len = ballsData.length; i<len; i++){
    if(ballsData[i].connect === true){
      let tempArr = findSeriesNode([i], false);
      let result =  tempArr.some(item => item <10);
      if (!result){
        loseConnenctBalls.push(i);
      }
    }
  }
  return loseConnenctBalls;
}

function animate({ele,styleJson = {},time = 300, speed = 'linear', callback} = {}){
  ele.style.transition = `${time}ms ${speed}`;
  setStyle(ele, styleJson);
  ele.addEventListener('transitionend', end, false);
  function end(){
    callback && callback();
    ele.removeEventListener('transitionend', end);
    ele.style.transition = '';
  }
}

function dropOff(ele){
  animate({
    ele,
    styleJson: {
      top: ele.offsetTop + 40 + 'px',
      opacity: 0,
      transform: 'scale(.5)'
    },
    callback(){
      ele.style.cssText = '';
      setStyle(ele,{
        display: 'none'
      })
    }
  });
}

function collisionBall({x=0,y=0} = {}){
  let balls = ballsData.filter(item => item.connect);
  balls = getCollisionsDistance(balls, x, y);
  if(balls.length === 0 && y < size / 2){
    let topBall = ballsData.slice(0,10).reduce((acc,curr)=>{
      if(Math.abs(acc.left - x) >= Math.abs(curr.left - x)){
        acc = curr;
      }
      return acc;
    });
    balls[0] = {
      idx: topBall.idx,
      distance: 0
    }
  }
  return balls;
}

function getCollisionsDistance(balls, x, y){
  return balls.map(item=>{
    let _x = item.left - x;
    let _y = item.top - y;
    let distance = Math.sqrt(_x * _x + _y * _y);
    if(distance < size){
      return {
        idx: item.idx,
        distance
      }
    }
    return null;
  }).filter(item=>item!==null)
}

function getShortDistance(arr= []){
  if(arr.length === 0){
    return arr;
  }
  if(arr.length ===1){
    return arr[0].idx;
  }
  return arr.reduce((acc,curr)=>{
    if(acc.distance >= curr.distance){
      acc = curr;
    }
    return acc;
  }).idx;
}

function getFreeSpace(idx, x, y){
  if(ballsData[idx].connect === false){
    return idx;
  }
  let balls = Object.entries(findSiblings(idx)).map(([key, value])=>value).filter(item=>{
    return ballsData[item]?.connect === false;
  }).map(item=>ballsData[item]);
  return getShortDistance(getCollisionsDistance(balls, x, y));
}

function hitTarget(idx){
  let target = ballsData[idx];
  placeBall(target,bullet.color);
  let colorBalls = findSeriesNode([idx], true);
  if(colorBalls.length >= 3){
    colorBalls.forEach(item=>{
      score++;
      ballsData[item].connect = false;
    });
    traceConnect().forEach(item=>{
      score++;
      ballsData[item].connect = false;
    });
  }
  initBullet();
}

function placeBall(ball, color=''){
  ball.connect = true;
  ball.color = color || randomColor();
  ball.ele.style.cssText = '';
  setStyle(ball.ele, {
    display: 'block',
    top: ball.top + 'px',
    left: ball.left + 'px',
    backgroundColor: ball.color
  });
}