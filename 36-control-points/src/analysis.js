export function principalDirections(columns,previous=null,count=4){
 const n=columns.length;
 if(!n||columns.some(c=>c.some(v=>!Number.isFinite(v))))return {direction:null,directions:[],strength:0,strengths:[],rank:0,share:0};
 const gram=columns.map(a=>columns.map(b=>a.reduce((s,v,k)=>s+v*b[k],0)));
 const trace=gram.reduce((s,r,i)=>s+r[i],0);
 if(trace<1e-12)return {direction:null,directions:[],strength:0,strengths:[],rank:0,share:0};
 // Symmetric Jacobi diagonalization finds the actual leading eigenspace,
 // including a strong coupled block orthogonal to the largest diagonal entry.
 const a=gram.map(r=>r.map(x=>x/trace)),vectors=Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>i===j?1:0));
 for(let iteration=0;iteration<50*n*n;iteration++){
  let p=0,q=0,max=0;for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)if(Math.abs(a[i][j])>max){max=Math.abs(a[i][j]);p=i;q=j;}
  if(max<1e-12)break;
  const angle=.5*Math.atan2(2*a[p][q],a[q][q]-a[p][p]),c=Math.cos(angle),s=Math.sin(angle);
  const app=a[p][p],aqq=a[q][q],apq=a[p][q];
  a[p][p]=c*c*app-2*c*s*apq+s*s*aqq;a[q][q]=s*s*app+2*c*s*apq+c*c*aqq;a[p][q]=a[q][p]=0;
  for(let k=0;k<n;k++){
   if(k!==p&&k!==q){const x=a[k][p],y=a[k][q];a[k][p]=a[p][k]=c*x-s*y;a[k][q]=a[q][k]=s*x+c*y;}
   const x=vectors[k][p],y=vectors[k][q];vectors[k][p]=c*x-s*y;vectors[k][q]=s*x+c*y;
  }
 }
 const order=Array.from({length:n},(_,i)=>i).sort((i,j)=>a[j][j]-a[i][i]).slice(0,count);
 let modes=order.map(j=>({vector:vectors.map(r=>r[j]),energy:Math.max(0,a[j][j]*trace)}));
 const threshold=Math.max(1e-12,trace*1e-8);
 modes=modes.map(m=>m.energy>threshold?m:{vector:Array(n).fill(0),energy:0});
 const directions=alignDirections(modes.map(m=>m.vector),previous);
 const strengths=directions.map(v=>Math.sqrt(Math.max(0,v.reduce((s,x,i)=>s+x*gram[i].reduce((t,a,j)=>t+a*v[j],0),0))));
 const rank=modes.filter(m=>m.energy>0).length;
 return {directions,direction:rank?directions[0]:null,strength:strengths[0]||0,strengths,rank,share:modes.reduce((s,m)=>s+m.energy,0)/trace};
}

export function principalDirection(columns,previous=null){
 return principalDirections(columns,previous?[previous]:null,1);
}

// Align at both probe capture and extension: equal parameter values may live on
// opposite sides of a phase fold, where the coordinate Jacobian has opposite signs.
export function alignDirections(directions,previous){
 if(!previous?.length||!directions.length)return directions.map(v=>[...v]);
 let best=directions,bestScore=-Infinity;
 const visit=(remaining,chosen,score)=>{
  if(!remaining.length){if(score>bestScore){bestScore=score;best=chosen;}return;}
  for(let k=0;k<remaining.length;k++){
   const mode=remaining[k],old=previous[chosen.length];
   const dot=old?mode.reduce((s,v,i)=>s+v*old[i],0):0;
   visit(remaining.filter((_,i)=>i!==k),[...chosen,dot<0?mode.map(v=>-v):[...mode]],score+Math.abs(dot));
  }
 };
 visit(directions,[],0);
 if(directions.length<2||previous.length!==directions.length)return best;
 // Project previous axes into the measured subspace, then orthogonalize. This
// is invariant to arbitrary rotations of eigenvectors within a repeated eigenspace.
 const aligned=[];
 for(let k=0;k<directions.length;k++){
  let v=Array(directions[0].length).fill(0);
  for(const mode of directions){const d=mode.reduce((s,x,i)=>s+x*previous[k][i],0);v=v.map((x,i)=>x+d*mode[i]);}
  for(const old of aligned){const d=v.reduce((s,x,i)=>s+x*old[i],0);v=v.map((x,i)=>x-d*old[i]);}
  const norm=Math.hypot(...v);if(norm<1e-6)return best;
  aligned.push(v.map(x=>x/norm));
 }
 return aligned;
}

// Fixed spatial summaries, independent of rendered colors and display opacity.
export function trailFeatures(rgba,size){
 let grid=new Float64Array(size*size);
 for(let i=0;i<grid.length;i++)grid[i]=Math.log1p(Math.max(0,rgba[i*4])*16)/4;
 const features=[];
 for(let level=0;level<4;level++){
  const count=size*size;let mean=0,square=0,gx=0,gy=0,occupied=0;
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
   const a=grid[y*size+x];mean+=a;square+=a*a;occupied+=a>.1?1:0;
   gx+=Math.abs(a-grid[y*size+(x+1)%size]);gy+=Math.abs(a-grid[((y+1)%size)*size+x]);
  }
  features.push(mean/count,Math.sqrt(square/count),gx/count,gy/count,occupied/count*.2);
  if(size===4){features.push(...Array.from(grid,v=>v*.25));break;}
  const n=size/2,next=new Float64Array(n*n);
  for(let y=0;y<n;y++)for(let x=0;x<n;x++)next[y*n+x]=(grid[2*y*size+2*x]+grid[2*y*size+2*x+1]+grid[(2*y+1)*size+2*x]+grid[(2*y+1)*size+2*x+1])/4;
  grid=next;size=n;
 }
 return features;
}
