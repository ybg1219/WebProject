const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
// webpack.config.js
const CopyWebpackPlugin = require('copy-webpack-plugin');

// const TerserPlugin = require('terser-webpack-plugin'); // 만약 최소화가 필요하면 주석 해제

module.exports = {
    mode: "production", // 'production'을 사용하고 싶으면 변경
    entry: './js/main.js',
    // devtool: 'source-map', // VM### 대신 경로가 뜸.
    output: {
        filename: 'main.min.js',
        path: path.resolve(__dirname, 'dist'),
        clean: true,
        environment: {
            module: false, // ESM 사용 허용
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
            template: './public/index.html', // [수정] 템플릿 경로 (루트의 index.html)
            filename: 'index.html', // 출력 파일 이름
            inject: 'body', // 스크립트를 body 끝에 주입
        }),
        // [★추가★]
        // 2. GitHub Pages의 404 새로고침 트릭을 위해
        //    index.html과 똑같은 내용의 404.html을 생성
        new HtmlWebpackPlugin({
            template: './public/index.html', // 동일한 템플릿 사용
            filename: '404.html',   // 출력 파일 이름만 다르게
            inject: 'body',
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    // 1. MediaPipe WASM 파일 복사
                    from: path.resolve(__dirname, 'node_modules/@mediapipe/tasks-vision/wasm'),
                    to: 'mediapipe/wasm'
                },
                {
                    // 3. public 폴더의 모든 내용(비디오 포함)을 dist로 복사
                    from: 'public/',
                    to: '.', // dist 폴더 루트에 복사
                    globOptions: {
                        // index.html은 HtmlWebpackPlugin이 처리하므로 복사 대상에서 제외
                        ignore: ['**/index.html']
                    }
                }
            ]
        })
    ],
    devServer: {
        static: {
            directory: path.join(__dirname, 'dist'),
            publicPath: '/', // 루트 기준
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
        outputModule: false,      // module: true output을 허용
        topLevelAwait: true, // MediaPipe task는 top-level await 필요
    },
};
