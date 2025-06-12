import fs from "fs/promises";
import path from "path";
import { minify } from "html-minifier-terser";

const isDev = process.argv.includes("--dev");
const outDir = "dist";
const mode = isDev ? "development" : "production";
const suffix = isDev ? "-debug" : "";

async function build() {
  console.log(`Starting ${mode} build...`);

  try {
    // 0. Clean output directory
    await fs.rm(outDir, { recursive: true, force: true });

    // 1. Ensure output directory exists and read source files
    await fs.mkdir(outDir, { recursive: true });
    const htmlTemplate = await fs.readFile("index.html", "utf-8");

    // 2. Build CSS and JS using Bun
    const [cssBuild, jsBuild, ga4Build] = await Promise.all([
      Bun.build({
        entrypoints: ["styles.css"],
        minify: !isDev,
      }),
      Bun.build({
        entrypoints: ["script.js"],
        minify: isDev
          ? false
          : {
              whitespace: true,
              syntax: true,
              identifiers: false,
            },
        define: {
          "process.env.NODE_ENV": JSON.stringify(mode),
        },
      }),
      Bun.build({
        entrypoints: ["ga4-tracking.js"],
        minify: isDev
          ? false
          : {
              whitespace: true,
              syntax: true,
              identifiers: false,
            },
      }),
    ]);

    const cssContent = await cssBuild.outputs[0].text();
    const jsContent = await jsBuild.outputs[0].text();
    const ga4ScriptContent = await ga4Build.outputs[0].text();

    // 3. Prepare the build comment header
    const buildTimestamp = new Date().toISOString();
    const buildComment = `<!-- 
  Credit Report Form - ${isDev ? "DEV Build" : "Minified Build"}
  Source repository: https://github.com/austin-thesing/orf-bizcred
  Last built: ${buildTimestamp}
  
  For editing this form, please see the source files in the GitHub repository above.
  ${isDev ? "This is a development build. Do not use in production." : "Do not edit this minified file directly."}
-->`;

    // --- Minify Options ---
    const minifyOptions = {
      collapseWhitespace: true,
      removeComments: true,
      removeRedundantAttributes: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true,
      useShortDoctype: true,
      minifyCSS: true,
      minifyJS: {
        mangle: false,
      },
    };

    // --- OUTPUT 1: @webflow.html (Fully Combined HTML, CSS, JS) ---
    let combinedHtml = htmlTemplate
      .replace(/<link rel="stylesheet" href="styles.css"[^>]*>/, `<style>${cssContent}</style>`)
      .replace(/<script src="script.js"><\/script>/, `<script>${jsContent}</script>`)
      .replace(/<script src="ga4-tracking.js"><\/script>/, `<script>${ga4ScriptContent}</script>`);

    // Wrap the content in a safe container for Webflow embedding
    const webflowSafeHtml = `
<!-- Credit Report Form Embed - Safe for Webflow -->
<div id="bizcred-form-embed-container" style="width: 100%; max-width: 100%; overflow: hidden;">
  ${combinedHtml}
</div>
<script>
// Ensure the form doesn't interfere with existing page content
(function() {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSafeEmbed);
  } else {
    initSafeEmbed();
  }
  
  function initSafeEmbed() {
    // Ensure our form container exists and is properly isolated
    const container = document.getElementById('bizcred-form-embed-container');
    if (container) {
      // Add isolation styles to prevent CSS conflicts
      container.style.cssText += '; position: relative; z-index: 1; isolation: isolate;';
      
      // Ensure our form doesn't affect other page elements
      const formContainer = container.querySelector('.bizcred-form-container');
      if (formContainer) {
        // Use targeted isolation instead of 'all: initial' which breaks page layout
        formContainer.style.cssText += '; position: relative; z-index: auto;';
      }
    }
  }
})();
</script>`;

    if (!isDev) {
      combinedHtml = await minify(webflowSafeHtml, minifyOptions);
    } else {
      combinedHtml = webflowSafeHtml;
    }

    const webflowFilename = `@webflow${suffix}.html`;
    const webflowPath = path.join(outDir, webflowFilename);
    await fs.writeFile(webflowPath, `${buildComment}\n${combinedHtml}`);
    console.log(`✅ Created Webflow embed file: ${webflowPath}`);

    // --- OUTPUT 2: @wf-htmlcss.html (HTML + CSS for Webflow) ---
    let wfHtmlCssContent = htmlTemplate
      .replace(/<link rel="stylesheet" href="styles.css"[^>]*>/, `<style>${cssContent}</style>`)
      .replace(/<script src="script.js"><\/script>/, "")
      .replace(/<script src="ga4-tracking.js"><\/script>/, "");

    if (!isDev) {
      wfHtmlCssContent = await minify(wfHtmlCssContent, minifyOptions);
    }

    const wfHtmlCssFilename = `@wf-htmlcss${suffix}.html`;
    const wfHtmlCssPath = path.join(outDir, wfHtmlCssFilename);
    await fs.writeFile(wfHtmlCssPath, `${buildComment}\n${wfHtmlCssContent}`);
    console.log(`✅ Created HTML/CSS embed: ${wfHtmlCssPath}`);

    // --- OUTPUT 3: @wf-scripts.html (JS for Webflow) ---
    const wfScriptsContent = `<script>${jsContent}</script>\n<script>${ga4ScriptContent}</script>`;
    const wfScriptsFilename = `@wf-scripts${suffix}.html`;
    const wfScriptsPath = path.join(outDir, wfScriptsFilename);
    await fs.writeFile(wfScriptsPath, `${buildComment}\n${wfScriptsContent}`);
    console.log(`✅ Created scripts embed: ${wfScriptsPath}`);

    console.log(`\n🎉 Build for ${mode} mode completed successfully!`);
  } catch (error) {
    console.error("🚨 Build failed:", error);
    process.exit(1);
  }
}

build();
