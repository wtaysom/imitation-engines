// Relative dragging uses the same normalized coordinate as the full slider.
export class PatchControl {
 constructor(element,{read,write,begin=()=>{}}){
  this.element=element;this.read=read;this.write=write;this.begin=begin;this.drag=null;
  element.addEventListener('pointerdown',event=>{
   if(event.button!==0||this.drag)return;
   event.preventDefault();element.focus({preventScroll:true});begin();
   this.drag={pointerId:event.pointerId,x:event.clientX,y:event.clientY,start:read(),moved:false};
   try{element.setPointerCapture(event.pointerId);}catch{}
  });
  element.addEventListener('pointermove',event=>this.move(event));
  element.addEventListener('pointerup',event=>{
   if(this.drag?.pointerId!==event.pointerId)return;
   this.move(event);this.cancel();
  });
  for(const name of ['pointercancel','lostpointercapture'])element.addEventListener(name,event=>{
   if(this.drag?.pointerId===event.pointerId)this.cancel();
  });
  element.addEventListener('keydown',event=>{
   if(event.altKey||event.metaKey||event.ctrlKey)return;
   const steps={ArrowUp:.005,ArrowRight:.005,ArrowDown:-.005,ArrowLeft:-.005,PageUp:.05,PageDown:-.05};
   if(!(event.key in steps)&&event.key!=='Home'&&event.key!=='End')return;
   event.preventDefault();event.stopPropagation();this.cancel();begin();
   this.set(event.key==='Home'?0:event.key==='End'?1:read()+steps[event.key]);
  });
 }
 set(value){this.write(Math.max(0,Math.min(1,value)));}
 move(event){
  const drag=this.drag;if(!drag||drag.pointerId!==event.pointerId)return;
  const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
  if(!drag.moved&&Math.hypot(dx,dy)<3)return;
  drag.moved=true;this.set(drag.start+(dx-dy)/240);
 }
 cancel(){
  const drag=this.drag;this.drag=null;
  if(drag&&this.element.hasPointerCapture(drag.pointerId))this.element.releasePointerCapture(drag.pointerId);
 }
}
