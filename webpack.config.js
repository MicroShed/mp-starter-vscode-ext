// @ts-check

"use strict";

const path = require("path");

/**@type {import('webpack').Configuration}*/
/* eslint @typescript-eslint/no-var-requires: "off" */

const config = {
  target: "node",
  devtool: "source-map",
  entry: "./src/extension.ts",
  output: {
    // the bundle is stored in the "dist" folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
    path: path.resolve(__dirname, "dist"),
    filename: "extension.js",
    libraryTarget: "commonjs2",
    devtoolModuleFilenameTemplate: "../[resource-path]",
  },
  externals: {
    vscode: "commonjs vscode",
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "ts-loader",
          },
        ],
      },
    ],
  },
};
module.exports = config;
