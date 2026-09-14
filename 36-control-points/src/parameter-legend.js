// Display order groups each density-dependent triplet vertically.
export const PARAMETER_LEGEND=[
 [0,'Dist','base',150,'Baseline distance ahead at which particles sense trails.'],
 [3,'Angle','base',200,'Baseline angle between the forward and side sensors.'],
 [6,'Turn','base',260,'Baseline angle a particle turns toward a stronger trail.'],
 [9,'Move','base',18,'Baseline distance a particle moves each simulation step.'],
 [1,'Dist','power',170,'Exponent shaping how local trail density changes sensor distance.'],
 [4,'Angle','power',220,'Exponent shaping how local trail density changes sensor angle.'],
 [7,'Turn','power',282,'Exponent shaping how local trail density changes the turning angle.'],
 [10,'Move','power',38,'Exponent shaping how local trail density changes movement distance.'],
 [2,'Dist','scale',190,'Strength of the density-dependent addition to sensor distance.'],
 [5,'Angle','scale',240,'Strength of the density-dependent addition to sensor angle.'],
 [8,'Turn','scale',304,'Strength of the density-dependent addition to the turning angle.'],
 [11,'Move','scale',58,'Strength of the density-dependent addition to movement distance.'],
 [13,'Shift','X',326,'Shifts the density sample along the particle’s heading.'],
 [12,'Shift','Y',346,'Shifts the density sample along the vertical screen axis.'],
 [14,'Trail','add',86,'Amount of trail each particle deposits.'],
 [15,'Trail','decay',116,'Trail retained after each blur pass; higher values fade more slowly.'],
].map(([index,label,part,hue,description])=>({index,label,part,hue,description}));

// Follow slider position, including signed ranges. Saturation stays fixed;
// brightness decreases continuously from the minimum to the maximum.
export function parameterColor(entry,parameter,value){
 const bounded=Math.max(parameter.min,Math.min(parameter.max,Number.isFinite(value)?value:0));
 const position=parameter.log?Math.log1p(bounded/parameter.scale)/Math.log1p(parameter.max/parameter.scale):(bounded-parameter.min)/(parameter.max-parameter.min);
 const amount=parameter.max===parameter.min?0:position;
 return `hsl(${entry.hue} 72% ${(78-46*amount).toFixed(1)}%)`;
}

// Pick whichever label color has greater contrast against the patch.
export function parameterInk(color){
 const [h,s,l]=color.match(/[\d.]+/g).map(Number),light=l/100,a=s/100*Math.min(light,1-light);
 const rgb=[0,8,4].map(n=>{const k=(n+h/30)%12;return light-a*Math.max(-1,Math.min(k-3,9-k,1));});
 const linear=rgb.map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);
 const luminance=linear[0]*.2126+linear[1]*.7152+linear[2]*.0722;
 return luminance>Math.sqrt(1.05*.05)-.05?'#000':'#fff';
}
