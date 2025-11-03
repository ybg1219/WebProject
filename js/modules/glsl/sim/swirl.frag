precision highp float;

// Vertex Shader로부터 UV 좌표를 받습니다.
varying vec2 vUv;

// 유니폼 변수들
uniform vec2 fboSize;  // FBO(화면)의 해상도

// 외력 적용 파라미터
uniform vec2 p0;     // 왼손 위치 (0~1)
uniform vec2 p1;     // 오른손 위치 (0~1)
uniform vec2 v0;     // 왼손 움직임 벡터
uniform vec2 v1;     // 오른손 움직임 벡터

// [유니폼] 노이즈의 빈도 (숫자가 클수록 더 촘촘하게 흔들림)
uniform float noise_frequency; // 예: 5.0
// [유니폼] 노이즈의 강도 (0.0: 노이즈 없음, 1.0: 완전히 랜덤한 보간)
uniform float noise_strength;  // 예: 0.3 (원본 t에서 30% 정도만 벗어남)

// --- 조화 진동 유니폼 ---
// [유니폼] 진동의 기본 빈도 (t=0~1 사이클 제어)
uniform float u_osc_frequency; // 예: 6.28318 (t=1.0일 때 cos(x)가 1번 진동)
// [유니폼] 진동 세기
uniform float u_osc_strength;  // 예: 0.5
uniform float u_time;          // (시간) JS에서 전달 (예: 1.0, 1.1, ...)
uniform float u_osc_speed;     // (시간) 이동 속도 (예: 2.0)

// 힘의 크기 제어
uniform float strength; // 전체 힘의 세기
uniform float radius;   // 힘이 영향을 미치는 반경

/**
 * 1. 조화 진동 함수 (Harmonic Function)
 * t값(x)을 기반으로 복잡한 진동 값(-1.0 ~ 1.0)을 반환합니다.
 * @param x - 입력 값 (보통 t * u_osc_frequency)
 * @return cos(x) * sin(4x) 결과
 */
float harmonic(float x) {
    // 기본 주파수와 4배 주파수의 곱
    return cos(x) * sin(4.0 * x);
}

// 1D 해시 함수 (0.0 ~ 1.0 반환)
float rand(float n) {
    return fract(sin(n) * 43758.5453); 
}

// 1D Value Noise 함수 (0.0 ~ 1.0 반환)
float noise(float t) {
    float i = floor(t);
    float f = fract(t);

    float a = rand(i);
    float b = rand(i + 1.0);

    f = f * f * (3.0 - 2.0 * f); // smoothstep(0.0, 1.0, f)
    
    return mix(a, b, f); // 부드럽게 보간된 노이즈 값
}

void main() {
    vec2 uv = vUv;

    // --- 1. 보간 파라미터 t 계산 ---
    vec2 p0_uv = p0 * 0.5 + 0.5;
    vec2 p1_uv = p1 * 0.5 + 0.5;
    vec2 lineSegment = p1_uv - p0_uv;
    float lineLengthSq = max(0.0001, dot(lineSegment, lineSegment));
    float t = dot(uv - p0_uv, lineSegment) / lineLengthSq;
    t = clamp(t, 0.0, 1.0);

    // 1. t값에 따라 0.0 ~ 1.0 사이의 부드러운 노이즈 값을 생성
    float noise_val = noise(t * noise_frequency);

    // 2. 원본 t와 노이즈 값을 보간하여 'noisy_t'를 만듦
    // u_noise_strength가 0이면 noisy_t = t
    // u_noise_strength가 1이면 noisy_t = noise_val
    float noisy_t = mix(t, noise_val, noise_strength);

    // --- 2. 선형 보간된 점(linePos)과 벡터(v_lin) 계산 ---
    vec2 linePos = mix(p0_uv, p1_uv, t);
    //vec2 v_lin = mix(v0, v1, t); // 기본 흐름
    vec2 v_lin = mix(v0, v1, noisy_t);

    // --- 3. 가중치 함수 계산 (f, g) ---
    float f = 4.0 * t * (1.0 - t); // 선분 중앙에서 최대
    float dist = distance(uv, linePos);
    float g = exp(-pow(dist / radius, 2.0) * 1.0); // 선분에서 멀어지면 감소

    // --- 4. 회전 성분(rot) 계산 ---
    vec2 dir = uv - linePos; // 중심선에서 픽셀로 향하는 벡터
    vec2 perpendicular_dir = vec2(-dir.y, dir.x);
    float cross_product_z = v0.x * v1.y - v0.y * v1.x;
    float rotation_direction = sign(cross_product_z);
    vec2 rot = strength * f * g * perpendicular_dir * rotation_direction;

    // --- 5. 조화 진동(Harmonic Oscillation) 성분 계산 ---
    
    // 5-1. 공간적 빈도 적용
    float spatial_input = t * u_osc_frequency;
    
    // 5-2. 시간적 이동(오프셋) 계산
    // u_osc_speed가 양수면 한 방향, 음수면 반대 방향으로 흐릅니다.
    float time_offset = harmonic(u_time * u_osc_speed * 0.05 )*4.0;
    
    // 5-3. 최종 입력 = 공간 위치 + 시간 오프셋
    float harmonic_input = spatial_input + time_offset;
    
    // 5-4. harmonic 함수 호출
    float osc_val = harmonic(harmonic_input);
    
    // 5-5. 진동 성분 벡터 계산
    vec2 osc = u_osc_strength * f * g * dir * osc_val;

    // --- 6. 최종 힘 = 선형 흐름 + 회전 + 진동 ---
    vec2 force = v_lin * g + osc; // + rot


    // 최종 외력을 색상으로 출력합니다. (실제 시뮬레이션에서는 velocity FBO에 기록됩니다)
    gl_FragColor = vec4( force , 0.0, 1.0);
}
