import { Simulation } from './simulation.js?v=particle-colors-2';
import { COLOR_MODES } from './colors.js?v=header-colors';
import { PRESETS } from './presets.js';
import { PARAMETERS, encode, normalize } from './parameters.js?v=patch-names';
import { PARAMETER_LEGEND, parameterColor, parameterInk } from './parameter-legend.js?v=patch-names';
import { ParameterMap, clipToBall } from './map.js';
import { ProbeRunner } from './probes.js?v=manual-offsets';
import { ParameterOffsets } from './offsets.js';
import { TravelInput, AXES, TRAVEL_KEYS, CONTROL_KEYS } from './input.js';
import { SimulationClock } from './clock.js';
import { alignDirections } from './analysis.js';
import { registerExperimentTools } from './webmcp.js?v=manual-offsets';
import { CoordinateGrids } from './coordinate-grids.js?v=influence-cross';
import { mapInfluences } from './map-influences.js';
import { GridTravel } from './grid-travel.js?v=gamepad';
import { GamepadInput, travelVector } from './gamepad.js?v=gamepad-question';
import { PatchControl } from './patch-control.js';
import { PopupSelect } from './popup-select.js?v=header-colors-2';

const $=id=>document.getElementById(id);
const input=new TravelInput(),clock=new SimulationClock(),gamepad=new GamepadInput();
const offsets=new ParameterOffsets(),gridTravel=new GridTravel();
let colorMode=-1,minimalActiveUntil=0;
let lastMapPosition=[0,0,0,0];
const state={values:[...PRESETS[6].values],preset:6,position:[0,0,0,0],paused:false,speed:.025,simulationSpeed:1,horizon:12,size:256,seed:36,latest:null,lastDirections:null,lastProbeAt:0,warmup:60,probeCount:0,status:'Growing the initial pattern…',fps:0};
let sim,probeSim,probes,map,coordinateGrids;
const fields=[],popups=new Map(),legendPatches=new Map(),patchControls=[];
const releaseInput=()=>{input.clear();gamepad.suspend();gridTravel.releaseTargets();coordinateGrids?.cancelDrawing();};
const clearTravel=()=>{releaseInput();gridTravel.clear();};
const format=v=>Number(v.toPrecision(6)).toString();
const editable=target=>!!target?.closest?.('input,select,textarea,[contenteditable="true"],[role="combobox"][aria-expanded="true"],.parameter-patch');
const invert=()=>state.preset===27||state.preset===36;

