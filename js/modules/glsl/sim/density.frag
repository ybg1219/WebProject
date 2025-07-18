precision highp float;

uniform sampler2D velocity;
uniform sampler2D density;
uniform vec2 head;  // 소싱 중심 (0~1)
uniform vec2 left;  // 소싱 중심 (0~1)
uniform vec2 right;  // 소싱 중심 (0~1)
uniform vec2 center;  // 소싱 중심 (0~1)
uniform vec2 bottom;  // 소싱 중심 (0~1)

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

void main() {
    // 시작 시 초기값때문에 중심부분 색칠됨.
    // 찌그러짐 수정 필요.
    // 커서 사이즈 반영하여 영역 제한 및 커서 사이즈 적용
    // + 연기 그라디언트 추가해보기

    // 1. 과거 밀도 위치 추적 (Advection for density)
    vec2 ratio = max(fboSize.x, fboSize.y) / fboSize;
    vec2 vel = texture2D(velocity, uv).xy;
    
    // velocity debugging
    // vec2 vel = vec2(0.2,  0.0);
    // vel = vel * 0.5 + 0.5;
    // gl_FragColor = vec4(vel.x, vel.y, 0.0, 1.0);
    vec2 uv2 = uv - vel * dt * ratio;
    //uv2 = clamp(uv2, vec2(0.0), vec2(1.0)); // 👈 꼭 추가해보자

    // 확산 계수 lambda로 확산 정도 조절
    float lambda = 0.93;
    vec4 dv = lambda*texture2D(density, uv2); // 과거 밀도
    // gl_FragColor = dv; // 기존 밀도 덮어쓰기

    // 2. 연기 소싱
    // float d = distance(uv, head);
    // float falloff = pow(1.0 - smoothstep(0.0, radius, d), 2.0); //1.0- smoothstep(0.0, radius, d); 
    // // (변화 시작, 끝,  현재값) 변화 시작 값보다 작으면 0 sigmoid 형태
    // float addedDensity = strength * falloff;
    // // float addedDensity = smoothstep(0.0, 1.0, strength * falloff);

    float source = 0.0;
    source += strength * computeFalloff(uv, head);
    source += strength * computeFalloff(uv, left);
    source += strength * computeFalloff(uv, right);
    source += strength * computeFalloff(uv, center);
    source += strength * computeFalloff(uv, bottom);

    // 3. 밀도 결과 = 이동된 밀도 + 소싱
    gl_FragColor = vec4(dv + source); // r=g=b=a로 밀도 저장
    
}