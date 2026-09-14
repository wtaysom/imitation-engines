// Names follow the standard layout, using the user's PS4-style labels.
export const BUTTON_COMMANDS={0:'TogglePause',1:'KeyH',2:'KeyL',3:'KeyM',4:'KeyE',5:'KeyQ',9:'KeyG',12:'KeyJ',13:'KeyK',14:'KeyO',15:'KeyP'};
const zero=()=>[0,0,0,0];
export function stickVector(x,y,deadZone=.15){
 if(!Number.isFinite(x)||!Number.isFinite(y))return [0,0];
 x=Math.max(-1,Math.min(1,x));y=Math.max(-1,Math.min(1,y));
 const length=Math.hypot(x,y);if(length<=deadZone)return [0,0];
 const scale=(Math.min(1,length)-deadZone)/(1-deadZone)/length;
 return [x*scale,y*scale];
}
export function travelVector(keyboard,gamepad){
 const keyLength=Math.hypot(...keyboard);
 if(keyLength)return keyboard.map(v=>v/keyLength);
 const scale=Math.max(1,Math.hypot(...gamepad));return gamepad.map(v=>v/scale);
}
export class GamepadInput {
 constructor(read=()=>globalThis.navigator?.getGamepads?.()??null){
  this.read=read;this.identity=null;this.device=null;this.status='Gamepad? Connect a controller, then press a button.';this.suspend();
 }
 suspend(){this.vector=zero();this.needsNeutral=true;this.buttonsArmed=false;this.previousButtons=[];this.actions=[];}
 poll(enabled=true,buttonsEnabled=enabled){
  this.actions=[];
  let devices;
  try{devices=this.read();}catch{devices=null;}
  if(devices===null){this.identity=null;this.device=null;this.suspend();this.status='Gamepad unavailable in this browser.';return this.vector;}
  const connected=Array.from(devices).filter(p=>p?.connected);
  const supported=connected.filter(p=>p.mapping==='standard'&&p.axes.length>=4);
  const identity=p=>`${p.index}:${p.id}`;
  const pad=supported.find(p=>identity(p)===this.identity)||supported[0];
  const reported=pad||connected[0];
  this.device=reported?{id:reported.id,mapping:reported.mapping,axes:Array.from(reported.axes),buttons:Array.from(reported.buttons||[],b=>({pressed:!!b.pressed,touched:!!b.touched,value:Number.isFinite(b.value)?b.value:0}))}:null;
  if(!pad){
   this.identity=null;this.suspend();
   this.status=connected.length?'Gamepad detected; its stick layout is not supported yet.':'Gamepad? Connect a controller, then press a button.';
   return this.vector;
  }
  if(identity(pad)!==this.identity){this.identity=identity(pad);this.suspend();}
  const [lx,ly]=stickVector(pad.axes[0],pad.axes[1]),[rx,ry]=stickVector(pad.axes[2],pad.axes[3]);
  const vector=[-ly||0,lx||0,-ry||0,rx||0];
  if(!enabled){this.vector=zero();this.needsNeutral=true;}
  else{
   if(!Math.hypot(...vector))this.needsNeutral=false;
   this.vector=this.needsNeutral?zero():vector;
  }
  const pressed=this.device.buttons.map((b,i)=>i===6||i===7?b.value>=(this.previousButtons[i] ? .4 : .6):b.pressed||b.value>=.5);
  if(!buttonsEnabled)this.buttonsArmed=false;
  else if(!this.buttonsArmed){if(!pressed.some(Boolean))this.buttonsArmed=true;}
  else pressed.forEach((down,i)=>{if(down&&!this.previousButtons[i]&&BUTTON_COMMANDS[i])this.actions.push(BUTTON_COMMANDS[i]);});
  this.previousButtons=pressed;
  this.status=pad.id;
  return this.vector;
 }
}
