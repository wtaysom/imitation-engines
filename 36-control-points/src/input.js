export const AXES = [
 {label:'W / S', positive:'KeyW', negative:'KeyS'},
 {label:'D / A', positive:'KeyD', negative:'KeyA'},
 {label:'↑ / ↓', positive:'ArrowUp', negative:'ArrowDown'},
 {label:'→ / ←', positive:'ArrowRight', negative:'ArrowLeft'},
];
export const TRAVEL_KEYS = AXES.flatMap(a=>[a.positive,a.negative]);
export const CONTROL_KEYS = [...TRAVEL_KEYS,'KeyQ','KeyE'];

export class TravelInput {
 constructor(){this.keys=new Set();this.pointers=new Map();}
 key(code,down,editable=false){
  if(editable){this.clear();return;}
  if(!CONTROL_KEYS.includes(code))return;
  if(down)this.keys.add(code);else this.keys.delete(code);
 }
 clear(){this.keys.clear();this.pointers.clear();}
 set pointer(value){if(value)this.pointers.set('legacy',[0,value]);else this.pointers.delete('legacy');}
 get velocity(){return this.vector[0];}
 get vector(){
  return AXES.map((axis,i)=>Math.sign(Number(this.keys.has(axis.positive))-Number(this.keys.has(axis.negative))+
   [...this.pointers.values()].reduce((s,[a,v])=>s+(a===i?v:0),0)));
 }
 get speedDirection(){return Number(this.keys.has('KeyE'))-Number(this.keys.has('KeyQ'));}
}
