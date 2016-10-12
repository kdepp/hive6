var webpack = require('webpack');

module.exports = {
  entry: {
    webgame: [
      './wwwroot/static/js/web.js'
    ]
  },
  output: {
    path: './wwwroot/static/js/dist/',
    filename: '[name].d.js',
    sourceMapFilename: '[name].map'
  },
  devtool: 'source-map',
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      }
    })
  ]
}
