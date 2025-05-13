const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
// webpack.config.js
const CopyWebpackPlugin = require('copy-webpack-plugin');

// const TerserPlugin = require('terser-webpack-plugin'); // 만약 최소화가 필요하면 주석 해제

module.exports = {
    mode: "development", // 'production'을 사용하고 싶으면 변경
    entry: './js/main.js',
    output: {
        filename: 'main.min.js',
        path: path.resolve(__dirname, 'dist'),
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
            template: './dist/index.html',
        }),
        // new CopyWebpackPlugin([
        //     {
        //       from: path.resolve(__dirname, 'node_modules/@mediapipe/hands'),
        //       to: 'hands',
        //       ignore: ['**/*.ts'] // TS 파일 제외
        //     }
        //   ])
    ],
    devServer: {
        // static: {
        //     directory: path.join(__dirname, 'dist'),
        // },
        host: '0.0.0.0',
        port: 3001,
        compress: false,
        open: true,
        hot : false
    }
};
