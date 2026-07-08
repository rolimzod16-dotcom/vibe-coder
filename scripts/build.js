const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "..", "www");
const dest = path.join(__dirname, "..", "dist");

fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(src, dest, { recursive: true });
console.log("Built: www -> dist");