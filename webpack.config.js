const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    main: './main.ts',
    index: './src/index.ts'
  },
  output: {
    filename: 'js/[name].js',
    chunkFilename: '[chunkhash].js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [{
      test: /\.tsx?$/,
      loader: 'ts-loader',
      exclude: /node_modules/,
      options: {
        configFile: path.resolve(__dirname, './ts.config.json')
      }
    }]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  plugins: [
    new webpack.BannerPlugin('v1.0.0'),
    
    new HtmlWebpackPlugin()
  ]
}