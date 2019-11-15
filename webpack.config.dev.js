const path = require('path');
const merge = require('webpack-merge');
const common = require('./webpack.config.js');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'eval-source-map',
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    compress: true,
    historyApiFallback: true,
    inline: true,
    hot: true
  },
  module: {
    rules: [
      {
        test: /\.(css|sass|scss)$/,
        loader: 'style-loader!css-loader!sass-loader'
      }
    ]
  }
});