function fail(error){
 console.error(error);$('error').hidden=false;$('error').textContent=error.message;
 state.paused=true;state.status='Experiment stopped — see error';clearTravel();clock.reset();
}
function restartMap(){
 patchControls.forEach(control=>control.cancel());
 if(!$('error').hidden){$('error').hidden=true;state.paused=false;}
 map=new ParameterMap(state.values);state.position=[0,0,0,0];state.latest=null;state.lastDirections=null;state.lastProbeAt=0;
 offsets.clear();
 coordinateGrids?.reset();
 probes?.cancel();state.status='Learning four directions…';state.warmup=Math.min(state.warmup,12);clearTravel();
}
function resize(){
 // Two adjacent squares, cropped to fill the viewport, as in the original.
 const density=Math.min(window.devicePixelRatio||1,1.5),canvas=$('simulation');
 canvas.width=Math.round(window.innerWidth*density);canvas.height=Math.round(window.innerHeight*density);
 sim?.present(invert(),true);
}
function createSimulations(){
 sim?.dispose();probeSim?.dispose();
 sim=new Simulation($('simulation'),{size:state.size,renderSize:1080,seed:state.seed});
 $('particle-count').textContent=`${sim.count.toLocaleString()} particles`;
 sim.setColorMode(colorMode);
 probeSim=new Simulation(document.createElement('canvas'),{size:state.size,renderSize:32,seed:state.seed});
 probes=new ProbeRunner(probeSim);restartMap();state.warmup=60;clock.reset();resize();
}
function applyManual(index,value){
 const mapped=map.at(state.position);if(!offsets.set(index,value,mapped))return;
 clearTravel();
 state.values=offsets.apply(mapped);
 // Measurements made with an earlier offset are no longer applicable. Stored
 // shells, axis frames, and the current coordinate remain untouched.
 probes.cancel();state.latest=null;state.lastProbeAt=0;refreshParameters(true);
}
function sliderPosition(i,v){const p=PARAMETERS[i];return p.log?Math.log1p(v/p.scale)/Math.log1p(p.max/p.scale):(v-p.min)/(p.max-p.min);}
function sliderValue(i,v){const p=PARAMETERS[i];return p.log?p.scale*Math.expm1(v*Math.log1p(p.max/p.scale)):p.min+v*(p.max-p.min);}
function toggleControls(){
 const expanded=$('gui').hidden||$('expandableContent').hidden;
 $('expandableContent').hidden=!expanded;$('toggleGui-label').textContent=expanded?'Details ▲':'Details ▼';
 $('toggleGui').setAttribute('aria-expanded',String(expanded));
 if(expanded)setInfoHidden(false);
}
function setInfoHidden(hidden){
 minimalActiveUntil=performance.now()+1500;$('minimal-controls').classList.remove('idle');
 $('gui').hidden=hidden;$('show-gui').hidden=!hidden;$('minimal-controls').hidden=!hidden;
 if(hidden)$('minimal-controls').append($('coordinates'));
 else document.querySelector('.map-heading').after($('coordinates'));
 releaseInput();
}
function toggleInfo(){setInfoHidden(!$('gui').hidden);}
function setSimulationSpeed(value){
 state.simulationSpeed=clock.setSpeed(value);
 $('simulation-speed-value').textContent=`${clock.speed.toFixed(2)}×`;
}
function setPaused(paused){
 if(state.paused===paused)return;
 state.paused=paused;releaseInput();clock.reset();
}
function resetSimulation(){sim.reset(++state.seed);restartMap();state.warmup=60;clock.reset();}
function selectPreset(){
 state.preset=+$('preset').value;state.values=[...PRESETS[state.preset].values];sim.reset(++state.seed);
 restartMap();state.warmup=60;clock.reset();refreshParameters(true);
 popups.get('preset')?.sync();$('preset').blur();
}
function selectColor(){
 colorMode=+$('colors').value;sim.setColorMode(colorMode);sim.present(invert(),true);popups.get('colors')?.sync();$('colors').blur();
}
// Clicks share keyboard commands; directional clicks schedule a finite trip.
function runCommand(code){
 switch(code){
  case 'KeyL':resetSimulation();break;
  case 'KeyM':restartMap();break;
  case 'TogglePause':setPaused(!state.paused);break;
  case 'KeyQ':case 'KeyE':setSimulationSpeed(clock.speed*2**((code==='KeyE'?1:-1)*.25));break;
  case 'KeyR':setPaused(true);break;
  case 'KeyT':setPaused(false);break;
  case 'KeyO':case 'KeyP':
   $('preset').value=(state.preset+(code==='KeyP'?1:-1)+PRESETS.length)%PRESETS.length;selectPreset();break;
  case 'KeyJ':case 'KeyK':{
   const index=COLOR_MODES.findIndex(mode=>mode.id===colorMode);
   $('colors').value=COLOR_MODES[(index+(code==='KeyK'?1:-1)+COLOR_MODES.length)%COLOR_MODES.length].id;selectColor();break;
  }
  case 'KeyG':toggleControls();break;
  case 'KeyH':toggleInfo();break;
  case 'Space':{
   const action=document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen?.();
   action?.catch(()=>{state.status='Fullscreen is unavailable in this browser view.';});break;
  }
  default:return false;
 }
 return true;
}
function clickKey(code){
 coordinateGrids.cancelDrawing();
 const axis=AXES.findIndex(({positive,negative})=>code===positive||code===negative);
 if(axis!==-1){
  if(state.paused)return;
  input.clear();gamepad.suspend();
  const grid=Math.floor(axis/2),target=gridTravel.targets[grid]?[...gridTravel.targets[grid]]:[state.position[grid*2+1],state.position[grid*2]];
  target[axis%2===0?1:0]+=(code===AXES[axis].positive?1:-1)*.01;
  gridTravel.set(grid,...target);coordinateGrids.update(state.position,input.vector,gridTravel.targets,gridTravel.paths);
 }else if(code==='KeyQ'||code==='KeyE'){
  setSimulationSpeed(clock.speed*2**((code==='KeyE'?1:-1)*.25));
 }else runCommand(code);
}
function makeControls(){
 for(const entry of PARAMETER_LEGEND){
  const p=PARAMETERS[entry.index];if(!p?.active)continue;
  const patch=document.createElement('span');patch.className='parameter-patch';patch.dataset.parameter=entry.index;
  patch.style.setProperty('--parameter-color',parameterColor(entry,p,state.values[entry.index]));legendPatches.set(entry.index,patch);
  patch.setAttribute('aria-label',`${p.name}: ${entry.description}`);patch.setAttribute('role','slider');patch.tabIndex=0;
  patch.setAttribute('aria-valuemin',p.min);patch.setAttribute('aria-valuemax',p.max);
  patch.setAttribute('aria-description','Drag up or right to increase; down or left to decrease. Arrow keys also adjust the value.');
  patchControls.push(new PatchControl(patch,{read:()=>sliderPosition(entry.index,state.values[entry.index]),write:q=>applyManual(entry.index,sliderValue(entry.index,q)),begin:clearTravel}));
  const label=document.createElement('span'),part=document.createElement('small');
  label.textContent=entry.label;part.textContent=entry.part;patch.append(label,part);$('parameter-legend').append(patch);
 }

 $('active-parameter-count').textContent=PARAMETERS.filter(p=>p.active).length;
 coordinateGrids=new CoordinateGrids($('coordinates'),(grid,x,y)=>{
  input.clear();gamepad.suspend();gridTravel.set(grid,x,y);coordinateGrids.update(state.position,input.vector,gridTravel.targets,gridTravel.paths);
 },(grid,points,closed)=>{
  input.clear();gamepad.suspend();gridTravel.setPath(grid,points,closed);coordinateGrids.update(state.position,input.vector,gridTravel.targets,gridTravel.paths);
 },grid=>{input.clear();gamepad.suspend();gridTravel.cancel(grid);});
 COLOR_MODES.forEach(({id,name})=>{const o=document.createElement('option');o.value=id;o.textContent=name;$('colors').append(o);});
 $('colors').value=colorMode;
 $('colors').onchange=selectColor;
 PRESETS.forEach((p,i)=>{const o=document.createElement('option');o.value=i;o.textContent=`${String(i+1).padStart(2,'0')} — ${p.name.replaceAll('_',' ')}`;$('preset').append(o);});$('preset').value=state.preset;
 const manualRows=[];
 PARAMETERS.forEach((p,i)=>{
  const row=document.createElement('div');row.className='param';
  const legend=PARAMETER_LEGEND.find(entry=>entry.index===i);
  if(legend)row.style.setProperty('--parameter-color',parameterColor(legend,p,state.values[i]));
  row.innerHTML=`<div class="param-top"><label for="p${i}">${p.name}</label>${p.active?`<span class="weights" id="weight${i}" aria-label="${p.name} measured direction weights"></span>`:''}</div><div class="param-value-row"><div class="parameter-slider"><span id="mapped${i}" class="mapped-dot" hidden aria-hidden="true"></span><input id="p${i}" type="range" min="0" max="1000" step="1" aria-label="${p.name}"></div><input id="n${i}" type="number" aria-label="${p.name} value" min="${p.min}" max="${p.max}" step="${p.step}"></div>`;
  $('parameters').append(row);if(!p.active)manualRows.push(row);
  const slider=$(`p${i}`),number=$(`n${i}`),weight=$(`weight${i}`);
  slider.addEventListener('input',()=>applyManual(i,sliderValue(i,+slider.value/1000)));
  number.addEventListener('change',()=>applyManual(i,number.valueAsNumber));fields.push({row,legend,patch:legendPatches.get(i),slider,number,weight,marker:$(`mapped${i}`)});
 });
 $('parameters').prepend(...manualRows);
 $('preset').onchange=selectPreset;
 $('speed').oninput=()=>{state.speed=+$('speed').value;$('speed-value').textContent=`${state.speed.toFixed(3)} / s`;};
 $('horizon').oninput=()=>{state.horizon=+$('horizon').value;$('horizon-value').textContent=`${state.horizon} steps`;probes.cancel();state.latest=null;state.lastProbeAt=0;};
 $('quality').onchange=()=>{state.size=+$('quality').value;try{createSimulations();}catch(e){fail(e);}$('quality').blur();};
 document.querySelectorAll('button[data-key]').forEach(button=>button.addEventListener('click',()=>{
  // Safari does not focus buttons on pointer clicks; leave any edited field.
  button.focus({preventScroll:true});clickKey(button.dataset.key);
 }));
 for(const id of ['preset','colors','quality'])popups.set(id,new PopupSelect($(id),()=>{releaseInput();for(const popup of popups.values())popup.close();}));
 window.addEventListener('keydown',e=>{
  if(e.metaKey||e.ctrlKey||e.altKey)return;
  if(editable(e.target)){releaseInput();return;}
  if(CONTROL_KEYS.includes(e.code)){
   if(TRAVEL_KEYS.includes(e.code)){gridTravel.clear();coordinateGrids.cancelDrawing();}
   const wasHeld=input.keys.has(e.code);input.key(e.code,true);e.preventDefault();
   if(!wasHeld&&['KeyQ','KeyE'].includes(e.code)&&input.speedDirection)setSimulationSpeed(clock.speed*2**(input.speedDirection*.25));
  }else if(!e.repeat){
   // Space on a focused button activates that button through its native click.
   if(e.code==='Space'&&e.target.closest?.('button'))return;
   if(runCommand(e.code))e.preventDefault();
  }
 });
 window.addEventListener('keyup',e=>input.key(e.code,false));window.addEventListener('blur',()=>{patchControls.forEach(control=>control.cancel());releaseInput();clock.reset();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){patchControls.forEach(control=>control.cancel());releaseInput();clock.reset();}});
 document.addEventListener('focusin',e=>{if(editable(e.target))releaseInput();});
 $('simulation').addEventListener('pointerdown',()=>$('simulation').focus());window.addEventListener('resize',resize);
}
function refreshMinimalControls(now){
 const moving=state.position.some((value,i)=>value!==lastMapPosition[i]);
 const navigating=!state.paused&&(Math.hypot(...input.vector,...gamepad.vector)>0||gridTravel.targets.some(Boolean));
 if(moving||navigating||coordinateGrids.drawings.some(Boolean))minimalActiveUntil=now+1500;
 lastMapPosition=[...state.position];
 $('minimal-controls').classList.toggle('idle',now>=minimalActiveUntil);
}
function refreshGamepad(){
 $('gamepad-guide').hidden=!gamepad.device||gamepad.device.mapping!=='standard'||gamepad.device.axes.length<4;

}
function refreshInfluences(){
 const influences=mapInfluences(map,state.position,offsets.values,state.latest?.directions);
 const colors=PARAMETERS.map((p,i)=>{const entry=fields[i]?.legend;return entry?parameterColor(entry,p,state.values[i]):'#777';});
 coordinateGrids.setInfluences(influences,colors,PARAMETERS.map(p=>p.name));
}
function refreshParameters(force=false){
 const mapped=map.at(state.position);
 fields.forEach((f,i)=>{
  if(f.legend){
   const color=parameterColor(f.legend,PARAMETERS[i],state.values[i]);
   f.row.style.setProperty('--parameter-color',color);f.patch.style.setProperty('--parameter-color',color);
   f.patch.style.setProperty('--parameter-ink',parameterInk(color));
   f.patch.setAttribute('aria-valuenow',state.values[i]);f.patch.setAttribute('aria-valuetext',format(state.values[i]));
  }
  if(force||document.activeElement!==f.slider)f.slider.value=Math.round(sliderPosition(i,state.values[i])*1000);
  if(force||document.activeElement!==f.number)f.number.value=format(state.values[i]);
  const q=sliderPosition(i,mapped[i]);f.marker.hidden=offsets.values[i]===0;
  f.marker.style.left=`calc(${q*100}% + ${7-14*q}px)`;
  const detail=`Mapped ${format(mapped[i])}; actual ${format(state.values[i])}; offset ${format(offsets.values[i])}`;
  f.slider.setAttribute('aria-valuetext',detail);
  if(f.weight)f.weight.textContent=state.lastDirections?state.lastDirections.map(d=>{const v=d[i]||0;return `${v>=0?'+':''}${v.toFixed(2)}`;}).join('  '):'—  —  —  —';
 });
}
function compatible(result){return result?.rank>0&&!result.used&&Math.hypot(...encode(map.at(state.position)).map((v,i)=>v-result.q[i]))<.09;}
function move(dt){
 if(state.paused||!dt||editable(document.activeElement))return false;
 gridTravel.settle(state.position);
 const velocity=travelVector(input.vector,gamepad.vector),norm=Math.hypot(...velocity);
 const delta=norm?velocity.map(v=>v*state.speed*dt):gridTravel.delta(state.position,state.speed*dt);
 if(!Math.hypot(...delta))return false;
 if(!map.ready){
  if(!compatible(state.latest))return true;
  map.initialize(state.latest.directions);state.latest.used=true;
 }
 const start=[...state.position];
 let next=clipToBall(start,delta,map.radius);
 if(next.limited){
  state.position=next.position;state.values=offsets.apply(map.at(state.position));
  if(compatible(state.latest)){
   const directions=alignDirections(state.latest.directions,map.jacobian(state.position).map(normalize));
   map.extend(directions,state.position);state.latest.used=true;
   next=clipToBall(start,delta,map.radius);
  }else return true;
 }
 state.position=next.position.map(v=>Math.abs(v)<1e-14?0:v);state.values=offsets.apply(map.at(state.position));return next.limited;
}
let last=0,lastUI=0;
function frame(now){
 const elapsed=last?(now-last)/1000:1/60,dt=elapsed>.5?0:elapsed;last=now;
 if(document.hidden||!$('error').hidden){requestAnimationFrame(frame);return;}
 try{
  const editing=editable(document.activeElement);
  if(editing)releaseInput();
  const gamepadEnabled=document.hasFocus()&&!editing&&!coordinateGrids.drawings.some(Boolean);
  gamepad.poll(gamepadEnabled&&!state.paused&&!Math.hypot(...input.vector),gamepadEnabled);
  for(const command of gamepad.actions)runCommand(command);
  if(Math.hypot(...gamepad.vector)){gridTravel.clear();coordinateGrids.cancelDrawing();}
  if(input.speedDirection)setSimulationSpeed(clock.adjust(input.speedDirection,dt));
  const waiting=move(dt),steps=clock.advance(elapsed,state.paused);
  for(let i=0;i<steps;i++){sim.step(state.values);sim.draw(state.values);if(state.warmup>0)state.warmup--;}
  sim.present(invert(),true);
  if(!probes.job&&state.warmup===0&&(now-state.lastProbeAt>1200||waiting)&&(!state.latest||state.latest.used||(waiting&&!compatible(state.latest))||now-state.lastProbeAt>4500)){
   const previous=map.ready?map.jacobian(state.position).map(normalize):state.lastDirections;
   probes.start(sim.snapshot(),map.at(state.position),state.horizon,previous,offsets.values);state.lastProbeAt=now;
  }
  if(probes.job)probes.tick(state.size>=512?1:4);
  if(probes.result){state.latest=probes.result;state.lastDirections=probes.result.directions;state.probeCount=probes.completed;probes.result=null;}
  state.status=state.paused?'Paused':state.warmup>0?'Growing the initial pattern…':waiting?'Frontier · measuring next frame…':probes.job?'Measuring four directions…':state.latest?.rank===0?'No response · try a longer look ahead':map.ready?'Explore / retrace':'Ready · W/S A/D ↑/↓ ←/→';
  state.fps=state.fps*.95+.05/Math.max(.001,elapsed);
  gridTravel.settle(state.position);
  coordinateGrids.update(state.position,travelVector(input.vector,gamepad.vector),gridTravel.targets,gridTravel.paths);
  refreshMinimalControls(now);
  if(now-lastUI>120){
   lastUI=now;refreshParameters();refreshInfluences();
   if($('gamepad-status').textContent!==gamepad.status)$('gamepad-status').textContent=gamepad.status;
   refreshGamepad();
   $('simulation-speed-value').textContent=`${clock.speed.toFixed(2)}×`;
  }
 }catch(e){fail(e);probes?.cancel();}
 requestAnimationFrame(frame);
}
try{makeControls();createSimulations();refreshParameters();requestAnimationFrame(frame);}catch(e){fail(e);}

window.physarum={get state(){return {...state,z:state.position[0],position:[...state.position],values:[...state.values],mappedValues:map.at(state.position),offsets:[...offsets.values],targets:gridTravel.targets.map(t=>t?[...t]:null),paths:gridTravel.paths.map(p=>p?{...p,points:p.points.map(v=>[...v])}:null)};},get map(){return map;},get simulation(){return sim;},get probeSimulation(){return probeSim;},get probes(){return probes;},setParameter:applyManual,newMap:restartMap,input,clock,gamepad};
registerExperimentTools({read:()=>({coordinates:[...state.position],simulationSpeed:clock.speed,status:state.status,parameters:PARAMETERS.map((p,i)=>({index:i,name:p.name,value:state.values[i],mappedValue:map.at(state.position)[i],offset:offsets.values[i],min:p.min,max:p.max,derived:p.active}))}),set:changes=>{for(const {index,value} of changes)applyManual(index,value);}});
