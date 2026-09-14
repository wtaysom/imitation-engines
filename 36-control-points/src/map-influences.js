import { encode } from './parameters.js';
import { applyOffsets } from './offsets.js';
import { ParameterMap, clipToBall } from './map.js';

// Rank actual slider changes in either direction, including manual clipping.
// Looking on both sides also catches parameters at a smooth turning point.
export function mapInfluences(map,position,offsets=[],directions=null){
 if(!map.ready){
  if(!directions)return [[],[],[],[]];
  const preview=new ParameterMap(map.anchor,map.width);preview.initialize(directions);map=preview;
 }
 const base=encode(applyOffsets(map.at(position),offsets)),step=1e-4;
 return Array.from({length:4},(_,axis)=>{
  const scores=base.map(()=>0);
  for(const sign of [-1,1]){
   const delta=[0,0,0,0];delta[axis]=sign*step;
   const next=clipToBall(position,delta,map.radius).position;
   const values=encode(applyOffsets(map.at(next),offsets));
   values.forEach((value,index)=>{scores[index]=Math.max(scores[index],Math.abs(value-base[index]));});
  }
  return scores.map((strength,index)=>({index,strength})).filter(p=>p.strength>1e-12).sort((a,b)=>b.strength-a.strength||a.index-b.index).slice(0,4);
 });
}
