// Keep popup painting in the page instead of opening an unstyled native menu.
export class PopupSelect {
 constructor(select,onOpen){
  this.select=select;this.onOpen=onOpen;this.active=select.selectedIndex;
  const label=document.querySelector(`label[for="${select.id}"]`);
  this.button=document.createElement('button');this.button.type='button';this.button.id=`${select.id}-trigger`;
  this.button.className='popup-trigger';this.button.setAttribute('role','combobox');
  this.button.setAttribute('aria-haspopup','listbox');this.button.setAttribute('aria-expanded','false');
  this.button.innerHTML='<span class="popup-value"></span><span aria-hidden="true">⌄</span>';
  if(label){label.id=`${select.id}-label`;label.htmlFor=this.button.id;this.button.setAttribute('aria-labelledby',label.id);}
  else this.button.setAttribute('aria-label',select.getAttribute('aria-label')||select.id);
  this.menu=document.createElement('div');this.menu.id=`${select.id}-menu`;this.menu.className='popup-menu';
  this.menu.hidden=true;this.menu.setAttribute('role','listbox');
  this.menu.setAttribute('aria-label',label?.textContent||select.getAttribute('aria-label')||select.id);
  this.button.setAttribute('aria-controls',this.menu.id);
  this.options=Array.from(select.options,(option,index)=>{
   const item=document.createElement('div');item.className='popup-option';item.id=`${select.id}-option-${index}`;
   item.setAttribute('role','option');item.textContent=option.textContent;
   item.addEventListener('pointermove',()=>this.highlight(index));
   item.addEventListener('pointerdown',event=>event.preventDefault());
   item.addEventListener('click',()=>this.choose(index));this.menu.append(item);return item;
  });
  select.hidden=true;select.after(this.button);document.body.append(this.menu);
  this.button.addEventListener('click',()=>this.menu.hidden?this.open():this.close());
  this.button.addEventListener('keydown',event=>this.key(event));
  this.button.addEventListener('blur',()=>this.close());
  select.addEventListener('change',()=>this.sync());
  document.addEventListener('pointerdown',event=>{if(!this.button.contains(event.target)&&!this.menu.contains(event.target))this.close();});
  document.addEventListener('scroll',event=>{if(!this.menu.contains(event.target))this.close();},true);
  window.addEventListener('resize',()=>this.close());window.addEventListener('blur',()=>this.close());
  this.sync();
 }
 sync(){
  this.button.querySelector('.popup-value').textContent=this.select.selectedOptions[0]?.textContent||'';
  this.options.forEach((item,i)=>item.setAttribute('aria-selected',String(i===this.select.selectedIndex)));
  this.highlight(this.select.selectedIndex);
 }
 highlight(index){
  this.active=index;this.options.forEach((item,i)=>item.classList.toggle('active',i===index));
  if(!this.menu.hidden&&this.options[index])this.button.setAttribute('aria-activedescendant',this.options[index].id);
 }
 open(){
  // The app closes sibling menus and stops parameter travel before opening.
  this.onOpen?.();this.menu.hidden=false;this.button.setAttribute('aria-expanded','true');
  const box=this.button.getBoundingClientRect(),below=innerHeight-box.bottom-8,above=box.top-8;
  const down=below>=Math.min(300,this.options.length*25)||below>=above;
  const height=Math.max(50,Math.min(300,down?below:above));
  this.menu.style.width=`${box.width}px`;this.menu.style.left=`${Math.max(8,Math.min(box.left,innerWidth-box.width-8))}px`;
  this.menu.style.maxHeight=`${height}px`;this.menu.style.top=down?`${box.bottom+3}px`:'auto';
  this.menu.style.bottom=down?'auto':`${innerHeight-box.top+3}px`;
  this.highlight(this.select.selectedIndex);this.button.focus({preventScroll:true});
  this.options[this.active]?.scrollIntoView({block:'nearest'});
 }
 close(){this.menu.hidden=true;this.button.setAttribute('aria-expanded','false');this.button.removeAttribute('aria-activedescendant');this.search='';}
 choose(index){
  if(index<0||index>=this.options.length)return;
  const changed=this.select.selectedIndex!==index;this.select.selectedIndex=index;this.close();this.sync();
  if(changed)this.select.dispatchEvent(new Event('change',{bubbles:true}));
  this.button.blur();
 }
 key(event){
  if(event.metaKey||event.ctrlKey||event.altKey)return;
  const opened=!this.menu.hidden;
  if(event.key==='Tab'){this.close();return;}
  if(['ArrowDown','ArrowUp','Home','End','Enter',' ','Escape'].includes(event.key)){
   event.preventDefault();event.stopPropagation();
   if(event.repeat&&(event.key==='Enter'||event.key===' '))return;
   if(event.key==='Escape'){this.close();return;}
   if(event.key==='Enter'||event.key===' '){if(opened)this.choose(this.active);else this.open();return;}
   if(!opened)this.open();
   const index=event.key==='Home'?0:event.key==='End'?this.options.length-1:Math.max(0,Math.min(this.options.length-1,this.active+(event.key==='ArrowDown'?1:-1)));
   this.highlight(index);this.options[index]?.scrollIntoView({block:'nearest'});
  }else if(opened&&event.key.length===1){
   event.preventDefault();event.stopPropagation();
   const now=performance.now();this.search=(now-this.typedAt<700?this.search||'':'')+event.key.toLowerCase();this.typedAt=now;
   const index=this.options.findIndex(item=>item.textContent.toLowerCase().startsWith(this.search));
   if(index>=0){this.highlight(index);this.options[index].scrollIntoView({block:'nearest'});}
  }
 }
}
