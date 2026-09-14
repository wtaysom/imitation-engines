export class GridTravel {
 constructor(){this.clear();}
 clear(){this.targets=[null,null];this.paths=[null,null];}
 releaseTargets(){this.targets.forEach((target,g)=>{if(!this.paths[g])this.targets[g]=null;});}
 cancel(grid){this.targets[grid]=null;this.paths[grid]=null;}
 set(grid,x,y){this.cancel(grid);this.targets[grid]=[x,y];}
 setPath(grid,points,closed=false){
  this.cancel(grid);
  const clean=[];
  for(const point of points){
   if(!point.every(Number.isFinite))continue;
   if(!clean.length||Math.hypot(...point.map((v,i)=>v-clean.at(-1)[i]))>1e-12)clean.push([...point]);
  }
  if(closed&&clean.length>1&&Math.hypot(...clean[0].map((v,i)=>v-clean.at(-1)[i]))<1e-12)clean.pop();
  if(!clean.length)return;
  this.targets[grid]=clean[0];
  if(clean.length>1)this.paths[grid]={points:clean,closed,index:0,direction:1};
 }
 delta(position,distance){
  const delta=position.map((value,i)=>{
   const target=this.targets[Math.floor(i/2)];
   return target?target[i%2===0?1:0]-value:0;
  });
  const length=Math.hypot(...delta);
  return length>distance?delta.map(v=>v/length*distance):delta;
 }
 settle(position){
  this.targets.forEach((target,g)=>{
   if(!target||Math.hypot(target[0]-position[2*g+1],target[1]-position[2*g])>=1e-12)return;
   const path=this.paths[g];
   if(!path){this.targets[g]=null;return;}
   if(path.closed)path.index=(path.index+1)%path.points.length;
   else{
    if(path.index===path.points.length-1)path.direction=-1;
    else if(path.index===0)path.direction=1;
    path.index+=path.direction;
   }
   this.targets[g]=path.points[path.index];
  });
 }
}
