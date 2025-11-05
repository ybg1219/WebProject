precision highp float;

uniform sampler2D density;
varying vec2 uv;

// 0~1 범위의 값을 받아 색상 그라데이션을 반환하는 함수
vec3 heatmap(float v) {
    // 1. 값을 0.0 ~ 1.0 범위로 제한
    float value = clamp(v, 0.0, 1.0);
    
    // 2. 색상 정의 (차가운 색 -> 뜨거운 색)
    vec3 coolColor = vec3(0.05, 0.0, 0.15); // 어두운 보라색 (배경)
    vec3 midColor = vec3(1.0, 0.3, 0.1);  // 밝은 주황색 (중간 밀도)
    vec3 hotColor = vec3(1.0, 0.8, 0.2);  // 매우 밝은 노란색 (가장 높은 밀도)

    // 3. 색상 혼합
    vec3 color = mix(coolColor, midColor, smoothstep(0.0, 0.4, value));
    color = mix(color, hotColor, smoothstep(0.4, 0.98, value));
    
    return color;
}

void main() {
    // 밀도 텍스처의 x 채널에서 밀도 값을 읽어옵니다.
    float den = texture2D(density, uv).x;
    
    // 밀도 값을 색상으로 변환합니다.
    vec3 color = heatmap(den);
    
    // 최종 색상 출력
    gl_FragColor = vec4(color, 1.0);
}