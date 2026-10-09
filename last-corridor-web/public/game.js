(()=>{'use strict';
const $=id=>document.getElementById(id);
const cv=$('scene'), ctx=cv.getContext('2d',{alpha:false}), mini=$('mapCanvas'),mx=mini.getContext('2d');
let socket=null,joined=false,gameStarted=false,state=null,myId='',roomCode='',camera=0,lastFrame=0,lastMove=0;
let move={x:0,y:0},keys=new Set(),joy={x:0,y:0},autoSprint=false,flash=true,sound=false,audio=null;
let activePuzzle=null;let toastTimer=0,unread=0,chatOpen=false,mapOpen=false,lastFoot=0,lastBeep=0,lastAmbient=0;
let screenW=0,screenH=0,renderW=0,renderH=0,renderCanvas=document.createElement('canvas'),renderCtx=renderCanvas.getContext('2d',{alpha:false});
let renderView={x:1.65,y:1.5,angle:0},lastServerPos=0, explored=new Set(),nextFog=0,lastPlayerToast='',mute=false;
const devices={touch:matchMedia('(pointer:coarse)').matches};
function show(which){for(let id of ['menu','lobby','game','endScreen'])$(id).classList.toggle('hidden',id!==which);}
function notify(message,duration=3500){$('toast').textContent=message;$('toast').classList.remove('hidden');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.add('hidden'),duration);}
function err(message){$('connectionLabel').textContent=message;notify(message,4300);$('createBtn').disabled=false;$('joinConfirm').disabled=false;}
function wsSend(o){if(socket&&socket.readyState===1)socket.send(JSON.stringify(o));}
function roomConnect(mode){let name=$('playerName').value.trim()||'ناجٍ';let code=$('roomInput').value.trim().toUpperCase();if(mode==='join'&&!/^[A-F0-9]{6}$/.test(code)){err('أدخل رمزًا صحيحًا من 6 أحرف وأرقام.');return;}
  if(socket){try{socket.close();}catch{}}
  $('connectionLabel').textContent='جاري الاتصال بالخادم الآمن...';$('createBtn').disabled=true;$('joinConfirm').disabled=true;
  let addr=(location.protocol==='https:'?'wss://':'ws://')+location.host+'/ws';
  try{socket=new WebSocket(addr);}catch(e){err('تعذر الاتصال. تأكد من اتصال الإنترنت.');return;}
  let connected=false;
  socket.onopen=()=>{connected=true;wsSend(mode==='create'?{type:'create',name}:{type:'join',name,code});};
  socket.onmessage=e=>{let m;try{m=JSON.parse(e.data);}catch{return;}receive(m);};
  socket.onerror=()=>{if(!connected)err('تعذر الوصول إلى الخادم. جرّب مرة أخرى.');};
  socket.onclose=()=>{if(gameStarted){notify('انقطع الاتصال بالخادم. يجب إعادة فتح الغرفة.',8000);stopInput();}else if(joined){notify('انقطع الاتصال بالغرفة.',7000);}else $('connectionLabel').textContent='انقطع الاتصال.';};
}
function receive(m){
 if(m.type==='error'){err(m.message);return;}
 if(m.type==='joined'){joined=true;myId=m.id;roomCode=m.room;state=null;gameStarted=false;camera=0;explored.clear();$('roomCode').textContent=m.room;$('roomTag').textContent='غرفة '+m.room;show('lobby');$('connectionLabel').textContent='';$('createBtn').disabled=false;$('joinConfirm').disabled=false;return;}
 if(m.type==='state'){const was=state?.status;state=m;let me=mine();if(me){if(!lastServerPos||!gameStarted||Math.hypot(renderView.x-me.x,renderView.y-me.y)>1.8){renderView.x=me.x;renderView.y=me.y;}lastServerPos=Date.now();}
 if(m.status==='playing'&&!gameStarted){gameStarted=true;show('game');resize();camera=me?.angle||0;enableSound();notify('المطاردة بدأت... ابقَ قريبًا من صديقك!',5000);}
 if(m.status==='abandoned'){finish(false,'غادر شريكك الغرفة. لا يمكنك إكمال الهروب وحيدًا.');return;}
 updateHUD();return;}
 if(m.type==='puzzle'){showPuzzle(m);return;}
 if(m.type==='puzzle-result'){if(m.correct){closePuzzle();}else notify('إجابة خاطئة، حاول مرة أخرى!',2200);return;}
 if(m.type==='notice'){notify(m.message,4900);if(/الوحش|سقط|أنعش|انطفأ|بدأت/.test(m.message))terrorBeep();return;}
 if(m.type==='chat'){appendChat(m);if(!chatOpen&&m.from!==myId){unread++;$('unread').textContent=unread;$('unread').classList.remove('hidden');}if(sound)chirp();return;}
 if(m.type==='end'){finish(!!m.win,m.message);return;}
}
function mine(){return state?.players?.find(p=>p.id===myId);}function partner(){return state?.players?.find(p=>p.id!==myId);}
function showPuzzle(m){activePuzzle=m.id;$('puzzleTitle').textContent=m.title;$('puzzleQuestion').textContent=m.question;let ch=$('puzzleChoices');ch.replaceChildren();m.choices.forEach((choice,index)=>{let b=document.createElement('button');b.textContent=choice;b.addEventListener('click',()=>{wsSend({type:'answer',id:m.id,choice:index});});ch.append(b);});$('puzzleOverlay').classList.remove('hidden');}
function closePuzzle(){activePuzzle=null;$('puzzleOverlay').classList.add('hidden');}
function finish(win,message){closePuzzle();gameStarted=false;stopInput();$('endSymbol').textContent=win?'✧':'☠';$('endTitle').textContent=win?'نجوتما من الظلام!':'لقد ابتلعكما الظلام';$('endDesc').textContent=message||'';show('endScreen');}
function leave(){closePuzzle();if(socket){socket.close();socket=null;}joined=false;gameStarted=false;state=null;myId='';show('menu');$('connectionLabel').textContent='';}
function sendChat(e){e?.preventDefault();const input=$('chatInput');let t=input.value.trim();if(t){wsSend({type:'chat',text:t});input.value='';input.focus();}}
function appendChat(m){const log=$('chatLog'), line=document.createElement('div');line.className='chat-line'+(m.from===myId?' mine':'');const who=document.createElement('strong');who.textContent=m.name;const text=document.createElement('span');text.textContent=m.text;line.append(who,text);log.append(line);while(log.children.length>70)log.firstChild.remove();log.scrollTop=log.scrollHeight;}
function toggleChat(value){chatOpen=value??!chatOpen;$('chatPanel').classList.toggle('hidden',!chatOpen);if(chatOpen){unread=0;$('unread').classList.add('hidden');$('chatInput').focus();}else $('chatInput').blur();}
function updateHUD(){if(!state||!gameStarted)return;const mins=Math.floor(state.time/60),secs=Math.floor(state.time%60);$('timer').textContent=String(mins).padStart(2,'0')+':'+String(secs).padStart(2,'0');$('timer').classList.toggle('danger',state.time<=120);$('timeFill').style.width=(Math.min(1,state.time/1200)*100)+'%';
 $('sigilCount').textContent='الأختام '+state.sigils+'/٣';$('powerCount').textContent='المولّدات '+state.generators+'/٢';
 $('objectiveText').textContent=state.gate?'اهربا معًا إلى البوابة المضيئة!':state.sigils<3?'اعثرا على الأختام الثلاثة في أرجاء المصحّة.':'شغّلا مولّدَي الطاقة خلال ٣٠ ثانية من بعضهما.';
 let players=$('playersPanel');players.replaceChildren();for(const p of state.players){const elem=document.createElement('div');elem.className='player-row';const a=document.createElement('b');a.textContent=(p.id===myId?'أنت — ':'')+p.name;const b=document.createElement('span');b.textContent=p.dead?'فُقد':p.down?'مصاب!':'على قيد الحياة';b.className=p.dead?'dead':p.down?'down':'';elem.append(a,b);players.append(elem);}
 const m=mine();$('downOverlay').classList.toggle('hidden',!m?.down);const b=partner();$('reviveBar').classList.toggle('hidden',!(m?.reviveProgress>0));if(m)$('reviveFill').style.width=(m.reviveProgress*100)+'%';
 let nearby=nearItem(m);$('hint').classList.toggle('hidden',!nearby||!!m?.down);if(nearby)$('hint').textContent=nearby.description;
}
function nearItem(p){if(!p||!state)return null;const buddy=partner();if(buddy?.down&&!buddy.dead&&Math.hypot(buddy.x-p.x,buddy.y-p.y)<1.75)return {description:'✚ إنعاش '+buddy.name+' (٣ ثوانٍ)'};
 const item=state.items?.find(i=>!i.taken&&!i.active&&Math.hypot(i.x-p.x,i.y-p.y)<1.7);if(item)return {description:item.type==='sigil'?'✦ التقط '+item.title:'⚡ شغّل '+item.title};
 if(Math.hypot(state.exit.x-p.x,state.exit.y-p.y)<1.8)return {description:state.gate?'اهرب مع شريكك عبر البوابة':'البوابة مُغلقة — أكمل الألغاز'};
 return null;}
function interact(){if(!gameStarted||mine()?.down)return;wsSend({type:'interact'});if(sound)chirp();}
// Visual rendering — software raycaster, scalable and GPU-free for budget Android devices.
function resize(){const rect=cv.getBoundingClientRect();screenW=Math.max(2,Math.floor(rect.width));screenH=Math.max(2,Math.floor(rect.height));const pr=Math.min(devicePixelRatio||1,1.5);cv.width=Math.floor(screenW*pr);cv.height=Math.floor(screenH*pr);renderW=Math.max(240,Math.floor(screenW*.66));renderH=Math.max(150,Math.floor(screenH*.66));renderCanvas.width=renderW;renderCanvas.height=renderH;renderCtx.imageSmoothingEnabled=true;}
addEventListener('resize',resize);setTimeout(resize,100);
const clamp=(a,lo,hi)=>Math.max(lo,Math.min(hi,a)),TAU=Math.PI*2;
function lineSight(x1,y1,x2,y2,cells){const d=Math.hypot(x2-x1,y2-y1);for(let i=.25;i<d;i+=.17){let t=i/d,x=x1+(x2-x1)*t,y=y1+(y2-y1)*t;if(cells[Math.floor(y)]?.[Math.floor(x)]!==0)return false;}return true;}
function drawScene(ts){if(!state||!mine())return;const me=mine();const cells=state.map;const sw=renderW,sh=renderH,horizon=sh*.49;const C=renderCtx;const dt=Math.min(.09,(ts-lastFrame)/1000||.016);const elapsed=ts*.001;
 const smooth=.28;renderView.x+=(me.x-renderView.x)*smooth;renderView.y+=(me.y-renderView.y)*smooth;
 // Painted ceiling, dark tile floor, fog and a flickering cone from the torch.
 let cgrad=C.createLinearGradient(0,0,0,horizon);cgrad.addColorStop(0,'#0b1113');cgrad.addColorStop(.75,'#192021');cgrad.addColorStop(1,'#111919');C.fillStyle=cgrad;C.fillRect(0,0,sw,horizon);
 let fgrad=C.createLinearGradient(0,horizon,0,sh);fgrad.addColorStop(0,'#242625');fgrad.addColorStop(.38,'#171918');fgrad.addColorStop(1,'#060808');C.fillStyle=fgrad;C.fillRect(0,horizon,sw,sh);
 let bob=(Math.sin(elapsed*8)*.7)*(Math.hypot(move.x,move.y)>.15?1:0);
 const dirX=Math.cos(camera),dirY=Math.sin(camera),planeX=-dirY*.66,planeY=dirX*.66;
 let depth=new Float32Array(sw);const colSize=2;
 for(let x=0;x<sw;x+=colSize){const rX=dirX+planeX*(2*x/sw-1),rY=dirY+planeY*(2*x/sw-1);let mapX=Math.floor(renderView.x),mapY=Math.floor(renderView.y);let ddX=Math.abs(1/(rX||.00001)),ddY=Math.abs(1/(rY||.00001)),sx=rX<0?-1:1,sy=rY<0?-1:1;let sideX=(rX<0?renderView.x-mapX:mapX+1-renderView.x)*ddX;let sideY=(rY<0?renderView.y-mapY:mapY+1-renderView.y)*ddY;let side=0,found=false;
 for(let z=0;z<40;z++){if(sideX<sideY){sideX+=ddX;mapX+=sx;side=0;}else{sideY+=ddY;mapY+=sy;side=1;}if(!cells[mapY]||cells[mapY][mapX]!==0){found=true;break;}}
 const dist=found?Math.max(.05,side===0?sideX-ddX:sideY-ddY):34;for(let zz=x;zz<x+colSize&&zz<sw;zz++)depth[zz]=dist;
 const wallH=sh/(dist*.74),top=Math.floor(horizon-wallH*.56+bob),bottom=Math.ceil(top+wallH*1.13);
 if(found){const hitCoord=side===0?renderView.y+dist*rY:renderView.x+dist*rX;const texture=(hitCoord-Math.floor(hitCoord));let mortar=texture<.025||texture>.976;let hue=(Math.sin(mapX*19.4+mapY*11.7)*.5+.5);let br=Math.floor(clamp((flash?.93:.26)*(1/(1+dist*.087))*(side===1?.72:1)*(mortar?.53:1)*(hue*.19+.85),.06,1)*100);
 let mat=((mapX*29+mapY*13)&7);let r=mat===0?br*.92:br*.62,g=mat===0?br*.77:br*.76,b=mat===0?br*.68:br*.72;
 const centerDist=Math.abs(x-sw*.5)/(sw*.5);const flashlight=flash?Math.max(.2,1-centerDist*centerDist*.82):.32;r*=flashlight;g*=flashlight;b*=flashlight;
 C.fillStyle=`rgb(${r|0},${g|0},${b|0})`;C.fillRect(x,top,colSize+1,bottom-top);
 // Stained horizontal concrete panels and vertical rust channels.
 if(wallH>9){const tile=wallH/3;C.fillStyle=`rgba(0,0,0,${.10+Math.min(.21,dist*.004)})`;for(let j=1;j<3;j++){let row=top+tile*j;C.fillRect(x,row,colSize+1,Math.max(1,Math.min(2,wallH*.008)));}if(texture>.49&&texture<.515){C.fillStyle='#0b1515';C.fillRect(x,top,colSize,bottom-top);}
 if((mapX*3+mapY*7)%9===0&&texture>.3&&texture<.36){C.fillStyle='rgba(56,20,16,.48)';C.fillRect(x,top+wallH*.23,colSize+1,Math.min(wallH*.53,sh));}}
 // Top trim and black base moulding.
 C.fillStyle=`rgba(3,5,6,${clamp(.85-dist*.02,.15,.9)})`;C.fillRect(x,top,colSize+1,Math.max(1,wallH*.07));C.fillRect(x,bottom-wallH*.1,colSize+1,Math.max(1,wallH*.10));
 }
 // Tiled floor vanishing lines, screen-space perspective.
 for(let k=1;k<=6;k++){let fy=horizon+sh/(k*.8+2);let shade=clamp(.24-k*.032,.02,.2);C.fillStyle=`rgba(147,161,156,${shade})`;C.fillRect(x,fy,colSize,1);}
 }
 // Doors, interactable items, teammates and lurking monster billboards.
 const sprites=[];
 const exit=state.exit;if(exit){sprites.push({x:exit.x,y:exit.y,kind:'exit',locked:!state.gate});}
 for(const i of state.items||[]){if(i.taken||i.active)continue;sprites.push({x:i.x,y:i.y,kind:i.type==='sigil'?'sigil':'power',id:i.id});}
 for(const p of state.players||[]){if(p.id!==myId)sprites.push({x:p.x,y:p.y,kind:p.down?'down':'buddy',name:p.name});}
 if(state.monster)sprites.push({x:state.monster.x,y:state.monster.y,kind:'monster'});
 sprites.sort((a,b)=>Math.hypot(b.x-renderView.x,b.y-renderView.y)-Math.hypot(a.x-renderView.x,a.y-renderView.y));
 for(let sprite of sprites){let ox=sprite.x-renderView.x,oy=sprite.y-renderView.y,inv=1/(planeX*dirY-dirX*planeY);let transformX=inv*(dirY*ox-dirX*oy),transformY=inv*(-planeY*ox+planeX*oy);if(transformY<.3||transformY>24)continue;
 let projX=Math.floor((sw/2)*(1+transformX/transformY));if(projX< -sw||projX>2*sw)continue;
 const scale=sprite.kind==='monster'?1.2:sprite.kind==='buddy'||sprite.kind==='down'?.9:.66;const height=sh/(transformY*.72)*scale, width=height*(sprite.kind==='monster'?.59:.54);
 let startX=projX-width/2,endX=projX+width/2,cy=horizon+height*.06+bob, top=cy-height*.67,bottom=cy+height*.42;
 let visible=depth[clamp(projX|0,0,sw-1)]>transformY-.3;if(!visible)continue;
 const fade=clamp(1-transformY/23,.07,1);C.save();C.globalAlpha=fade;
 if(sprite.kind==='sigil'){C.shadowBlur=22;C.shadowColor='#eeaf79';C.strokeStyle='#eed0a0';C.lineWidth=Math.max(1,height*.034);C.translate(projX,cy-height*.08+Math.sin(elapsed*2+sprite.x)*height*.05);C.rotate(elapsed*.5);C.beginPath();for(let k=0;k<6;k++){const a=TAU*k/6-Math.PI/2,R=height*.22;const xx=Math.cos(a)*R,yy=Math.sin(a)*R;k?C.lineTo(xx,yy):C.moveTo(xx,yy);}C.closePath();C.stroke();C.beginPath();C.arc(0,0,height*.095,0,TAU);C.stroke();}
 else if(sprite.kind==='power'){C.shadowBlur=19;C.shadowColor='#6dcfbd';C.fillStyle='#0a1c1d';C.fillRect(projX-width*.38,top+height*.29,width*.76,height*.54);C.strokeStyle='#629f93';C.lineWidth=Math.max(1,height*.032);C.strokeRect(projX-width*.38,top+height*.29,width*.76,height*.54);C.fillStyle='#8adbd1';C.fillRect(projX-width*.23,top+height*.41,width*.46,height*.07);C.fillStyle='#d9cdb6';C.fillRect(projX-width*.09,top+height*.55,width*.18,height*.06);}
 else if(sprite.kind==='exit'){C.shadowBlur=25;C.shadowColor=sprite.locked?'#bf4940':'#9edcd1';C.fillStyle=sprite.locked?'#491c1a':'#276e66';C.fillRect(projX-width*.5,top,width,height*1.23);C.strokeStyle=sprite.locked?'#cd5850':'#b3e6d9';C.lineWidth=Math.max(2,height*.065);C.strokeRect(projX-width*.44,top+height*.06,width*.88,height*1.1);C.fillStyle=sprite.locked?'#e96c54':'#c8fff5';C.font=`${Math.max(7,height*.13)}px Tahoma`;C.textAlign='center';C.fillText(sprite.locked?'مغلق':'خروج',projX,top+height*.33);}
 else{const mon=sprite.kind==='monster',down=sprite.kind==='down';const w=width,h=height;C.shadowBlur=mon?Math.min(32,h*.18):7;C.shadowColor=mon?'#b5000e':'#2b6d5c';C.fillStyle=mon?'#171010':down?'#342923':'#313d3c';
 // Human silhouettes assembled from arms, torso and a head. Creature: long arms, jagged body, crimson eyes.
 C.beginPath();C.ellipse(projX,top+h*.21,w*(mon?.29:.27),h*.18,0,0,TAU);C.fill();C.beginPath();C.moveTo(projX-w*.27,top+h*.4);C.lineTo(projX+w*.28,top+h*.4);C.lineTo(projX+w*(mon?.35:.3),bottom);C.lineTo(projX-w*(mon?.37:.3),bottom);C.closePath();C.fill();
 C.lineWidth=Math.max(3,w*.19);C.lineCap='round';C.strokeStyle=mon?'#15100f':'#303633';C.beginPath();C.moveTo(projX-w*.23,top+h*.47);C.lineTo(projX-w*(mon?.52:.36),top+h*.93);C.moveTo(projX+w*.23,top+h*.47);C.lineTo(projX+w*(mon?.54:.36),top+h*.92);C.stroke();
 C.fillStyle=mon?'#f23439':down?'#ffa87d':'#bbd4bf';C.shadowColor=mon?'#ff0000':'#dddab2';C.shadowBlur=mon?Math.min(23,h*.1):4;C.fillRect(projX-w*.19,top+h*.18,w*.12,Math.max(2,h*.029));C.fillRect(projX+w*.08,top+h*.18,w*.12,Math.max(2,h*.029));if(mon){C.fillStyle='#59090c';C.fillRect(projX-w*.16,top+h*.295,w*.34,h*.02);}
 if(!mon&&sprite.name&&h>45){C.shadowBlur=0;C.fillStyle='#dfdbcf';C.font=`${Math.min(13,h*.12)}px Tahoma`;C.textAlign='center';C.fillText(sprite.name,projX,top-12);}
 }
 C.restore();}
 // Crackling fluorescent tube lighting and rain-like mist.
 C.save();C.globalAlpha=.15;C.fillStyle='#7aaba5';const lightPhase=.6+.4*Math.sin(elapsed*3+renderView.x);for(let i=0;i<Math.min(5,sw/150);i++){let xx=(i+1)*sw/6 + 24*Math.sin(elapsed*.2+i*5);let y=(sh*.13+i*11)%Math.max(1,horizon);C.fillRect(xx,y,13,1);}C.globalAlpha=.035*lightPhase;C.fillRect(0,horizon-3,sw,4);C.restore();
 // Pixel-scaling with fog, vignette and local light falloff.
 ctx.imageSmoothingEnabled=true;ctx.drawImage(renderCanvas,0,0,cv.width,cv.height);
 const centerX=cv.width*.5,centerY=cv.height*.51,radius=Math.max(cv.width,cv.height)*.74;
 let gradient=ctx.createRadialGradient(centerX,centerY,cv.height*(flash?.06:.01),centerX,centerY,radius);gradient.addColorStop(0,'rgba(0,0,0,0)');gradient.addColorStop(flash?.45:.17,flash?'rgba(0,0,0,.07)':'rgba(0,0,0,.38)');gradient.addColorStop(1,'rgba(0,0,0,.97)');ctx.fillStyle=gradient;ctx.fillRect(0,0,cv.width,cv.height);
 let md=state.monster?Math.hypot(state.monster.x-me.x,state.monster.y-me.y):40;let danger=clamp((5-md)/5,0,.9);$('dangerWash').style.opacity=danger.toFixed(2);
 if(danger>.12&&sound&&ts-lastBeep>Math.max(320,1100-danger*880)){heartbeat(danger);lastBeep=ts;}
 if(sound&&ts-lastAmbient>11000){creak();lastAmbient=ts;}
 const dirNames=['شرق','جنوب شرقي','جنوب','جنوب غربي','غرب','شمال غربي','شمال','شمال شرقي'];$('compass').textContent='◈ '+dirNames[Math.round(((camera%TAU+TAU)%TAU)/(TAU/8))%8];
 if(mapOpen)drawMinimap();
}
function drawMinimap(){if(!state)return;const map=state.map,me=mine();if(!me)return;const n=map.length,sz=mini.width/n;mx.fillStyle='#070b0b';mx.fillRect(0,0,mini.width,mini.height);
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){const revealed=explored.has(x+','+y);mx.fillStyle=!revealed?'#080a0c':map[y][x]===0?'#28302d':'#52534b';mx.fillRect(x*sz,y*sz,sz+.3,sz+.3);}
 for(const item of state.items){if(item.taken||item.active||!explored.has((item.x|0)+','+(item.y|0)))continue;mx.fillStyle=item.type==='sigil'?'#edbe8b':'#74d3c5';mx.beginPath();mx.arc(item.x*sz,item.y*sz,3,0,TAU);mx.fill();}
 if(state.gate){mx.fillStyle='#c8e9d5';mx.fillRect(state.exit.x*sz-3,state.exit.y*sz-3,6,6);}
 for(let p of state.players){if(p.id!==myId&&!explored.has((p.x|0)+','+(p.y|0)))continue;mx.fillStyle=p.id===myId?'#f4e5d7':'#94d1b4';mx.beginPath();mx.arc(p.x*sz,p.y*sz,p.id===myId?4:3.4,0,TAU);mx.fill();}
 mx.strokeStyle='#efcabc';mx.lineWidth=2;mx.beginPath();mx.moveTo(me.x*sz,me.y*sz);mx.lineTo((me.x+Math.cos(camera)*1.1)*sz,(me.y+Math.sin(camera)*1.1)*sz);mx.stroke();}
