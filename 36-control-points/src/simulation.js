// Particle and trail algorithm: Sage Jenson, 36 Points, CC BY-NC-SA 3.0.
// Host adapted for explicit stepping and repeatable snapshot experiments.
import * as S from './shaders.js';
import { trailFeatures } from './analysis.js';
import { ColorRenderer } from './color-renderer.js?v=particle-colors-2';

const sampleFrag=`#version 300 es
precision highp float;
in vec2 vTexCoord; uniform sampler2D field; out vec4 color;
void main(){float a=0.;for(int y=0;y<8;y++)for(int x=0;x<8;x++){
vec2 d=(vec2(float(x),float(y))+0.5)/8.-0.5;
a+=texture(field,vTexCoord+d/32.).r;}color=vec4(a/64.,0.,0.,1.);}`;

export class Simulation {
 constructor(canvas,{size=256,density=2.7,renderSize=768,seed=36,debug=false}={}){
  this.canvas=canvas;this.size=size;this.count=Math.floor(size*size*density);this.renderSize=renderSize;this.debug=debug;
  canvas.width=canvas.height=renderSize;
  const gl=this.gl=canvas.getContext('webgl2',{antialias:false,preserveDrawingBuffer:true});
  if(!gl)throw new Error('This experiment needs WebGL2. Try Chrome on this Mac.');
  if(!gl.getExtension('EXT_color_buffer_float')||!gl.getExtension('EXT_float_blend'))throw new Error('Floating-point WebGL blending is unavailable. Try Chrome with graphics acceleration enabled.');
  if(!gl.getExtension('OES_texture_float_linear'))throw new Error('Floating-point texture filtering is unavailable in this browser.');
  this.resources={textures:[],buffers:[],vaos:[],programs:[]};this.colorMode=-1;
  this.update=this.program(S.particleUpdateVert,S.passthroughFrag,['v_P','v_A','v_T']);
  this.points=this.program(S.particleRenderVert,S.particleRenderFrag);
  this.blur=this.program(S.vsSource,S.blurFrag);
  this.fade=this.program(S.vsSource,S.clearScreenFrag);
  this.show=this.program(S.vsSource,S.drawScreenFrag);
  this.sample=this.program(S.vsSource,sampleFrag);
  this.buffers=[this.buffer(),this.buffer()];
  this.updateVAOs=this.buffers.map(b=>this.particleVAO(b,this.update));
  this.pointVAOs=this.buffers.map(b=>this.particleVAO(b,this.points));
  this.quads=new Map([this.blur,this.fade,this.show,this.sample].map(p=>[p,this.quadVAO(p)]));
  this.fbo=gl.createFramebuffer();
  this.trails=[this.texture(size),this.texture(size)];
  this.screen=this.texture(renderSize,false);
  this.featureTex=this.texture(32);
  this.reset(seed);
  this.checkError('initialization');
 }
 program(vs,fs,varyings){
  const gl=this.gl,p=gl.createProgram(),shaders=[];
  for(const [type,source] of [[gl.VERTEX_SHADER,vs],[gl.FRAGMENT_SHADER,fs]]){
   const sh=gl.createShader(type);gl.shaderSource(sh,source);gl.compileShader(sh);
   if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(sh));
   gl.attachShader(p,sh);shaders.push(sh);
  }
  if(varyings)gl.transformFeedbackVaryings(p,varyings,gl.INTERLEAVED_ATTRIBS);
  gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));
  shaders.forEach(s=>gl.deleteShader(s));
  p.uniforms=new Map();
  for(let i=0;i<gl.getProgramParameter(p,gl.ACTIVE_UNIFORMS);i++){
   const u=gl.getActiveUniform(p,i),name=u.name.replace(/\[0\]$/,'');p.uniforms.set(name,{loc:gl.getUniformLocation(p,u.name),size:u.size});
  }
  this.resources.programs.push(p);return p;
 }
 u(p,name){return p.uniforms.get(name)?.loc??null;}
 values(p,values){const u=p.uniforms.get('v');if(u)this.gl.uniform1fv(u.loc,values.slice(0,u.size));}
 buffer(){const b=this.gl.createBuffer();this.resources.buffers.push(b);return b;}
 vao(){const a=this.gl.createVertexArray();this.resources.vaos.push(a);return a;}
 particleVAO(buffer,p){
  const gl=this.gl,a=this.vao();gl.bindVertexArray(a);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  for(const [name,n,offset] of [['i_P',2,0],['i_A',1,8],['i_T',1,12]]){const loc=gl.getAttribLocation(p,name);if(loc>=0){gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,n,gl.FLOAT,false,16,offset);}}
  gl.bindVertexArray(null);return a;
 }
 quadVAO(p){
  const gl=this.gl,a=this.vao(),b=this.buffer();gl.bindVertexArray(a);gl.bindBuffer(gl.ARRAY_BUFFER,b);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,0,0, 1,-1,1,0, -1,1,0,1, 1,1,1,1]),gl.STATIC_DRAW);
  for(const [name,offset] of [['aVertexPosition',0],['aTexCoord',8]]){const loc=gl.getAttribLocation(p,name);if(loc>=0){gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,16,offset);}}
  gl.bindVertexArray(null);return a;
 }
 texture(size,float=true){
  const gl=this.gl,t=gl.createTexture();this.resources.textures.push(t);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,t);
  gl.texImage2D(gl.TEXTURE_2D,0,float?gl.RGBA32F:gl.RGBA8,size,size,0,gl.RGBA,float?gl.FLOAT:gl.UNSIGNED_BYTE,null);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.REPEAT);
  this.target(t,size);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw new Error('WebGL framebuffer is incomplete.');
  return t;
 }
 target(t,size){const gl=this.gl;gl.bindFramebuffer(gl.FRAMEBUFFER,this.fbo);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,t,0);gl.viewport(0,0,size,size);}
 sampler(p,name,t,unit=0){const gl=this.gl;gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,t);gl.uniform1i(this.u(p,name),unit);}
 quad(p){this.gl.bindVertexArray(this.quads.get(p));this.gl.drawArrays(this.gl.TRIANGLE_STRIP,0,4);}
 reset(seed=36){
  const gl=this.gl;let state=seed>>>0;const rand=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
  const data=new Float32Array(this.count*4);
  for(let i=0;i<this.count;i++){data[4*i]=rand()*2-1;data[4*i+1]=rand()*2-1;data[4*i+2]=i/this.count;data[4*i+3]=rand()*Math.PI*2;}
  for(const b of this.buffers){gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,data,gl.DYNAMIC_COPY);}
  gl.disable(gl.BLEND);gl.clearColor(0,0,0,0);
  for(const t of this.trails){this.target(t,this.size);gl.clear(gl.COLOR_BUFFER_BIT);}
  this.target(this.screen,this.renderSize);gl.clear(gl.COLOR_BUFFER_BIT);this.read=0;this.trailRead=0;this.frame=0;
  this.colors?.reset();
 }
 step(values){
  const gl=this.gl,p=this.update;gl.useProgram(p);this.values(p,values);
  this.sampler(p,'u_trail',this.trails[this.trailRead]);gl.uniform2f(this.u(p,'i_dim'),this.size,this.size);
  gl.uniform1i(this.u(p,'pen'),0);gl.uniform1i(this.u(p,'frame'),this.frame++);
  // Bind the default framebuffer: the sampled trail must not also be attached.
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.bindBuffer(gl.ARRAY_BUFFER,null);gl.bindVertexArray(this.updateVAOs[this.read]);
  gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER,0,this.buffers[1-this.read]);gl.enable(gl.RASTERIZER_DISCARD);
  gl.beginTransformFeedback(gl.POINTS);gl.drawArrays(gl.POINTS,0,this.count);gl.endTransformFeedback();gl.disable(gl.RASTERIZER_DISCARD);
  gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER,0,null);this.read=1-this.read;
  this.checkError('particle transform');
  this.target(this.trails[this.trailRead],this.size);gl.useProgram(this.points);this.values(this.points,values);
  gl.uniform1i(this.u(this.points,'deposit'),1);gl.uniform1f(this.u(this.points,'pointsize'),1);gl.uniform1f(this.u(this.points,'dotSize'),values[19]);
  gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.bindVertexArray(this.pointVAOs[this.read]);gl.drawArrays(gl.POINTS,0,this.count);
  this.checkError('particle deposit');
  gl.disable(gl.BLEND);gl.useProgram(this.blur);this.values(this.blur,values);gl.uniform2f(this.u(this.blur,'uTextureSize'),this.size,this.size);
  for(let i=0;i<Math.round(values[16]);i++){
   this.target(this.trails[1-this.trailRead],this.size);this.sampler(this.blur,'uUpdateTex',this.trails[this.trailRead]);this.quad(this.blur);this.trailRead=1-this.trailRead;
  }
  this.checkError('trail diffusion');
 }
 draw(values){
  const gl=this.gl;this.target(this.screen,this.renderSize);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  gl.useProgram(this.fade);this.values(this.fade,values);this.quad(this.fade);
  this.checkError('screen fade');
  gl.useProgram(this.points);this.values(this.points,values);gl.uniform1i(this.u(this.points,'deposit'),0);
  gl.uniform1f(this.u(this.points,'pointsize'),1);gl.uniform1f(this.u(this.points,'dotSize'),values[19]);
  gl.bindVertexArray(this.pointVAOs[this.read]);gl.drawArrays(gl.POINTS,0,this.count);
  this.checkError('screen particles');
  // Tint the completed Sage image at its display resolution. Probes never draw.
  this.colors??=new ColorRenderer(this);this.colors.update();
 }
 present(invert=false,tiled=false){
  const texture=this.colorMode<0?this.screen:this.colors?.render(this.colorMode)??this.screen;
  const gl=this.gl;gl.disable(gl.BLEND);gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  gl.useProgram(this.show);this.sampler(this.show,'uDrawTex',texture);gl.uniform1i(this.u(this.show,'invert'),invert&&this.colorMode<0?1:0);
  const w=this.canvas.width,h=this.canvas.height;
  if(tiled){
   const landscape=w>=h,side=landscape?Math.max(h,Math.ceil(w/2)):Math.max(w,Math.ceil(h/2));
   for(let i=0;i<2;i++){gl.viewport(landscape?i*side:0,landscape?0:i*side,side,side);this.quad(this.show);}
  }else{gl.viewport(0,0,w,h);this.quad(this.show);}
  this.checkError('screen presentation');
 }
 render(values,invert=false){this.draw(values);this.present(invert);}
 setColorMode(mode){
  if(!Number.isInteger(mode)||mode< -1||mode>9)throw new RangeError('Unknown color mode');
  this.colorMode=mode;
 }
 snapshot(){
  const gl=this.gl,particles=new Float32Array(this.count*4),trail=new Float32Array(this.size*this.size*4);
  gl.bindBuffer(gl.ARRAY_BUFFER,this.buffers[this.read]);gl.getBufferSubData(gl.ARRAY_BUFFER,0,particles);
  this.target(this.trails[this.trailRead],this.size);gl.readPixels(0,0,this.size,this.size,gl.RGBA,gl.FLOAT,trail);
  return {particles,trail,frame:this.frame,size:this.size,count:this.count};
 }
 restore(s){
  if(s.size!==this.size||s.count!==this.count)throw new Error('Snapshot resolution mismatch');
  const gl=this.gl;for(const b of this.buffers){gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferSubData(gl.ARRAY_BUFFER,0,s.particles);}
  gl.activeTexture(gl.TEXTURE0);for(const t of this.trails){gl.bindTexture(gl.TEXTURE_2D,t);gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,this.size,this.size,gl.RGBA,gl.FLOAT,s.trail);}
  this.read=this.trailRead=0;this.frame=s.frame;
  this.colors?.reset();
 }
 features(){
  const gl=this.gl;this.target(this.featureTex,32);gl.disable(gl.BLEND);gl.useProgram(this.sample);this.sampler(this.sample,'field',this.trails[this.trailRead]);this.quad(this.sample);
  const pixels=new Float32Array(32*32*4);gl.readPixels(0,0,32,32,gl.RGBA,gl.FLOAT,pixels);return trailFeatures(pixels,32);
 }
 error(){return this.gl.getError();}
 checkError(stage){if(this.debug){const error=this.error();if(error)throw new Error(`${stage}: WebGL error ${error}`);}}
 dispose(){const gl=this.gl;this.resources.textures.forEach(x=>gl.deleteTexture(x));this.resources.buffers.forEach(x=>gl.deleteBuffer(x));this.resources.vaos.forEach(x=>gl.deleteVertexArray(x));this.resources.programs.forEach(x=>gl.deleteProgram(x));gl.deleteFramebuffer(this.fbo);}
}
