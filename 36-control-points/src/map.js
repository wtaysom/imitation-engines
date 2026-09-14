import { encode, decode } from './parameters.js';

const zeros=()=>Array.from({length:4},()=>Array(16).fill(0));
const copy=matrix=>matrix.map(column=>[...column]);
const dot=(a,b)=>a.reduce((sum,v,i)=>sum+v*b[i],0);

// A four-dimensional map with immutable concentric shells.
// Integrate the radial frame A into B, then theta(z) = theta0 + B(r) z/r.
// This avoids the r/shellWidth amplification of an interpolated A(r)z map.
export class ParameterMap {
 constructor(parameters,width=.12){
  this.anchor=[...parameters];this.width=width;this.nodes=[];
  this.phase=encode(parameters).map(q=>Math.asin(Math.sqrt(q)));
 }
 get ready(){return this.nodes.length>0;}
 get radius(){return this.nodes.at(-1)?.r||0;}
 initialize(directions){
  if(this.ready)return;
  const A=zeros();
  for(let k=0;k<4;k++)for(let i=0;i<16;i++){
   const slope=Math.sin(2*this.phase[i]);
   A[k][i]=(directions[k]?.[i]||0)*(slope<0?-1:1)/Math.max(.25,Math.abs(slope));
  }
  this.nodes=[{r:0,A:copy(A),B:zeros()},{r:this.width,A:copy(A),B:A.map(c=>c.map(v=>this.width*v))}];
 }
 frameAt(r){
  if(!this.ready)throw new Error('The parameter map is not ready.');
  if(r>this.radius+1e-9)throw new RangeError('Coordinate is outside the learned map.');
  if(r===0)return this.nodes[0];
  let lo=0,hi=this.nodes.length-1;
  while(hi-lo>1){const mid=(lo+hi)>>1;if(this.nodes[mid].r<r)lo=mid;else hi=mid;}
  const left=this.nodes[lo],right=this.nodes[hi],h=right.r-left.r;
  // Sphere intersections can round just outside a boundary. Resolve the same
  // stored endpoint on both sides of a later extension, bit for bit.
  if(Math.abs(r-left.r)<1e-12)return left;
  if(Math.abs(r-right.r)<1e-12)return right;
  const s=Math.max(0,Math.min(1,(r-left.r)/h)),blend=s*s*(3-2*s),integral=s**3-.5*s**4;
  return {
   A:left.A.map((column,k)=>column.map((v,i)=>v+blend*(right.A[k][i]-v))),
   B:left.B.map((column,k)=>column.map((v,i)=>v+h*s*left.A[k][i]+h*integral*(right.A[k][i]-left.A[k][i]))),
  };
 }
 phasesAt(position){
  this.validate(position);const r=Math.hypot(...position);
  if(!r)return [...this.phase];
  const {B}=this.frameAt(r);
  return this.phase.map((v,i)=>v+position.reduce((sum,z,k)=>sum+B[k][i]*z/r,0));
 }
 at(position){
  this.validate(position);
  if(position.every(v=>v===0))return [...this.anchor];
  return decode(this.phasesAt(position).map(theta=>Math.sin(theta)**2),this.anchor);
 }
 jacobian(position){
  const r=Math.hypot(...position),{A,B}=this.frameAt(r),theta=this.phasesAt(position);
  if(!r)return A.map(c=>c.map((v,i)=>v*Math.sin(2*theta[i])));
  const u=position.map(v=>v/r);
  return A.map((column,k)=>column.map((_,i)=>Math.sin(2*theta[i])*(B[k][i]/r+u[k]*u.reduce((sum,v,j)=>sum+v*(A[j][i]-B[j][i]/r),0))));
 }
 extend(directions,position){
  if(!this.ready){this.initialize(directions);return;}
  const old=this.nodes.at(-1),theta=this.phasesAt(position),lambda=.2;
  const A=old.A.map((column,k)=>{
   const direction=directions[k];
   if(!direction||Math.hypot(...direction)<1e-10)return [...column];
   let target=column.map((v,i)=>{
    const slope=Math.sin(2*theta[i]);
    // Signed, regularized inversion survives phase folds and exact parameter bounds.
    return (lambda*lambda*v+slope*direction[i])/(slope*slope+lambda*lambda);
   });
   const norm=Math.hypot(...target);if(norm>4)target=target.map(v=>v*4/norm);
   return column.map((v,i)=>v+.25*(target[i]-v));
  });
  this.nodes.push({r:old.r+this.width,A,B:old.B.map((column,k)=>column.map((v,i)=>v+this.width*(old.A[k][i]+A[k][i])/2))});
 }
 validate(position){if(position.length!==4||!position.every(Number.isFinite))throw new Error('Expected four finite coordinates.');}
}

// Stop on the requested straight path, not at a radially projected endpoint.
export function clipToBall(position,delta,radius){
 const target=position.map((v,i)=>v+delta[i]);
 if(Math.hypot(...target)<=radius)return {position:target,limited:false};
 const a=dot(delta,delta),b=2*dot(position,delta),c=dot(position,position)-radius*radius;
 const t=a?Math.max(0,Math.min(1,(-b+Math.sqrt(Math.max(0,b*b-4*a*c)))/(2*a))):0;
 return {position:position.map((v,i)=>v+t*delta[i]),limited:true};
}
