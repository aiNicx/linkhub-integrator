Bundling is the process of gathering, optimizing and transpiling the JS/TS source code of functions and their dependencies. During development and when deploying, the code is transformed to a format that Convex runtimes can directly and efficiently execute.

Convex currently bundles all dependencies automatically, but for the Node.js runtime you can disable bundling certain packages via the external packages config.

Bundling for Convex
When you push code either via npx convex dev or npx convex deploy, the Convex CLI uses esbuild to traverse your convex/ folder and bundle your functions and all of their used dependencies into a source code bundle. This bundle is then sent to the server.

Thanks to bundling you can write your code using both modern ECMAScript Modules (ESM) or the older CommonJS (CJS) syntax.

ESM vs. CJS
Bundling limitations
The nature of bundling comes with a few limitations.

Code size limits
The total size of your bundled function code in your convex/ folder is limited to 32MiB (~33.55MB). Other platform limits can be found here.

While this limit in itself is quite high for just source code, certain dependencies can quickly make your bundle size cross over this limit, particularly if they are not effectively tree-shakeable (such as aws-sdk or snowflake-sdk)

You can follow these steps to debug bundle size:

Make sure you're using the most recent version of convex
npm install convex@latest

Generate the bundle
Note that this will not push code, and just generated a bundle for debugging purposes.

npx convex dev --once --debug-bundle-path /tmp/myBundle

Visualize the bundle
Use source-map-explorer to visualize your bundle.

npx source-map-explorer /tmp/myBundle/**/*.js

Code bundled for the Convex runtime will be in the isolate directory while code bundled for node actions will be in the node directory.

Large node dependencies can be eliminated from the bundle by marking them as external packages.

Dynamic dependencies
Some libraries rely on dynamic imports (via import/require calls) to avoid always including their dependencies. These imports are not supported by the default Convex runtime and will throw an error at runtime.

Additionally, some libraries rely on local files, which cannot be bundled by esbuild. If bundling is used, irrespective of the choice of runtime, these imports will always fail in Convex.

Examples of libraries with dynamic dependencies
External packages
As a workaround for the bundling limitations above, Convex provides an escape hatch: external packages. This feature is currently exclusive to Convex's Node.js runtime.

External packages use esbuild's facility for marking a dependency as external. This tells esbuild to not bundle the external dependency at all and to leave the import as a dynamic runtime import using require() or import(). Thus, your Convex modules will rely on the underlying system having that dependency made available at execution-time.

Package installation on the server
Packages marked as external are installed from npm the first time you push code that uses them. The version installed matches the version installed in the node_modules folder on your local machine.

While this comes with a latency penalty the first time you push external packages, your packages are cached and this install step only ever needs to rerun if your external packages change. Once cached, pushes can actually be faster due to smaller source code bundles being sent to the server during pushes!

Specifying external packages
Create a convex.json file in the same directory as your package.json if it does not exist already. Set the node.externalPackages field to ["*"] to mark all dependencies used within your Node actions as external:

{
  "node": {
    "externalPackages": ["*"]
  }
}

Alternatively, you can explicitly specify which packages to mark as external:

{
  "node": {
    "externalPackages": ["aws-sdk", "sharp"]
  }
}

The package identifiers should match the string used in import/require in your Node.js action.

Troubleshooting external packages
Incorrect package versions
The Convex CLI searches for external packages within your local node_modules directory. Thus, changing version of a package in the package.json will not affect the version used on the server until you've updated the package version installed in your local node_modules folder (e.g. running npm install).

Import errors
Marking a dependency as external may result in errors like this:

The requested module "some-module" is a CommonJs module, which may not support all module.exports as named exports. CommonJs modules can always be imported via the default export

This requires rewriting any imports for this module as follows:

// ❌ old
import { Foo } from "some-module";

// ✅ new
import SomeModule from "some-module";
const { Foo } = SomeModule;

Limitations
The total size of your source code bundle and external packages cannot exceed the following:

45MB zipped
240MB unzipped
Packages that are known not to work at this time:

Puppeteer - browser binary installation exceeds the size limit
@ffmpeg.wasm - since 0.12.0, no longer supports Node environments