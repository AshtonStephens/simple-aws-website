const path = require('path');

module.exports = {
  entry: './src/index.ts',
  devtool: 'inline-source-map',
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
    extensions: ['.tsx', '.ts', '.js']
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),

    // Code that exports to the window.
    library: 'buttonEventHandler',
    libraryTarget: 'window',
    libraryExport: 'default'
  },
  // Set 'mode' option to 'development' or 'production' to enable defaults for each environment.
  mode: 'development',
  // Look for changes every second.
  watchOptions: {
    poll: 1000,
  }
};
