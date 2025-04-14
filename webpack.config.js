const path = require('path');

module.exports = {
  entry: './src/js/main.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'public/dist'),
    publicPath: ''
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
      publicPath: '/'
    },
    compress: true,
    port: 8080,
    watchFiles: ['src/**/*', 'public/assets/**/*'],
    hot: true,
    client: {
      logging: 'verbose',
      overlay: true,
      progress: true
    }
  },
  mode: 'development',
  devtool: 'source-map'
}; 