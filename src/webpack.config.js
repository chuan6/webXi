var src_dir = "src";
var dist_dir = "webXi"

module.exports = {
  entry: "./main.ts",
  output: {
    filename: "main.js",
    path: __dirname.slice(0, -src_dir.length) + dist_dir
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "awesome-typescript-loader",
        exclude: /node_modules/,
      },
    ]
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"]
  },
};
