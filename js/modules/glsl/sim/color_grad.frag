precision highp float;

uniform sampler2D density;
varying vec2 uv;

void main() {
    // 밀도 텍스처의 x 채널에서 밀도 값을 읽어옵니다.
    float den = texture2D(density, uv).x;

    // 밀도 값에 따라 투명도(알파)를 설정합니다.
    // 0.05 이하는 완전히 투명하게 만들어서 배경을 그리지 않습니다.
    // 0.05 ~ 1.0 범위에서 서서히 나타나도록 합니다.
    float alpha = smoothstep(0.05, 1.0, den);
    
    // 밀도 값을 0.0 ~ 1.0 범위로 정규화합니다.
    // 이는 색상 그라데이션에 사용할 주요 값입니다.
    float mappedDen = clamp(den, 0.0, 1.0);

    // 핑크 - 파란색 계열 색상 정의
    vec3 colorLow = vec3(1.0, 0.6, 0.8);    // 연한 핑크
    vec3 colorMid = vec3(0.5, 0.7, 1.0);    // 밝은 파랑
    vec3 colorHigh = vec3(0.1, 0.3, 0.8);   // 진한 파랑

    vec3 finalColor;

    // 밀도 값에 따라 색상 혼합
    if (mappedDen < 0.5) {
        // 낮은 밀도: 핑크에서 밝은 파랑으로
        finalColor = mix(colorLow, colorMid, smoothstep(0.0, 0.5, mappedDen));
    } else {
        // 높은 밀도: 밝은 파랑에서 진한 파랑으로
        finalColor = mix(colorMid, colorHigh, smoothstep(0.5, 1.0, mappedDen));
    }

    // 최종 색상 출력 (알파 값 포함)
    gl_FragColor = vec4(finalColor, alpha);
}