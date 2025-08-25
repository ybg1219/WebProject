precision highp float;

// Vertex Shader로부터 UV 좌표를 받습니다.
varying vec2 vUv;

// 유니폼 변수들
uniform vec2 fboSize;  // FBO(화면)의 해상도

// 외력 적용 파라미터
uniform vec2 p0;       // 선분 시작점 (정규화된 0~1 좌표)
uniform vec2 p1;       // 선분 끝점 (정규화된 0~1 좌표)

// 힘의 크기 제어
uniform float strength; // 전체 힘의 세기
uniform float radius;   // 힘이 영향을 미치는 반경

void main() {
    // 현재 픽셀의 정규화된 좌표 (0~1)
    // vec2 uv = gl_FragCoord.xy / fboSize.xy; // WebGL 1.0 방식
    vec2 uv = vUv; // varying을 사용하는 것이 더 표준적입니다.

    // ----- 1. 선분 위에 가장 가까운 지점 찾기 -----
    vec2 lineSegment = p1 - p0;
    // dot(lineSegment, lineSegment)는 선분 길이의 제곱과 같습니다. 0으로 나누는 것을 방지합니다.
    float lineLengthSq = max(0.0001, dot(lineSegment, lineSegment));
    // t: 현재 uv가 선분상에 투영된 위치를 나타내는 비율 (0: p0, 1: p1)
    float t = dot(uv - p0, lineSegment) / lineLengthSq;
    t = clamp(t, 0.0, 1.0);

    // 보간을 통해 선분 위의 가장 가까운 지점(interpPos)을 계산합니다.
    vec2 interpPos = mix(p0, p1, t);

    // ----- 2. 와류(Swirl) 외력 계산 -----
    // 가장 가까운 지점에서 현재 픽셀을 향하는 벡터
    vec2 dir = uv - interpPos;
    float dist = length(dir);

    // 거리가 반경(radius)보다 멀면 힘을 0으로 처리하여 계산을 생략합니다.
    if (dist > radius) {
        gl_FragColor = vec4(0.0);
        return;
    }

    // 가우시안 함수를 이용해 힘의 감쇠(falloff)를 계산합니다.
    // interpPos에서 힘이 최대(1)가 되고, 멀어질수록 0에 가까워집니다.
    float falloff = exp(-pow(dist / radius, 2.0));

    // dir 벡터를 90도 회전시켜 와류의 방향 벡터를 만듭니다.
    vec2 swirlDir = vec2(-dir.y, dir.x);

    // 최종 외력 계산: normalize를 제거하여 중심에서 멀수록 더 강한 회전력을 갖게 합니다.
    vec2 force = swirlDir * falloff * strength;

    // 최종 외력을 색상으로 출력합니다. (실제 시뮬레이션에서는 velocity FBO에 기록됩니다)
    gl_FragColor = vec4(force, 0.0, 1.0);

    /*
    // 디버깅: 방향 벡터 시각화
    gl_FragColor = vec4(normalize(dir) * 0.5 + 0.5, 0.0, 1.0);
    */
}
