const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');
const webpack = require('webpack');
// CesiumJS源代码的路径
const cesiumSource = 'node_modules/cesium/Source';
const cesiumWorkers = '../Build/Cesium/Workers';

const { defineConfig } = require('@vue/cli-service')

// function resolve(dir) {
//   return path.join(__dirname, dir);
// }

module.exports = defineConfig({
  // publicPath: './', // 打包的静态资源引用路径
  // chainWebpack: (config) => {
  //   config.resolve.alias
  //     .set('@', resolve('./src'))
  // },
  transpileDependencies: true,
  devServer: {
    allowedHosts: ['all'],
    proxy: {
      'api': {
        target: 'http://127.0.0.1:8080',
        // target: 'http://t0.tianditu.com',
        changeOrigin: true,
        pathRewrite: {
          '^/api': ''
        }
      }
    }
  },
  configureWebpack: {
    output: {
      sourcePrefix: ''
    },
    resolve: {
      fallback: { "https": false, "zlib": false, "http": false, "url": false },
    },
    plugins: [
      // 复制Cesium的Assets、Widgets和Workers到一个静态目录
      new CopyWebpackPlugin({
        patterns: [
          { from: path.join(cesiumSource, cesiumWorkers), to: 'Workers' },
          { from: path.join(cesiumSource, 'Assets'), to: 'Assets' },
          { from: path.join(cesiumSource, 'Widgets'), to: 'Widgets' },
          { from: path.join(cesiumSource, 'ThirdParty'), to: 'ThirdParty' }
        ]
      }),
      new webpack.DefinePlugin({
        //在Cesium中定义一个相对基本路径来加载资源
        CESIUM_BASE_URL: JSON.stringify('')
      })
    ],
    module: {
      rules: [
        {
          test: /\.(png|jpg|gif|glb)\??.*$/,
          use: [
            {
              loader: 'file-loader',
              options: {
                esModule: false
              },
            },
          ],
          type: 'javascript/auto'
        },
      ],
    },
  }
})