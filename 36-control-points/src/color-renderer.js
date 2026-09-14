import { vsSource } from './shaders.js';
import { colorFrag } from './colors.js?v=particle-colors-2';

// Follow the full-resolution Sage image with a short exponential delay.
// This field selects hues only; particles never sense it.
const historyFrag=`#version 300 es
precision highp float;precision highp int;
uniform sampler2D marks;uniform sampler2D history;out vec4 color;
void main(){
 ivec2 pixel=ivec2(gl_FragCoord.xy);
 float current=texelFetch(marks,pixel,0).r;
 float previous=texelFetch(history,pixel,0).r;
 color=vec4(mix(previous,current,.1),0.,0.,1.);
}`;

export class ColorRenderer {
 constructor(sim){
  this.sim=sim;this.size=sim.renderSize;
  this.historyProgram=sim.program(vsSource,historyFrag);
  this.colorProgram=sim.program(vsSource,colorFrag);
  for(const p of [this.historyProgram,this.colorProgram])sim.quads.set(p,sim.quadVAO(p));
  this.history=[sim.texture(this.size),sim.texture(this.size)];
  this.image=sim.texture(this.size,false);this.reset();
 }
 reset(){
  const s=this.sim,g=s.gl;g.disable(g.BLEND);g.clearColor(0,0,0,0);
  for(const t of [...this.history,this.image]){s.target(t,this.size);g.clear(g.COLOR_BUFFER_BIT);}
  this.read=0;this.frame=-1;this.dirty=true;
 }
 update(){
  const s=this.sim,g=s.gl;
  this.dirty=true; // Sage's marks may change even without a physical step.
  if(this.frame===s.frame)return; // Repainting a paused frame must not age its colors.
  const p=this.historyProgram;g.disable(g.BLEND);g.useProgram(p);s.target(this.history[1-this.read],this.size);
  s.sampler(p,'history',this.history[this.read]);s.sampler(p,'marks',s.screen,1);s.quad(p);
  this.read=1-this.read;this.frame=s.frame;this.dirty=true;s.checkError('color history');
 }
 render(mode){
  if(!this.dirty&&this.mode===mode)return this.image;
  const s=this.sim,g=s.gl,p=this.colorProgram;g.disable(g.BLEND);g.useProgram(p);s.target(this.image,this.size);
  s.sampler(p,'marks',s.screen);s.sampler(p,'history',this.history[1-this.read],1);
  g.uniform1i(s.u(p,'colorModeType'),mode);s.quad(p);
  this.mode=mode;this.dirty=false;s.checkError('Bleuje colors');return this.image;
 }
}
