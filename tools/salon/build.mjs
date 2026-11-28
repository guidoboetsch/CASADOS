// Build only when the 3D renderer changes. The delivered site is entirely static.
import { build } from "esbuild";
import { copyFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const path = name => fileURLToPath(new URL(name, import.meta.url));
await build({
  entryPoints:[path("./scene.js")], outfile:path("../../dist/salon/maqueta.min.js"),
  bundle:true, format:"iife", globalName:"KazaMaqueta", minify:true,
  target:"es2020", supported:{"template-literal":false}, legalComments:"inline",
  banner:{js:"/* KAZA · Motor de maqueta. Incluye Three.js; ver THREE-LICENSE.txt. */"}
});
await copyFile(path("./node_modules/three/LICENSE"), path("../../dist/salon/THREE-LICENSE.txt"));
