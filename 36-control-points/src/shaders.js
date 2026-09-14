// Adapted from 36 Points (2019–2022), Sage Jenson. CC BY-NC-SA 3.0.
// Source: https://www.sagejenson.com/36points/main.js
export const particleRenderVert = `#version 300 es\n
precision highp float;

in vec2 i_P;
uniform float pointsize;
uniform float dotSize;

void main() {
  gl_PointSize = pointsize;
  gl_Position = vec4(i_P, 0.0, 1.0);

  if (gl_VertexID == 0)
  {
    gl_PointSize = dotSize;
  }
}`;

export const particleRenderFrag = `#version 300 es\n
precision highp float;

out vec4 FragColor;

uniform float[19] v;

uniform int deposit;

void main() {
    float opacity;
    if (deposit == 1)
    {
        opacity = v[14];
    }
    else
    {
        opacity = v[17];
    }

    if (dot(gl_PointCoord - 0.5, gl_PointCoord - 0.5) > 0.25) discard;
    else FragColor = vec4(1., 1., 1.,opacity);
}`;

export const passthroughFrag = `#version 300 es\n
precision highp float;
in float v_A;
void main() { discard; }`;

export const particleUpdateVert = `#version 300 es\n

// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License\n
// Full license: https://creativecommons.org/licenses/by-nc-sa/3.0/legalcode\n
// Contact the author for other licensing options (sagejenson.com / @mxsage)\n

precision highp float;

uniform sampler2D u_trail;

in vec2 i_P;
in float i_A;
in float i_T;

out vec2 v_P;
out float v_A;
out float v_T;

uniform vec2 i_dim;
uniform int pen;

uniform float[19] v;
uniform float[8] mps;

uniform int frame;

vec2 bd(vec2 pos)
{
    pos *= .5;
    pos += vec2(.5);
    pos -= floor(pos);
    pos -= vec2(.5);
    pos *= 2.;
    return pos;
}

float gn(in vec2 coordinate, in float seed){
    // this is not true random, just some strangeness that lived in this code base since ~2019
    // may it never be fixed
    return fract(tan(distance(coordinate*(seed+0.118446744073709551614),
        vec2(0.118446744073709551614, 0.314159265358979323846264)))*0.141421356237309504880169);
}

vec2 cr(float t)
{
    vec2 G1 = vec2(mps[0], mps[1]);
    vec2 G2 = vec2(mps[2], mps[3]);
    vec2 G3 = vec2(mps[4], mps[5]);
    vec2 G4 = vec2(mps[6], mps[7]);
    vec2 A = G1*-0.5+G2*1.5+G3*-1.5+G4*0.5;
    vec2 B = G1+G2*-2.5+G3*2.+G4*-.5;
    vec2 C = G1*-0.5+G3*0.5 ;
    vec2 D = G2;
    return t*(t*(t*A+B)+C)+D;
}

void main()
{
    vec2 dir = vec2(cos(i_T), sin(i_T));
    float hd= i_dim.x/2.;
    vec2 sp=.5*(i_P+ vec2(1.0));
    // this is some secondary special sauce
    float sv= texture(u_trail, bd(sp+v[13]/hd*dir+vec2(0.,v[12]/hd))).x;
    sv= max(sv, 0.000000001);
    // this is the primary special sauce :)
    float sd=v[0]/hd+v[2]*pow(sv,v[1])*250./hd;
    float md=v[9]/hd+v[11]*pow(sv,v[10])*250./hd;
    float sa=v[3]+v[5]*pow(sv, v[4]);
    float ra=v[6]+v[8]*pow(sv, v[7]);
    // end special sauce
    float m=texture(u_trail, bd(sp+ sd*vec2(cos(i_T), sin(i_T)))).x;
    float l=texture(u_trail, bd(sp+ sd*vec2(cos(i_T+sa), sin(i_T+sa)))).x;
    float r=texture(u_trail, bd(sp+ sd*vec2(cos(i_T-sa), sin(i_T-sa)))).x;
    float h=i_T;
    if (m>l&&m>r){}
    else if (m<l&&m<r){if (gn(i_P*1332.4324,i_T) > 0.5) h+= ra; else h-=ra;}
    else if (l<r) h-=ra; else if (l>r) h+=ra;
    vec2 nd=vec2(cos(h), sin(h));
    vec2 op=i_P+nd*md;
    const float segmentPop=0.0005;
    if (pen==1&&i_A<segmentPop){
        op=2.*cr(i_A/segmentPop)-vec2(1.);
        op+= nd*pow(gn(i_P*132.43,i_T), 1.8);
    }
    v_P = bd(op);
    v_A= fract(i_A+segmentPop);
    v_T =h;
}`;

export const vsSource = `#version 300 es\n
in vec4 aVertexPosition;
in vec2 aTexCoord;
precision highp float;

out vec2 vTexCoord;

void main() {
    gl_Position = aVertexPosition;
    vTexCoord = aTexCoord;
}`;

export const drawFrag = `#version 300 es\n
precision highp float;

in vec2 vTexCoord;

uniform vec2 uTextureSize;

out vec4 outColor;

uniform sampler2D uDrawTex;

void main() {
    vec2 uv = texture(uDrawTex, vTexCoord).rg;
    vec3 color = vec3(uv.r);
    outColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}`;

export const blurFrag = `#version 300 es\n
precision highp float;

uniform vec2 uTextureSize;
uniform vec2 mouse;
uniform vec2 prevMouse;
uniform sampler2D uUpdateTex;

in vec2 vTexCoord;
out vec2 outState;

uniform float[19] v;

void main() {
    vec2 onePixel = 1.0 / uTextureSize;

    vec2 average = vec2(0.);

    float dec_x = vTexCoord.x - onePixel.x;
    float inc_x = vTexCoord.x + onePixel.x;
    float dec_y = vTexCoord.y - onePixel.y;
    float inc_y = vTexCoord.y + onePixel.y;

    average += texture(uUpdateTex, vec2(dec_x, dec_y)).rg;
    average += texture(uUpdateTex, vec2(dec_x, vTexCoord.y)).rg;
    average += texture(uUpdateTex, vec2(dec_x, inc_y)).rg;

    average += texture(uUpdateTex, vec2(vTexCoord.x, dec_y)).rg;
    average += texture(uUpdateTex, vTexCoord).rg;
    average += texture(uUpdateTex, vec2(vTexCoord.x, inc_y)).rg;

    average += texture(uUpdateTex, vec2(inc_x, dec_y)).rg;
    average += texture(uUpdateTex, vec2(inc_x, vTexCoord.y)).rg;
    average += texture(uUpdateTex, vec2(inc_x, inc_y)).rg;

    average /= 9.;

    outState = average * v[15];
}`;

export const drawScreenFrag = `#version 300 es\n
precision highp float;

in vec2 vTexCoord;
out vec4 outColor;

uniform sampler2D uDrawTex;
uniform int invert;

void main() {
    vec4 color = clamp(texture(uDrawTex, vTexCoord), 0., 1.);
    color.a = 1.0;
    if (invert == 1)
    {
        color.xyz = vec3(1.) - color.xyz;
    }
    outColor = color;
}`;

export const clearScreenFrag = `#version 300 es\n
precision highp float;

in vec2 vTexCoord;
out vec4 outColor;

uniform float[19] v;

void main() {
    outColor = vec4(0., 0., 0., v[18]);
}`;

