// SPDX-FileCopyrightText: 2022 Johannes Loher
// SPDX-FileCopyrightText: 2022 David Archibald
//
// SPDX-License-Identifier: MIT

import { nodeResolve } from "@rollup/plugin-node-resolve";
import postcss from "rollup-plugin-postcss";
import autoprefixer from "autoprefixer";

const isProd = process.env.NODE_ENV === "production";

export default () => ({
  input: "src/module/so-inspired.js",
  output: {
    dir: "dist/module",
    format: "es",
    sourcemap: true,
  },
  plugins: [
    nodeResolve(),
    postcss({
      extract: true,
      minimize: isProd,
      sourceMap: true,
      use: ["sass"],
      plugins: [autoprefixer()],
    }),
  ],
});
