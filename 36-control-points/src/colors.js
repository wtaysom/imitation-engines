// Color palettes and blend recipes: Bleuje, CC BY-NC-SA 3.0.
// Adapted to tint Sage’s full-resolution marks, preserving their intensity.
// Ported from bin/data/shaders/computeshader_deposit.glsl.
// Mode labels describe the source recipes; their numbers match the native app.
export const COLOR_MODES = [
 {id:-1,name:'Sage — original monochrome'},
 ...['Purple fire / arctic','Icy blue','Soft purple fire',
 'Gold / teal','Neon inferno','Zorg pink / arctic','Neon / arctic',
 'Experimental gold / blue','Green'].map((name,id)=>({id:id+1,name:`Bleuje ${id+1} — ${name}`}))
];

export const colorFrag = `#version 300 es
precision highp float;
precision highp int;
uniform sampler2D marks;
uniform sampler2D history;
uniform int colorModeType;
out vec4 color;
// Generic gradient interpolation
vec3 interpolateGradient5(float f, const vec3 cols[5]) {
    f = clamp(f, 0.0, 1.0);
    float cur = f * 4.0; // 5 colors => (5-1) = 4
    int icur = int(floor(cur));
    int next = min(icur + 1, 4);
    return mix(cols[icur], cols[next], fract(cur));
}

vec3 interpolateGradient6(float f, const vec3 cols[6]) {
    f = clamp(f, 0.0, 1.0);
    float cur = f * 5.0;
    int icur = int(floor(cur));
    int next = min(icur + 1, 5);
    return mix(cols[icur], cols[next], fract(cur));
}

vec3 interpolateGradient7(float f, const vec3 cols[7]) {
    f = clamp(f, 0.0, 1.0);
    float cur = f * 6.0;
    int icur = int(floor(cur));
    int next = min(icur + 1, 6);
    return mix(cols[icur], cols[next], fract(cur));
}

const vec3 zorgPurple[5] = vec3[5](vec3(0.0), vec3(0.0), vec3(0.07, 0.18, 0.38), vec3(1., 0., 0.56), vec3(0.58, 1., 0.2));

const vec3 orangeBlue[7] = vec3[7](vec3(0.0), vec3(0.0), vec3(0.1, 0.2, 0.4), vec3(0.0, 0.5, 0.6), vec3(0.8, 0.4, 0.2), vec3(0.9, 0.6, 0.3), vec3(1.0, 0.9, 0.0));

const vec3 green[7] = vec3[7](vec3(0.0), vec3(0.0), vec3(0.0, 0.3, 0.2), vec3(0.1, 0.7, 0.7), vec3(0.8, 0.5, 0.3), vec3(0.9, 0.7, 0.5), vec3(1.0, 1.0, 1.0));



const vec3 purpleFire[7] = vec3[7](vec3(0.0), vec3(0.0), vec3(0.1, 0.3, 0.6), vec3(0.3, 0.2, 0.5), vec3(0.7, 0.2, 0.3), vec3(0.9, 0.5, 0.2), vec3(1.0, 0.9, 0.1));

const vec3 arctic[7] = vec3[7](vec3(0.0), vec3(0.0), vec3(0.0, 0.1, 0.3), vec3(0.0, 0.3, 0.5), vec3(0.1, 0.6, 0.8), vec3(0.4, 0.8, 1.0), vec3(0.85, 0.96, 1.0));


const vec3 neonInferno[6] = vec3[6](vec3(0.0), vec3(0.2, 0.0, 0.3), vec3(0.6, 0.0, 0.6), vec3(0.8, 0.1, 0.2), vec3(1.0, 0.5, 0.1), vec3(1.0));



// Gradient functions
vec3 gradZorgPurple(float f) {
    return interpolateGradient5(f, zorgPurple);
}
vec3 gradOrangeBlue(float f) {
    return interpolateGradient7(f, orangeBlue);
}
vec3 gradGreen(float f) {
    return interpolateGradient7(f, green);
}
vec3 gradPurpleFire(float f) {
    return interpolateGradient7(f, purpleFire);
}
vec3 gradArctic(float f) {
    return interpolateGradient7(f, arctic);
}
vec3 gradNeonInferno(float f) {
    return interpolateGradient6(f, neonInferno);
}


void main(){
 ivec2 pix=ivec2(gl_FragCoord.xy), dimensions=textureSize(marks,0);
 vec4 mark=texelFetch(marks,pix,0);
 float brightness=mark.r;
 float previous=texelFetch(history,pix,0).r;
 if(brightness==0.){color=vec4(0.,0.,0.,mark.a);return;}
 // Keep faint marks in the colored portion of the gradients. Brightness itself
 // is restored below, so this curve controls hue without thickening particles.
 float paletteValue=.25+.75*sqrt(brightness);
 vec2 pos=(vec2(pix)-vec2(dimensions)*.5)*(2./float(dimensions.x+dimensions.y))*.6;
 float offset=length(pos),temporalDiff=(brightness-previous)/32.;
 vec3 col=vec3(0.);
    // reused variables
    float blend = tanh(500.0 * temporalDiff + 2.0 * offset);
    vec3 col2 = vec3(paletteValue);

    if(colorModeType == 0) // monochrome, retaining the same particle marks
    {
        col = vec3(paletteValue);
    } else if(colorModeType == 1) // "blueish orange/purple"
    {
        vec3 col1 = gradPurpleFire(tanh(paletteValue * 1.3));
        vec3 col3 = gradArctic(tanh(paletteValue * 1.3));
        col = mix(col1, col3, blend);
        col = clamp(1.25*col,0.,1.);
    } else if(colorModeType == 2) // icy blue
    {
        vec3 col1 = gradArctic(fract(tanh(paletteValue * 0.6 + offset) + 0.15));
        col = mix(col1, col2, blend);
    } else if(colorModeType == 3) // orange over purple, not very saturated
    {
        vec3 col1 = gradPurpleFire(tanh(paletteValue * 1.3));
        col = mix(col1, col2, blend);
    } else if(colorModeType == 4) // gold over dark green
    {
        vec3 col1 = gradOrangeBlue(tanh(paletteValue * 1.3 + offset));
        col = mix(col1, col2, blend);
    } else if(colorModeType == 5) {
        vec3 col1 = gradNeonInferno(tanh(paletteValue * 1.3));
        col = mix(col1, col2, blend);
    } else if(colorModeType == 6) // pink/purple (from z0rg :)
    {
        vec3 col1 = gradZorgPurple(fract(tanh(paletteValue * 0.6 + offset) + 0.15)); // weird, but let's keep it like this
        col = mix(col1, col2, blend);
        vec3 col3 = gradArctic(tanh(paletteValue * 1.3));
        col = mix(col1, col3, blend);
        col = clamp(1.5*pow(max(col,vec3(0.)),vec3(1.1)),0.,1.);
    } else if(colorModeType == 7)
    {
        vec3 col1 = gradNeonInferno(tanh(paletteValue * 1.3));
        // col = mix(col1, col2, blend);
        vec3 col3 = gradArctic(tanh(paletteValue * 1.3));
        col = mix(col1, col3, blend);
        col = clamp(1.1*col,0.,1.);
    } else if(colorModeType == 8) // bright is yellow, over blue background, embarassingly experimental
    {
        vec3 col1 = gradOrangeBlue(tanh(paletteValue * 1.3 + offset));
        vec3 colGreen = gradGreen(tanh(paletteValue * 2.3 + offset));
        vec3 col2_ = mix(vec3(clamp(1.3 * paletteValue, 0., 1.)), colGreen, 0.5);
        vec3 col3 = mix(col2_, col1, 1. - 0.6 * tanh(sin(-1500. * abs(temporalDiff)) + 2.0 * offset));
        vec3 col4 = gradOrangeBlue(tanh(paletteValue * 1.3 + offset));
        vec3 col5 = vec3(paletteValue);
        vec3 col6 = 1.25 * mix(col4, col5, tanh(500. * temporalDiff + 2.0 * offset));
        col6 = col6 * col6;
        col = max(col6, col3);
    } else if(colorModeType == 9) // green
    {
        vec3 col1 = gradGreen(tanh(paletteValue * 1.3));
        col = mix(col1, col2, blend);
        // vec3 col3 = gradArctic(tanh(paletteValue * 1.3));
        // col = mix(col1, col3, blend);
        // col = clamp(1.1*col,0.,1.);
    }

 // Use the recipe as a hue/saturation selector, retaining Sage’s exact mark
 // intensity (maximum RGB channel). Even an extrapolated black recipe must
 // not erase a particle; fall back to neutral white in that case.
 col=clamp(col,0.,1.);
 float peak=max(col.r,max(col.g,col.b));
 vec3 tint=peak>0.00001?col/peak:vec3(1.);
 color=vec4(brightness*tint,mark.a);
}`;
