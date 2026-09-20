"use strict";
const fs = require("node:fs");
const babel = require("@babel/core");
const esbuild = require("esbuild");
fs.writeFileSync(
  "public/app.js",
  babel.transformFileSync("public/app.jsx", {
    presets: ["@babel/preset-react"],
  }).code + "\n",
);
esbuild.buildSync({
  entryPoints: ["public/builder/index.jsx"],
  bundle: true,
  minify: true,
  format: "iife",
  target: ["es2020"],
  outfile: "public/builder/bundle.js",
  legalComments: "eof",
});
console.log("Built webshop and ring designer.");
