precision highp float;
#define MAX_POSITIONS 10

uniform sampler2D velocity;
uniform sampler2D density;

uniform vec2 positions[MAX_POSITIONS]; // 최대 10개의 vec2 위치를 받는 배열

uniform float radius;    // 소싱 반경
uniform float strength;  // 밀도 증가량
varying vec2 uv;

uniform float dt;
uniform vec2 fboSize;
uniform vec2 px;

float computeFalloff(vec2 p, vec2 center) {
    float d = distance(p, center);
    return pow(1.0 - smoothstep(0.0, radius, d), 2.0);
}

float drawLine(vec2 uv, vec2 a, vec2 b, float radius) {
    float minDist = 1.0;
    const int steps = 10;

    for (int i = 0; i <= steps; i++) {
        float t = float(i) / float(steps);
        vec2 p = mix(a, b, t);
        float d = distance(uv, p);
        float falloff = pow(1.0 - smoothstep(0.0, radius, d), 2.0);
        minDist = max(minDist, falloff);
    }
    return minDist;
}

// SDF 기반 선 거리 계산 함수
float sdLine(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 0.7);
    return length(pa - ba * h);
}

// SDF 기반 선 falloff 계산
float sdfLineFalloff(vec2 p, vec2 a, vec2 b, float radius) {
    float d = sdLine(p, a, b);
    return pow(1.0 - smoothstep(0.0, radius, d), 2.0);
}


void main() {
    // 시작 시 초기값때문에 중심부분 색칠됨.
    // 찌그러짐 수정 필요.
    // 커서 사이즈 반영하여 영역 제한 및 커서 사이즈 적용
    // + 연기 그라디언트 추가해보기

    // 1. 과거 밀도 위치 추적 (Advection for density)
    vec2 ratio = max(fboSize.x, fboSize.y) / fboSize;
    vec2 vel = texture2D(velocity, uv).xy;
    vec2 uv2 = uv - vel * dt * ratio;
    //uv2 = clamp(uv2, vec2(0.0), vec2(1.0)); // 👈 꼭 추가해보자

    // 확산 계수 lambda로 확산 정도 조절
    float lambda = 0.93;
    vec4 dv = lambda*texture2D(density, uv2); // 과거 밀도
    // gl_FragColor = dv; // 기존 밀도 덮어쓰기

    // 2. 연기 소싱
    float source = 0.0;
    for (int i =0;i < 5; i++) { // 최대 길이 10
        if (positions[i].x <= 0.0 || positions[i].y <= 0.0) continue;
        source += strength * computeFalloff(uv, positions[i])*0.4;
    }

    vec2 center = positions[3];
    // 2. 선 소스 (SDF 기반)
    for (int i =0; i < 5 ; i++){ // center 제외 하고 계산
        if (positions[i].x <= 0.0 || positions[i].y <= 0.0) continue;
        if (i == 3) continue; // i = 3일때 center
        source += strength * sdfLineFalloff(uv, positions[i], center, radius) *0.2;
    }

    // 3. 밀도 결과 = 이동된 밀도 + 소싱
    gl_FragColor = vec4(dv + source); // r=g=b=a로 밀도 저장
    
}