function markExplored(){if(!state||!mine())return;const p=mine(),cells=state.map;let ax=Math.floor(p.x),ay=Math.floor(p.y);for(let y=ay-4;y<=ay+4;y++)for(let x=ax-4;x<=ax+4;x++){if(Math.hypot(x-ax,y-ay)<5&&cells[y]?.[x]!==undefined&&lineSight(p.x,p.y,x+.5,y+.5,cells))explored.add(x+','+y);}}
function stopInput(){move.x=move.y=joy.x=joy.y=0;keys.clear();autoSprint=false;wsSend({type:'move',x:0,y:0,angle:camera,run:false});}
function tick(ts){requestAnimationFrame(tick);if(!gameStarted){lastFrame=ts;return;}const delta=Math.min(.08,(ts-lastFrame)/1000||.016);lastFrame=ts;
 const me=mine();if(!me)return;
 let x=joy.x,y=joy.y;if(!devices.touch||Math.abs(x)+Math.abs(y)<.05){x=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0);y=(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-(keys.has('KeyW')||keys.has('ArrowUp')?1:0);}
 if(keys.has('KeyQ'))camera-=delta*1.9;
 const mag=Math.hypot(x,y);if(mag>1){x/=mag;y/=mag;}
 const cw=Math.cos(camera),sw=Math.sin(camera);move.x=cw*(-y)-sw*x;move.y=sw*(-y)+cw*x;
 if(ts-lastMove>65){wsSend({type:'move',x:me.down?0:move.x,y:me.down?0:move.y,run:autoSprint||keys.has('ShiftLeft')||keys.has('ShiftRight'),angle:camera});lastMove=ts;}
 if(ts-nextFog>250){markExplored();nextFog=ts+250;}
 if(sound&&mag>.15&&ts-lastFoot>(autoSprint?270:450)&&!me.down){footstep();lastFoot=ts;}
 if(screenW&&screenH)drawScene(ts);
}
requestAnimationFrame(tick);
// Camera & movement gestures.
const stick=$('joystick'),knob=$('joystickKnob');let stickPointer=null,lookPointer=null,lookX=0;
function updateStick(e){let b=stick.getBoundingClientRect(),cx=b.left+b.width/2,cy=b.top+b.height/2,dx=e.clientX-cx,dy=e.clientY-cy,m=Math.hypot(dx,dy),radius=b.width*.32;joy.x=clamp(dx/radius,-1,1);joy.y=clamp(dy/radius,-1,1);if(m>radius){joy.x=dx/m;joy.y=dy/m;}knob.style.transform=`translate(${joy.x*radius}px,${joy.y*radius}px)`;}
stick.addEventListener('pointerdown',e=>{e.preventDefault();stickPointer=e.pointerId;stick.setPointerCapture(e.pointerId);updateStick(e);enableSound();});stick.addEventListener('pointermove',e=>{if(e.pointerId===stickPointer)updateStick(e);});
function resetStick(e){if(stickPointer!==e.pointerId)return;stickPointer=null;joy.x=joy.y=0;knob.style.transform='translate(0,0)';}
stick.addEventListener('pointerup',resetStick);stick.addEventListener('pointercancel',resetStick);
const lookpad=$('lookPad');lookpad.addEventListener('pointerdown',e=>{e.preventDefault();lookPointer=e.pointerId;lookX=e.clientX;lookpad.setPointerCapture(e.pointerId);enableSound();});lookpad.addEventListener('pointermove',e=>{if(e.pointerId===lookPointer){camera+=(e.clientX-lookX)*.0047;lookX=e.clientX;}});lookpad.addEventListener('pointerup',()=>lookPointer=null);lookpad.addEventListener('pointercancel',()=>lookPointer=null);
// Desktop input including pointer lock when supported.
cv.addEventListener('click',()=>{if(!devices.touch&&gameStarted&&document.pointerLockElement!==cv)cv.requestPointerLock?.();enableSound();});
document.addEventListener('mousemove',e=>{if(document.pointerLockElement===cv&&gameStarted)camera+=e.movementX*.0025;});
document.addEventListener('keydown',e=>{if(e.target?.tagName==='INPUT')return;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();keys.add(e.code);if(e.repeat)return;if(e.code==='KeyF'){$('flashBtn').click();}if(e.code==='KeyM')$('mapBtn').click();if(e.code==='KeyT')toggleChat(true);if((e.code==='Space'||e.code==='KeyE')&&!activePuzzle)interact();if(e.code==='Escape')toggleChat(false);});
document.addEventListener('keyup',e=>{keys.delete(e.code);});document.addEventListener('visibilitychange',()=>{if(document.hidden)stopInput();});
$('createBtn').addEventListener('click',()=>roomConnect('create'));$('joinBtn').addEventListener('click',()=>{$('joinFields').classList.toggle('hidden');});$('joinConfirm').addEventListener('click',()=>roomConnect('join'));
$('roomInput').addEventListener('keydown',e=>{if(e.key==='Enter')roomConnect('join');});$('playerName').addEventListener('keydown',e=>{if(e.key==='Enter')roomConnect('create');});
$('copyCode').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(roomCode);$('copyCode').textContent='✓ تم نسخ رمز الغرفة';setTimeout(()=>$('copyCode').textContent='⧉ نسخ رمز الدعوة',2000);}catch{notify('رمز الغرفة: '+roomCode);}});
$('shareRoom').addEventListener('click',async()=>{const link=location.origin+'/?room='+roomCode;try{if(navigator.share)await navigator.share({title:'الممر الأخير',text:'العب معي في غرفة الرعب!',url:link});else{await navigator.clipboard.writeText(link);notify('تم نسخ رابط الدعوة!');}}catch{}});
const sharedCode=new URLSearchParams(location.search).get('room');if(sharedCode&&/^[A-Fa-f0-9]{6}$/.test(sharedCode)){$('joinFields').classList.remove('hidden');$('roomInput').value=sharedCode.toUpperCase();}
$('leaveLobby').addEventListener('click',leave);$('againBtn').addEventListener('click',leave);$('chatToggle').addEventListener('click',()=>toggleChat());$('chatClose').addEventListener('click',()=>toggleChat(false));$('chatForm').addEventListener('submit',sendChat);
$('puzzleClose').addEventListener('click',closePuzzle);$('actBtn').addEventListener('click',interact);$('flashBtn').addEventListener('click',()=>{flash=!flash;$('flashBtn').classList.toggle('active',flash);chirp();});$('mapBtn').addEventListener('click',()=>{mapOpen=!mapOpen;$('minimap').classList.toggle('hidden',!mapOpen);});
$('sprintBtn').addEventListener('pointerdown',e=>{autoSprint=true;$('sprintBtn').classList.add('sprinting');e.currentTarget.setPointerCapture(e.pointerId);});for(let t of ['pointerup','pointercancel'])$('sprintBtn').addEventListener(t,()=>{autoSprint=false;$('sprintBtn').classList.remove('sprinting');});
$('soundBtn').addEventListener('click',()=>{sound=!sound;$('soundBtn').textContent=sound?'♫':'♪';if(sound)enableSound();});
function enableSound(){if(!sound)return;try{if(!audio)audio=new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();}catch{}}
function wave(freq,finish,duration=.14,type='sine',vol=.015,pan=0){if(!audio||!sound)return;let o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.setValueAtTime(freq,audio.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(30,finish),audio.currentTime+duration);g.gain.setValueAtTime(vol,audio.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+duration);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+duration+.02);}
function heartbeat(danger){wave(67,41,.17,'sine',.13*danger);setTimeout(()=>wave(61,43,.12,'sine',.075*danger),150);}
function terrorBeep(){wave(360,67,.32,'sawtooth',.019);wave(108,32,.6,'sine',.03);}
function footstep(){wave(79,33,.12,'triangle',.015);}
function creak(){wave(180,37,2.4,'sawtooth',.007);wave(40,29,2,'sine',.021);}
function chirp(){wave(535,290,.1,'sine',.008);}
window.addEventListener('error',e=>{console.error('Game error:',e.message);});
if('serviceWorker'in navigator&&location.protocol==='https:')navigator.serviceWorker.register('/sw.js').catch(()=>{});
})();
