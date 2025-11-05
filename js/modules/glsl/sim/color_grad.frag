precision highp float;

uniform sampler2D density;
varying vec2 uv;

void main() {
    // 밀도 텍스처의 x 채널에서 밀도 값을 읽어옵니다.
    float den = texture2D(density, uv).x;

    // 밀도 값에 따라 투명도(알파)를 설정합니다.
    // 0.05 이하는 완전히 투명하게 만들어서 배경을 그리지 않습니다.
    // 0.05 ~ 1.0 범위에서 서서히 나타나도록 합니다.
    float alpha = smoothstep(0.01, 1.0, den);
    
    float hardness = 0.3; // ★ 이 값을 조절 (0.5: 부드러움, 2.0: 강함)
    float value = 1.0 - exp(-den * hardness);

    // 핑크 - 파란색 계열 색상 정의
    vec3 colorLow = vec3(0.95, 0.5, 0.8);    // 연한 핑크
    vec3 colorMid = vec3(1.0, 1.0, 1.0);    // 밝은 파랑
    vec3 colorHigh = vec3(0.6, 1.0, 0.95);   // 진한 파랑

    vec3 finalColor;

    // 밀도 값에 따라 색상 혼합
    if (value < 0.5) {
        // 낮은 밀도: 핑크에서 밝은 파랑으로
        finalColor = mix(colorLow, colorMid, smoothstep(0.0, 0.5, value));
    } else {
        // 높은 밀도: 밝은 파랑에서 진한 파랑으로
        finalColor = mix(colorMid, colorHigh, smoothstep(0.5, 1.0, value));
    }

    // 최종 색상 출력 (알파 값 포함)
    gl_FragColor = vec4(finalColor, alpha);
}