const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const webpack = require("webpack");
const { ModuleFederationPlugin } = require("webpack").container;
const deps = require("./package.json").dependencies;

module.exports = {
  entry: path.resolve(__dirname, "src", "main.tsx"),
  output: {
    path: path.resolve(__dirname, "dist"),
    publicPath: "auto",
    clean: true
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js", ".jsx"]
  },
  devServer: {
    port: 5173,
    historyApiFallback: true,
    proxy: [
      {
        context: ["/api"],
        target: "http://localhost:3000",
        changeOrigin: true
      }
    ]
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "ts-loader",
          options: {
            transpileOnly: true
          }
        }
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"]
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "index.html")
    }),
    new ModuleFederationPlugin({
      name: "admin_mfe",
      filename: "remoteEntry.js",
      exposes: {
        "./PostEditorForm": "./src/remotes/PostEditorForm",
        "./ArticleEditorForm": "./src/remotes/ArticleEditorForm",
        "./VideoUploadForm": "./src/remotes/VideoUploadForm"
      },
      shared: {
        react: { singleton: true, eager: true, requiredVersion: deps.react },
        "react-dom": { singleton: true, eager: true, requiredVersion: deps["react-dom"] },
        "react-router-dom": { singleton: true, eager: true, requiredVersion: deps["react-router-dom"] },
        "react/jsx-runtime": { singleton: true, eager: true, requiredVersion: deps.react }
      }
    }),
    new webpack.DefinePlugin({
      "process.env.API_BASE_URL": JSON.stringify(process.env.API_BASE_URL || "")
    })
  ]
};
