import { clamp } from './parameters.js';

// Each physical update is identical, independent of display refresh rate.
export class SimulationClock {
 constructor({rate=60,maxSteps=8}={}){this.rate=rate;this.maxSteps=maxSteps;this.speed=1;this.remainder=0;}
 setSpeed(speed){this.speed=clamp(speed,.125,4);return this.speed;}
 adjust(direction,seconds){return this.setSpeed(this.speed*2**(direction*seconds));}
 reset(){this.remainder=0;}
 advance(seconds,paused=false){
  if(paused||!Number.isFinite(seconds)||seconds<0||seconds>.5){this.reset();return 0;}
  this.remainder+=seconds*this.rate*this.speed;
  const due=Math.floor(this.remainder+1e-9);
  this.remainder=Math.max(0,this.remainder-due);
  // Shed excessive debt after a stall instead of bursting hundreds of GPU steps.
  return Math.min(due,this.maxSteps);
 }
}
