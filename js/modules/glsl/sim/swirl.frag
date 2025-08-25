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

// 힘의 크기 제어
uniform float strength; // 전체 힘의 세기
uniform float radius;   // 힘이 영향을 미치는 반경

void main() {
    // 현재 픽셀의 정규화된 좌표 (0~1)
    // vec2 uv = gl_FragCoord.xy / fboSize.xy; // WebGL 1.0 방식
    vec2 uv = vUv; // varying을 사용하는 것이 더 표준적입니다.

    // 1. 보간 파라미터 t 계산

    vec2 p0_uv = p0 * 0.5 + 0.5;
    vec2 p1_uv = p1 * 0.5 + 0.5;

    // 현재 픽셀(uv)을 p0-p1 선분 위에 투영하여 가장 가까운 지점의 비율을 찾습니다.
    vec2 lineSegment = p1_uv - p0_uv;
    // dot(lineSegment, lineSegment)는 선분 길이의 제곱과 같습니다. 0으로 나누는 것을 방지합니다.
    float lineLengthSq = max(0.0001, dot(lineSegment, lineSegment));
    // t: 현재 uv가 선분상에 투영된 위치를 나타내는 비율 (0: p0, 1: p1)
    float t = dot(uv - p0_uv, lineSegment) / lineLengthSq;
    t = clamp(t, 0.0, 1.0);

    // 2. 선분 위의 보간된 점(linePos)과 보간된 벡터(v_lin) 계산
    // v_lin: 양손의 움직임(v0, v1)을 보간하여 유체의 기본 흐름을 만듭니다.
    vec2 linePos = mix(p0_uv, p1_uv, t);
    vec2 v_lin = mix(v0, v1, t);

    // 3. 가중치 함수 계산
    // f: 선분의 중앙(t=0.5)에서 가장 큰 값을 가져 와류를 중앙에 집중시킵니다.
    float f = 4.0 * t * (1.0 - t);
    // g: 선분(linePos)에서 멀어질수록(y축 기준) 힘이 약해지도록 가우시안 함수를 적용합니다.
    float g = exp(-pow((uv.y - linePos.y) / radius, 2.0));

    // 4. 회전 성분(rot) 계산
    // linePos에서 현재 픽셀(uv)로 향하는 벡터를 90도 회전시켜 와류 방향을 만듭니다.
    vec2 perpendicular_dir = vec2(-(uv.y - linePos.y), (uv.x - linePos.x));
    vec2 rot = strength * f * g * perpendicular_dir;

    // 5. 최종 힘 = 선형 보간된 흐름 + 회전 성분
    vec2 force = v_lin + rot;

    // 최종 외력을 색상으로 출력합니다. (실제 시뮬레이션에서는 velocity FBO에 기록됩니다)
    gl_FragColor = vec4(force, 0.0, 1.0);

    /*
    // 디버깅: 방향 벡터 시각화
    gl_FragColor = vec4(normalize(dir) * 0.5 + 0.5, 0.0, 1.0);
    */
}
