(function(root){
'use strict';
const SIZE=27;
function rndGen(seed){let x=(seed>>>0)||1234567;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;};}
function generate(seed){
  const random=rndGen(seed), n=SIZE, cells=Array.from({length:n},()=>Array(n).fill(1));
  const seen=new Set(['1,1']), stack=[[1,1]];cells[1][1]=0;
  while(stack.length){let [x,y]=stack.at(-1),next=[];for(const [dx,dy] of [[2,0],[-2,0],[0,2],[0,-2]]){const nx=x+dx,ny=y+dy;if(nx>0&&ny>0&&nx<n-1&&ny<n-1&&!seen.has(nx+','+ny))next.push([nx,ny,dx,dy]);}
    if(next.length){const [nx,ny,dx,dy]=next[Math.floor(random()*next.length)];cells[y+dy/2][x+dx/2]=0;cells[ny][nx]=0;seen.add(nx+','+ny);stack.push([nx,ny]);}else stack.pop();}
  for(let y=3;y<n-3;y+=2)for(let x=3;x<n-3;x+=2){if(random()<.18){let [dx,dy]=[[1,0],[-1,0],[0,1],[0,-1]][Math.floor(random()*4)];cells[y+dy][x+dx]=0;}}
  // Carve wider chambers for hiding, exploring and dramatic encounters.
  for(const [cx,cy] of [[7,7],[19,7],[7,19],[19,19]]) for(let y=cy-1;y<=cy+1;y++)for(let x=cx-1;x<=cx+1;x++)cells[y][x]=0;
  for(let x=1;x<=4;x++)for(let y=1;y<=3;y++) cells[y][x]=0;
  const queue=[[1,1]],dist=Array.from({length:n},()=>Array(n).fill(999)),reachable=[];dist[1][1]=0;
  for(let k=0;k<queue.length;k++){let [x,y]=queue[k];reachable.push({x,y,d:dist[y][x]});for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const a=x+dx,b=y+dy;if(a>0&&b>0&&a<n-1&&b<n-1&&cells[b][a]===0&&dist[b][a]===999){dist[b][a]=dist[y][x]+1;queue.push([a,b]);}}}
  let candidates=reachable.filter(p=>p.d>18).sort((a,b)=>b.d-a.d), picked=[];
  function pick(){const selection=candidates.filter(p=>picked.every(q=>Math.hypot(p.x-q.x,p.y-q.y)>7));let p=selection[Math.floor(random()*Math.min(selection.length,22))]||candidates.find(p=>picked.every(q=>Math.hypot(p.x-q.x,p.y-q.y)>4))||candidates[0];picked.push(p);return {x:p.x+.5,y:p.y+.5};}
  const items=[{id:'sigil1',type:'sigil',title:'الختم الأول',...pick()},{id:'sigil2',type:'sigil',title:'الختم الثاني',...pick()},{id:'sigil3',type:'sigil',title:'الختم الثالث',...pick()},{id:'power1',type:'power',title:'مولّد الطاقة A',...pick()},{id:'power2',type:'power',title:'مولّد الطاقة B',...pick()}];
  const monster=candidates[0]||{x:23,y:23};
  return {cells,n,items,exit:{x:2.5,y:3.5},spawn:[{x:1.65,y:1.55},{x:2.1,y:2.2}],monster:{x:monster.x+.5,y:monster.y+.5}};
}
function wall(cells,x,y,r=.24){for(let dx of [-r,r])for(let dy of [-r,r]){let px=Math.floor(x+dx),py=Math.floor(y+dy);if(!cells[py]||cells[py][px]!==0)return true;}return false;}
const api={SIZE,generate,wall};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.Corridor=api;
})(typeof window!=='undefined'?window:globalThis);
