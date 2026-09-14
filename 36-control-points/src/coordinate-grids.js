const INITIAL_EXTENT=.12;
const GRIDS=[
 {id:'wasd-grid',name:'WASD',x:1,y:0,labels:['W','D','S','A'],keys:['KeyW','KeyD','KeyS','KeyA']},
 {id:'arrows-grid',name:'Arrow keys',x:3,y:2,labels:['↑','→','↓','←'],keys:['ArrowUp','ArrowRight','ArrowDown','ArrowLeft']}
];

function gridLines(extent){
 // Fixed coordinate intervals shrink on screen as the view expands. At very
 // wide scales, drop a level of fine lines while retaining the same lattice.
 let step=.03;while(40*step/extent<2.5)step*=4;
 const minor=[],major=[];
 for(let n=1;n*step<extent-1e-12;n++)for(const sign of [-1,1]){
  const v=60+sign*40*n*step/extent;
  (n%4===0?major:minor).push(`M${v} 20V100 M20 ${v}H100`);
 }
 return {minor:minor.join(' '),major:major.join(' ')};
}

export class CoordinateGrids {
 constructor(container,onTarget,onPath,onDrawStart){
  this.drawings=[null,null];
  container.innerHTML=GRIDS.map(({id,name,labels,keys,x,y})=>`<svg id="${id}" class="coordinate-grid" viewBox="0 0 120 120" role="group" tabindex="0" aria-label="${name} coordinate grid" aria-description="Click to set a target. Drag to define a path. Closed paths loop; open paths run back and forth. Keyboard direction keys take over.">
   <rect class="grid-background" x="20" y="20" width="80" height="80"/>
   <path class="grid-minor"/>
   <path class="grid-major"/>
   <path class="grid-axes" d="M60 20V100 M20 60H100"/>
   ${[[60,11],[111,60],[60,111],[9,60]].map(([x,y],i)=>`<foreignObject class="grid-keycap" x="${x-9}" y="${y-9}" width="18" height="18"><div xmlns="http://www.w3.org/1999/xhtml"><button type="button" class="keycap-button" data-key="${keys[i]}" aria-label="Move ${['up','right','down','left'][i]} (${name})" aria-keyshortcuts="${keys[i].replace('Key','')}"><kbd>${labels[i]}</kbd></button></div></foreignObject>`).join('')}
   <path class="travel-path"/>
   <circle class="grid-origin" cx="60" cy="60" r="1.5"/>
   <circle class="target-dot" cx="60" cy="60" r="3.5" visibility="hidden"/>
   <g class="position-marker" transform="translate(60 60)" data-x="60" data-y="60" role="img" aria-label="Current map position">
    ${[x,y].flatMap((dimension,axis)=>[-3,3,-7,7].map((offset,rank)=>`<circle class="influence-dot" data-dimension="${dimension}" data-rank="${rank}" cx="${axis===0?offset:0}" cy="${axis===1?offset:0}" r="1.8" fill="#777"/>`)).join('')}
   </g>
  </svg>`).join('');
  this.grids=GRIDS.map(g=>({...g,svg:container.querySelector(`#${g.id}`),marker:container.querySelector(`#${g.id} .position-marker`),target:container.querySelector(`#${g.id} .target-dot`)}));
  this.grids.forEach(({svg},index)=>{
   const pointAt=event=>new DOMPoint(event.clientX,event.clientY).matrixTransform(svg.getScreenCTM().inverse());
   const world=(point,extent)=>[(Math.max(20,Math.min(100,point.x))-60)/40*extent,(60-Math.max(20,Math.min(100,point.y)))/40*extent];
   const record=(event,force=false)=>{
    const drawing=this.drawings[index];if(!drawing||drawing.pointerId!==event.pointerId)return;
    const point=pointAt(event),value=world(point,drawing.extent);
    if(Math.hypot(event.clientX-drawing.clientX,event.clientY-drawing.clientY)>4)drawing.dragged=true;
    const distance=Math.hypot(...value.map((v,i)=>v-drawing.points.at(-1)[i]));
    if(distance>(force?1e-12:drawing.extent*1.5/40))drawing.points.push(value);
   };
   svg.addEventListener('pointerdown',event=>{
    if(event.button!==0||event.target.closest('button')||this.drawings.some(Boolean))return;
    const point=pointAt(event);if(point.x<20||point.x>100||point.y<20||point.y>100)return;
    event.preventDefault();svg.focus({preventScroll:true});
    this.drawings[index]={pointerId:event.pointerId,points:[world(point,this.extent)],extent:this.extent,clientX:event.clientX,clientY:event.clientY,dragged:false};
    // Synthetic integration-test events have no active pointer to capture.
    try{svg.setPointerCapture(event.pointerId);}catch{}
    onDrawStart?.(index);
   });
   svg.addEventListener('pointermove',event=>record(event));
   svg.addEventListener('pointerup',event=>{
    const drawing=this.drawings[index];if(!drawing||drawing.pointerId!==event.pointerId)return;
    record(event,true);this.cancelDrawing(index);
    if(drawing.dragged&&drawing.points.length>1){
     const closed=drawing.points.length>2&&Math.hypot(...drawing.points[0].map((v,i)=>v-drawing.points.at(-1)[i]))<=drawing.extent*6/40;
     onPath?.(index,drawing.points,closed);
    }else onTarget?.(index,...drawing.points[0]);
   });
   for(const type of ['pointercancel','lostpointercapture'])svg.addEventListener(type,event=>{
    if(this.drawings[index]?.pointerId===event.pointerId)this.cancelDrawing(index);
   });
  });
  this.reset();
 }
 cancelDrawing(index){
  for(const [g,{svg}] of this.grids.entries()){
   if(index!==undefined&&index!==g)continue;
   const drawing=this.drawings[g];this.drawings[g]=null;
   if(drawing&&svg.hasPointerCapture(drawing.pointerId))svg.releasePointerCapture(drawing.pointerId);
  }
 }
 setInfluences(influences,colors,names){
  for(const {marker,x,y} of this.grids){
   for(const dot of marker.querySelectorAll('.influence-dot')){
    const parameter=influences[+dot.dataset.dimension]?.[+dot.dataset.rank]?.index;
    dot.setAttribute('fill',parameter===undefined?'#777':colors[parameter]||'#777');
    if(parameter===undefined)delete dot.dataset.parameter;else dot.dataset.parameter=parameter;
   }
   const description=axis=>(influences[axis]||[]).map(p=>names[p.index]).join(', ')||'not yet measured';
   marker.setAttribute('aria-label',`Current map position. Horizontal: ${description(x)}. Vertical: ${description(y)}.`);
  }
 }
 reset(){this.cancelDrawing();this.extent=INITIAL_EXTENT;this.update([0,0,0,0]);}
 update(position,input=[0,0,0,0],targets=[],paths=[]){
  // Grow both views together, leaving room near the border. Do not zoom back
  // in while retracing: returning to a coordinate keeps its screen location.
  // Keep pointer recording and preview in the same coordinate frame during a drag.
  if(!this.drawings.some(Boolean))while(Math.max(...position.map(Math.abs))>this.extent*.9)this.extent*=2;
  if(this.lineExtent!==this.extent){
   const lines=gridLines(this.extent);
   for(const {svg} of this.grids){
    svg.querySelector('.grid-minor').setAttribute('d',lines.minor);
    svg.querySelector('.grid-major').setAttribute('d',lines.major);
   }
   this.lineExtent=this.extent;
  }
  for(const [index,{x,y,svg,marker,target}] of this.grids.entries()){
   const px=60+40*position[x]/this.extent,py=60-40*position[y]/this.extent;
   marker.setAttribute('transform',`translate(${px} ${py})`);marker.dataset.x=px;marker.dataset.y=py;
   svg.classList.toggle('held',!!(input[x]||input[y]));
   const drawing=this.drawings[index],path=drawing||paths[index],line=svg.querySelector('.travel-path');
   const d=path?path.points.map(([px,py],i)=>`${i?'L':'M'}${60+40*px/this.extent} ${60-40*py/this.extent}`).join(' ')+(path.closed?' Z':''):'';
   if(line.getAttribute('d')!==d)line.setAttribute('d',d);
   line.classList.toggle('drawing',!!drawing);
   const destination=targets[index];target.setAttribute('visibility',destination&&!paths[index]?'visible':'hidden');
   if(destination){
    target.setAttribute('cx',60+40*destination[0]/this.extent);
    target.setAttribute('cy',60-40*destination[1]/this.extent);
   }
  }
 }
}
