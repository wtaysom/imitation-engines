import { encode, decode, clamp } from './parameters.js';
import { principalDirections } from './analysis.js';
import { applyOffsets } from './offsets.js';

export class ProbeRunner {
 constructor(simulation){this.sim=simulation;this.job=null;this.result=null;this.completed=0;}
 cancel(){this.job=null;this.result=null;}
 start(snapshot,values,horizon,previous=null,offsets=[]){
  const q=encode(values);this.result=null;
  this.job={snapshot,values:[...values],offsets:[...offsets],q,horizon,previous,index:0,sign:-1,step:0,columns:[],negative:null,positive:null,scale:null};
  this.beginVariant();
 }
 // Perturb the unadjusted map coordinate, then apply the fixed offsets. This
 // measures the complete map-to-simulation response, including clipped axes.
 beginVariant(){const j=this.job,q=[...j.q];q[j.index]=clamp(q[j.index]+j.sign*.025);j.variant=applyOffsets(decode(q,j.values),j.offsets);j.variantCoordinate=q[j.index];j.step=0;this.sim.restore(j.snapshot);}
 tick(budget=4){
  for(let n=0;n<budget&&this.job;n++){
   const j=this.job;this.sim.step(j.variant);j.step++;
   if(j.step<j.horizon)continue;
   const f=this.sim.features();
   if(f.some(x=>!Number.isFinite(x))){this.cancel();throw new Error('Non-finite probe response. Choose a different preset or reset.');}
   if(j.sign<0){j.negative=f;j.low=j.variantCoordinate;j.sign=1;this.beginVariant();}
   else {
    const separation=j.variantCoordinate-j.low;
    // A fixed floor prevents nearly empty image statistics from dominating.
    if(!j.scale)j.scale=f.map((v,k)=>Math.max(.08,(Math.abs(v)+Math.abs(j.negative[k]))/2));
    j.columns.push(f.map((v,k)=>(v-j.negative[k])/separation/j.scale[k]));
    j.index++;j.sign=-1;
    if(j.index===16){this.result={...principalDirections(j.columns,j.previous),q:j.q,values:j.values,horizon:j.horizon,frame:j.snapshot.frame};this.job=null;this.completed++;}
    else this.beginVariant();
   }
  }
 }
 get progress(){return this.job?(this.job.index*2+(this.job.sign>0?1:0)+this.job.step/this.job.horizon)/32:1;}
}
