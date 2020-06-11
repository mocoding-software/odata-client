import nodeResolve from "rollup-plugin-node-resolve";
import replace from "rollup-plugin-replace";
import babel from "rollup-plugin-babel";
import cleanup from "rollup-plugin-cleanup";
import typescript from "rollup-plugin-typescript2";
import { terser } from "rollup-plugin-terser";

import pkg from "./package.json";

const extensions = [".ts"];
const noDeclarationFiles = { compilerOptions: { declaration: false } };
const tsconfig = "tsconfig.build.json";

const babelRuntimeVersion = pkg.dependencies["@babel/runtime"].replace(/^[^0-9]*/, "");

const makeExternalPredicate = (externalArr) => {
  if (externalArr.length === 0) {
    return () => false;
  }
  const pattern = new RegExp(`^(${externalArr.join("|")})($|/)`);
  return (id) => pattern.test(id);
};

export default [
  // CommonJS
  {
    input: "src/index.ts",
    output: { file: "lib/odata-client.js", format: "cjs", indent: false },
    external: makeExternalPredicate([
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.peerDependencies || {}),
    ]),
    plugins: [
      nodeResolve({
        extensions,
      }),
      typescript({ useTsconfigDeclarationDir: true, tsconfig }),
      babel({
        extensions,
        plugins: [["@babel/plugin-transform-runtime", { version: babelRuntimeVersion }]],
        runtimeHelpers: true,
      }),
      cleanup({ comments: "none" }),
    ],
  },

  // ES
  {
    input: "src/index.ts",
    output: { file: "es/odata-client.js", format: "es", indent: false },
    external: makeExternalPredicate([
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.peerDependencies || {}),
    ]),
    plugins: [
      nodeResolve({
        extensions,
      }),
      typescript({
        tsconfigOverride: {
          tsconfig,
          compilerOptions: {
            declaration: false,
            module: "es2015",
            target: "es2015",
          },
        },
      }),
      babel({
        extensions,
        plugins: [["@babel/plugin-transform-runtime", { version: babelRuntimeVersion, useESModules: true }]],
        runtimeHelpers: true,
      }),
      cleanup({ comments: "none" }),
    ],
  },

  // ES for Browsers
  {
    input: "src/index.ts",
    output: { file: "es/odata-client.mjs", format: "es", indent: false },
    plugins: [
      nodeResolve({
        extensions,
      }),
      replace({
        "process.env.NODE_ENV": JSON.stringify("production"),
      }),
      typescript({ tsconfigOverride: noDeclarationFiles, tsconfig }),
      babel({
        extensions,
        exclude: "node_modules/**",
      }),
      terser({
        compress: {
          pure_getters: true,
          unsafe: true,
          unsafe_comps: true,
          warnings: false,
        },
      }),
      cleanup({ comments: "none" }),
    ],
  },

  // UMD Development
  {
    input: "src/index.ts",
    output: {
      file: "dist/odata-client.js",
      format: "umd",
      name: "odata-client",
      indent: false,
    },
    plugins: [
      nodeResolve({
        extensions,
      }),
      typescript({ tsconfigOverride: noDeclarationFiles, tsconfig }),
      babel({
        extensions,
        exclude: "node_modules/**",
      }),
      replace({
        "process.env.NODE_ENV": JSON.stringify("development"),
      }),
      cleanup({ comments: "none" }),
    ],
  },

  // UMD Production
  {
    input: "src/index.ts",
    output: {
      file: "dist/odata-client.min.js",
      format: "umd",
      name: "odata-client",
      indent: false,
    },
    plugins: [
      nodeResolve({
        extensions,
      }),
      typescript({ tsconfigOverride: noDeclarationFiles, tsconfig }),
      babel({
        extensions,
        exclude: "node_modules/**",
      }),
      replace({
        "process.env.NODE_ENV": JSON.stringify("production"),
      }),
      terser({
        compress: {
          pure_getters: true,
          unsafe: true,
          unsafe_comps: true,
          warnings: false,
        },
      }),
      cleanup({ comments: "none" }),
    ],
  },
];
