import { PRESETS } from './presets.js';

const names=['Dist · base','Dist · power','Dist · scale','Angle · base','Angle · power','Angle · scale','Turn · base','Turn · power','Turn · scale','Move · base','Move · power','Move · scale','Shift Y','Shift X','Trail add','Trail decay','Blur passes','Draw opacity','Fill opacity','Dot size'];
const maxima=[100,100,20,6.28,400,20,6.28,400,30,25,150,150,20,20,1,1,20,1,1,50];
const scales=[1,2,.1,.2,2,.1,.2,2,.1,.2,2,.1,1,1,1,1,1,1,1,1];
export const PARAMETERS=names.map((name,i)=>({name,min:i===12||i===13?-20:0,max:Math.max(maxima[i],...PRESETS.map(p=>p.values[i])),scale:scales[i],active:i<16,log:i<12,step:i===16?1:.001}));
export const clamp=(v,lo=0,hi=1)=>Math.max(lo,Math.min(hi,v));
export function encode(values) {
 return values.slice(0,16).map((v,i)=>{const p=PARAMETERS[i];return p.log?Math.log1p(v/p.scale)/Math.log1p(p.max/p.scale):(v-p.min)/(p.max-p.min);});
}
export function decode(q,anchor) {
 const result=Array.from(anchor);
 for(let i=0;i<16;i++){const p=PARAMETERS[i],v=clamp(q[i]);result[i]=p.log?p.scale*Math.expm1(v*Math.log1p(p.max/p.scale)):p.min+v*(p.max-p.min);}
 return result;
}
export function normalize(v) { const n=Math.hypot(...v);return n>1e-12?v.map(x=>x/n):v.map(()=>0); }
