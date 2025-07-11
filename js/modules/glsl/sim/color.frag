precision highp float;
uniform sampler2D density;
varying vec2 uv;

void main(){
    float den = texture2D(density, uv).x;
    den = 1.0- smoothstep(0.0, 1.0, den);

    gl_FragColor = vec4(den, den, den,  1.0);
}
// vec2 vel = texture2D(velocity, uv).xy;
// float len = length(vel);
// vel = vel * 0.5 + 0.5;

// vec3 color = vec3(vel.x, vel.y, 1.0);
// color = mix(vec3(1.0), color, len);