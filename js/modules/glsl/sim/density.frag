precision highp float;
#define MAX_POSITIONS 20

uniform sampler2D velocity;
uniform sampler2D density;

uniform vec2 positions[MAX_POSITIONS]; // 최대 20개의 vec2 위치를 받는 배열

uniform float radius;    // 소싱 반경
uniform float strength;  // 밀도 증가량
varying vec2 uv;

uniform float dt;
uniform vec2 fboSize;
uniform vec2 px;

// 공통 falloff 함수
float falloff(float d, float radius) {
    return pow(1.0 - smoothstep(0.0, radius, d), 2.0);
}

// 종횡비 보정 함수
vec2 normalizeToAspect(vec2 v) {
    vec2 scale = max(px.x, px.y) / px;
    return v * scale;
}

// 점 falloff (종횡비 고려)
float computeFalloff(vec2 p, vec2 center, float radius) {
    float scale = max(px.x, px.y);
    radius *= scale; // px 단위 -> uv 단위

    vec2 np = normalizeToAspect(p);
    vec2 nc = normalizeToAspect(center);
    float d = distance(np, nc);

    return falloff(d, radius);
}

// 선 거리 계산 (SDF 기반)
float sdLine(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 0.7);
    return length(pa - ba * h);
}

// 선 falloff (종횡비 고려)
float sdfLineFalloff(vec2 p, vec2 a, vec2 b, float radius) {
    float scale = max(px.x, px.y);
    radius *= scale;

    vec2 np = normalizeToAspect(p);
    vec2 na = normalizeToAspect(a);
    vec2 nb = normalizeToAspect(b);

    float d = sdLine(np, na, nb);
    return falloff(d, radius);
}

void main() {

    // 0. 연기 소싱
    float source = 0.0;
    // 점 소스
    for (int i =0;i < MAX_POSITIONS; i++) { // 최대 길이 10
        if (positions[i].x <= 0.0 || positions[i].y <= 0.0) continue;
        source += strength * computeFalloff(uv, positions[i], radius)*0.5;
    }

    vec2 center = positions[3];
    // 선 소스 (SDF 기반)
    for (int i =0; i < MAX_POSITIONS ; i++){ // center 제외 하고 계산
        if (positions[i].x <= 0.0 || positions[i].y <= 0.0) continue;
        if (i == 3) continue; // i = 3일때 center
        source += strength * sdfLineFalloff(uv, positions[i], center, radius) *0.4;
    }

    // 1. buoyancy 

    vec2 ratio = max(fboSize.x, fboSize.y) / fboSize;
    vec2 vel = texture2D(velocity, uv).xy;

    // float buoyancyCoefficient = 0.01;
    // vec2 gravity = vec2(0.0, -1.0); // 아래 방향
    // vec2 d = texture2D(density, uv).xy;
    // vec2 buoyancyForce = - buoyancyCoefficient * (d) * gravity;
    // vel += buoyancyForce;


    // 2. 과거 밀도 위치 추적 (Advection for density)    
    vec2 uv2 = uv - vel * dt * ratio;
    uv2 = clamp(uv2, vec2(0.0), vec2(1.0)); 

    // 확산 계수 lambda로 확산 정도 조절
    float lambda = 0.93;
    float dv = lambda*texture2D(density, uv2).x; // 과거 밀도

    // 4. 밀도 결과 = 이동된 밀도 + 소싱
    gl_FragColor = vec4(dv + source); // r=g=b=a로 밀도 저장
    
}