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

esbuild.buildSync({entryPoints:['public/builder/geometry-worker.mjs'],bundle:true,minify:true,format:'esm',target:['es2020'],outfile:'public/builder/geometry-worker.js',platform:'browser',external:['node:module']});

const zlib=require('node:zlib');
for(const file of ['public/app.js','public/builder/bundle.js','public/builder/geometry-worker.js'])fs.writeFileSync(file+'.br',zlib.brotliCompressSync(fs.readFileSync(file)));
