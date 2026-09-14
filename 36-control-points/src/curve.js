import { clamp, encode, decode, normalize } from './parameters.js';

// Immutable cubic Bezier segments in normalized parameter coordinates.
// Bounded control polygons guarantee bounded interiors without evaluation-time clipping.
export class ParameterCurve {
 constructor(parameters,h=.12){this.anchor=Array.from(parameters);this.h=h;this.nodes=[{z:0,q:encode(parameters),p:Array.from(parameters),t:Array(16).fill(0)}];this.ready=false;}
 get min(){return this.nodes[0].z;}
 get max(){return this.nodes.at(-1).z;}
 initialize(direction){if(this.ready)return;const n=this.nodes[0];n.t=this.feasibleTangent(n.q,normalize(direction));this.ready=true;}
 feasibleTangent(q,t){return t.map((v,i)=>Math.sign(v)*Math.min(Math.abs(v),3*Math.min(q[i],1-q[i])/this.h));}
 extend(side,direction){
  if(!this.ready)this.initialize(direction);
  const old=side>0?this.nodes.at(-1):this.nodes[0];
  let d=normalize(direction),t=old.t;
  if(d.reduce((s,v,i)=>s+v*t[i],0)<0)d=d.map(v=>-v);
  // Blend in increasing-z coordinates, then turn into an outward displacement.
  let out=d.map((v,i)=>side*(.65*t[i]+.35*v));
  out=out.map((v,i)=>old.q[i]<1e-10?Math.abs(v):old.q[i]>1-1e-10?-Math.abs(v):v);
  const q=old.q.map((v,i)=>clamp(v+this.h*out[i]));
  const tangent=this.feasibleTangent(q,out.map(v=>side*v));
  const node={z:old.z+side*this.h,q,p:decode(q,this.anchor),t:tangent};
  if(side>0)this.nodes.push(node);else this.nodes.unshift(node);
  return node;
 }
 at(z){
  if(!Number.isFinite(z))throw new Error('Curve coordinate must be finite');
  if(z<=this.min)return [...this.nodes[0].p];if(z>=this.max)return [...this.nodes.at(-1).p];
  let lo=0,hi=this.nodes.length-1;while(hi-lo>1){const mid=(lo+hi)>>1;if(this.nodes[mid].z<=z)lo=mid;else hi=mid;}
  const a=this.nodes[lo],b=this.nodes[hi];if(z===a.z)return [...a.p];if(z===b.z)return [...b.p];
  const h=b.z-a.z,u=(z-a.z)/h,v=1-u;
  return decode(a.q.map((q,i)=>v*v*v*q+3*v*v*u*(q+h*a.t[i]/3)+3*v*u*u*(b.q[i]-h*b.t[i]/3)+u*u*u*b.q[i]),this.anchor);
 }
}
