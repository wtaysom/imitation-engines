import { PARAMETERS, clamp } from './parameters.js';

export function applyOffsets(mapped,offsets=[]){
 return mapped.map((value,i)=>{
  const offset=offsets[i]||0;if(!offset)return value;
  const p=PARAMETERS[i],actual=clamp(value+offset,p.min,p.max);
  return i===16?Math.round(actual):actual;
 });
}

export class ParameterOffsets {
 constructor(){this.clear();}
 clear(){this.values=Array(20).fill(0);}
 set(index,value,mapped){
  const p=PARAMETERS[index];if(!Number.isInteger(index)||!p||!Number.isFinite(value))return false;
  const actual=clamp(index===16?Math.round(value):value,p.min,p.max);
  this.values[index]=actual-mapped[index];return true;
 }
 apply(mapped){return applyOffsets(mapped,this.values);}
}
