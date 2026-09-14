import { PARAMETERS } from './parameters.js';

// Optional browser-native agent access. Ordinary browsers need no polyfill.
export function registerExperimentTools({read,set}) {
 const context=document.modelContext;
 if(!context?.registerTool)return;
 const lifecycle=new AbortController();
 const tools=[{
  name:'read_physarum_parameters',description:'Read all twenty controls and the current four-dimensional coordinate.',
  inputSchema:{type:'object',properties:{},additionalProperties:false},
  annotations:{readOnlyHint:true},execute:()=>read(),
 },{
  name:'set_physarum_parameters',description:'Manually change controls by zero-based index. Applies persistent additive offsets to the existing map, preserving the current coordinates, just like editing controls on screen.',
  inputSchema:{type:'object',properties:{changes:{type:'array',minItems:1,maxItems:20,items:{type:'object',properties:{index:{type:'integer',minimum:0,maximum:19},value:{type:'number'}},required:['index','value'],additionalProperties:false}}},required:['changes'],additionalProperties:false},
  annotations:{readOnlyHint:false},execute(input){
   if(!input||!Array.isArray(input.changes)||!input.changes.length||input.changes.length>20)throw new Error('Provide 1–20 parameter changes.');
   for(const change of input.changes){
    const p=PARAMETERS[change?.index];
    if(!Number.isInteger(change?.index)||!p||!Number.isFinite(change.value)||change.value<p.min||change.value>p.max||(change.index===16&&!Number.isInteger(change.value)))throw new Error('Invalid parameter index or value; blur passes must be an integer.');
   }
   set(input.changes);return read();
  },
 }];
 for(const tool of tools){try{Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(error=>console.warn('Optional WebMCP registration failed',error));}catch(error){console.warn('Optional WebMCP registration failed',error);}}
 window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}
