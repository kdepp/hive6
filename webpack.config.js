var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    webgame: [
      './wwwroot/static/js/web.js'
    ]
  },
  output: {
    path: './wwwroot/static/js/dist',
    filename: '[name].[hash].d.js',
    publicPath: '/static/js/dist'
    //sourceMapFilename: 'wwwroot/static/js/dist/[name].[hash].map'
  },
  devtool: 'source-map',
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      }
    }),
    new HtmlWebpackPlugin({
      filename: '../../../../views/include/web_game_js.pug',
      template: './empty.tpl',
      chunks: ['webgame']
    })
  ]
}
