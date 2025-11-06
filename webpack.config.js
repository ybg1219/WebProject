const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
// webpack.config.js
const CopyWebpackPlugin = require('copy-webpack-plugin');

// const TerserPlugin = require('terser-webpack-plugin'); // 만약 최소화가 필요하면 주석 해제

module.exports = {
    mode: "development", // 'production'을 사용하고 싶으면 변경
    entry: './js/main.js',
    // devtool: 'source-map', // VM### 대신 경로가 뜸.
    output: {
        filename: 'main.min.js',
        path: path.resolve(__dirname, 'dist'),
        environment: {
            module: true, // ESM 사용 허용
        },
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: [
                                ['@babel/preset-env', {
                                    targets: "defaults",
                                    useBuiltIns: "usage",
                                    corejs: 3
                                }]
                            ],
                            plugins: ['@babel/plugin-transform-runtime']
                        }
                    }
                ]
            },
            {
                test: /\.(vert|frag|obj)$/i, // GLSL 파일 및 OBJ 파일을 처리
                type: 'asset/source', // raw-loader 대신 asset/source 사용
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './dist/index.html', // [수정] 템플릿 경로 (루트의 index.html)
            filename: 'index.html', // 출력 파일 이름
            inject: 'body', // 스크립트를 body 끝에 주입
        }),
        // [★추가★]
        // 2. GitHub Pages의 404 새로고침 트릭을 위해
        //    index.html과 똑같은 내용의 404.html을 생성
        new HtmlWebpackPlugin({
            template: './dist/index.html', // 동일한 템플릿 사용
            filename: '404.html',   // 출력 파일 이름만 다르게
            inject: 'body',
        }),
        new CopyWebpackPlugin([
            {
                from: path.resolve(__dirname, 'node_modules/@mediapipe/pose'),
                to: 'mediapipe/pose', // hands 폴더로 복사
                // globOptions: {
                //     ignore: ['**/*.ts'] // 타입스크립트 소스는 제외
                // }
            },
            {
                from: path.resolve(__dirname, 'node_modules/@mediapipe/camera_utils'),
                to: 'mediapipe/camera',
                // globOptions: {
                //     ignore: ['**/*.ts']
                // }
            }
        ])
    ],
    devServer: {
        static: {
            directory: path.join(__dirname, 'dist'),
        },
        host: '0.0.0.0',
        port: 3001,
        compress: false,
        open: true,
        hot: false,
        historyApiFallback: true,
    },
    target: ["web", "es2020"], // ESM 지원을 위해 반드시 필요
    experiments: {
        outputModule: true,      // module: true output을 허용
        topLevelAwait: true, // MediaPipe task는 top-level await 필요
    },
};
