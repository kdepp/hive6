var webpack = require('webpack');

module.exports = {
  entry: {
    bundle: [
      './wwwroot/static/js/web.js'
    ]
  },
  output: {
    path: './wwwroot/static/js/dist/',
    filename: 'web.d.js',
    sourceMapFilename: '[file].map'
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
