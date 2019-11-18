const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyPlugin = require('copy-webpack-plugin')

module.exports = {
  entry: {
    main: './main.ts'
    // index: './src/index.ts'
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
    }, {
      test: /\.(css|sass|scss)$/,
      use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader']
    }, {
      test: /\.json$/,
      exclude: /node_modules/,
      type: 'javascript/auto',
      loader: 'json-loader'
    }]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  plugins: [
    new webpack.BannerPlugin('v1.0.0'),
    new HtmlWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: 'styles.css',
      chunkFilename: '[chunkhash].css'
    }),
    new CopyPlugin([{
      from: path.resolve(__dirname, './src/assets'),
      to: path.resolve(__dirname, 'dist/assets')
    }]),
  ]
}