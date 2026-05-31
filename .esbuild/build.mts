import * as fs from "node:fs/promises";
import * as esbuild from "esbuild";
import path from "node:path";

const baseOpts: esbuild.BuildOptions = {
  bundle: true,
  minify: true,
  mangleProps: /^_/,
  target: ["chrome80", "firefox74"],
  allowOverwrite: true,
  logLevel: "info",
};

const { argv } = process;
const isDev = argv.includes("--serve") || argv.includes("--dev");
const isRelease = argv.includes("--release");

if (isDev) {
  // Handle serving an HTTP page for dev mode:
  const ctx = await esbuild.context({
    ...baseOpts,
    entryPoints: ["./src/entrypoints/DevAPI.ts"],
    entryNames: "dev",
    format: "iife",
    globalName: "MathFmt",
    sourcemap: true,
    outdir: "html/js",
    write: false,
    minify: false,
  });
  // Simple watch - this doesn't re-invoke the code-mods, but is better than nothing.
  await ctx.watch();
  await ctx.serve({
    servedir: "html",
  });
} else {
  // Else, normal build.

  // Standard IIFE module, for legacy web targets:
  await esbuild.build({
    ...baseOpts,
    entryPoints: ["./src/entrypoints/MathFmt.ts"],
    entryNames: "MathFmt-browser",
    format: "iife",
    banner: {
      js: '/// <reference path="./MathFmt.iife.d.ts" />',
    },
    globalName: "MathFmt",
    outdir: "./build",
  });
  await fs.copyFile(
    "./src/entrypoints/MathFmt.iife.d.ts",
    "./build/MathFmt.iife.d.ts",
  );

  // More modern ESM target, for modern browsers:
  await esbuild.build({
    ...baseOpts,
    entryPoints: ["./src/entrypoints/MathFmt.ts"],
    entryNames: "MathFmt-browser",
    outExtension: { ".js": ".mjs" },
    format: "esm",
    banner: {
      js: '/// <reference path="./MathFmt.esm.d.ts" />',
    },
    outdir: "./build",
  });
  await fs.copyFile(
    "./src/entrypoints/MathFmt.esm.d.ts",
    "./build/MathFmt.esm.d.ts",
  );

  // NPM ESM target:
  const nodeDir = isRelease ? "./build/npm" : "./build";
  await esbuild.build({
    ...baseOpts,
    target: ["node22"],
    minify: false,
    mangleProps: /^__NEVER_MANGLE__$/,
    entryPoints: ["./src/entrypoints/MathFmt.ts"],
    entryNames: "MathFmt-node",
    outExtension: { ".js": ".mjs" },
    format: "esm",
    outdir: nodeDir,
  });

  await fs.copyFile(
    "./src/entrypoints/MathFmt.esm.d.ts",
    path.join(nodeDir, "MathFmt.node.d.ts"),
  );

  if (isRelease) {
    await prepareNPMDirectory(nodeDir);
  }
}

async function prepareNPMDirectory(dest: string) {
  const copyThese = ["./README.md"];

  for (const filePath of copyThese) {
    console.debug("Copying '%s'...", filePath);
    await fs.copyFile(filePath, path.join(dest, filePath));
  }

  // Generate a cleaned-up package.json for this dir:
  const packageJSON = JSON.parse(await fs.readFile("./package.json", "utf8"));
  const updatedJSON = {
    ...packageJSON,
    main: "./MathFmt-node.mjs",
    types: "./MathFmt.node.d.ts",
    scripts: undefined,
    mocha: undefined,
    devDependencies: undefined,
  };
  console.debug("Generating 'package.json'...");
  await fs.writeFile(
    path.join(dest, "package.json"),
    JSON.stringify(updatedJSON, null, 2),
    "utf8",
  );
}
