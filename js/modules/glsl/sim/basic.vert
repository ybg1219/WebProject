precision highp float;

attribute vec3 position;
attribute vec2 uv;
uniform vec2 px;
varying vec2 vUv;

void main(){
    
    vec3 pos = position;
    uv = vec2(0.5)+(pos.xy)*0.5;
    pos.xy = pos.xy * scale;
    vUv = uv;
    gl_Position = vec4(pos.xy, 0.0, 1.0);
}