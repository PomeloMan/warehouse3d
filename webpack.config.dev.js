const path = require('path');
const merge = require('webpack-merge');
const common = require('./webpack.config.js');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = merge(common, {
  output: {
    filename: 'js/warehouse.js',
    chunkFilename: '[chunkhash].js',
    path: path.resolve(__dirname, 'dist')
  },
  mode: 'development',
  devtool: 'eval-source-map',
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    compress: true,
    historyApiFallback: true,
    inline: true,
    hot: true
  },
  plugins: [
    new CleanWebpackPlugin()
  ]
});