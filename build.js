#!/usr/bin/env bun

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { minify as minifyHTML } from "html-minifier-terser";
import CleanCSS from "clean-css";
import { minify as minifyJS } from "terser";
import { join } from "path";

const BUILD_DIR = "dist";
const OUTPUT_FILE = "webflow.html";

// Ensure dist directory exists
if (!existsSync(BUILD_DIR)) {
  mkdirSync(BUILD_DIR, { recursive: true });
}

async function build() {
  try {
    console.log("🚀 Starting build process...");

    // Read source files
    console.log("📖 Reading source files...");
    const htmlContent = readFileSync("index.html", "utf-8");
    const cssContent = readFileSync("styles.css", "utf-8");
    const jsContent = readFileSync("script.js", "utf-8");

    // Minify CSS
    console.log("🎨 Minifying CSS...");
    const cleanCSS = new CleanCSS({
      level: 2,
      returnPromise: false,
    });
    const minifiedCSS = cleanCSS.minify(cssContent).styles;

    // Minify JavaScript (excluding GA4 as requested)
    console.log("⚡ Minifying JavaScript...");
    const minifiedJSResult = await minifyJS(jsContent, {
      compress: {
        drop_console: true,
        dead_code: true,
        unused: true,
      },
      mangle: true,
      format: {
        comments: false,
      },
    });
    const minifiedJS = minifiedJSResult.code;

    // Process HTML: remove external CSS/JS references and inline everything
    console.log("📄 Processing HTML...");
    let processedHTML = htmlContent
      // Remove CSS link
      .replace(/<link[^>]*href="styles\.css"[^>]*>/gi, "")
      // Remove script tags for script.js and ga4-tracking.js
      .replace(/<script[^>]*src="script\.js"[^>]*><\/script>/gi, "")
      .replace(/<script[^>]*src="ga4-tracking\.js"[^>]*><\/script>/gi, "");

    // Add minified CSS and JS inline
    const inlineCSS = `<style>${minifiedCSS}</style>`;
    const inlineJS = `<script>${minifiedJS}</script>`;

    // Insert inline CSS after the first div or at the beginning of the content
    processedHTML = processedHTML.replace(/(<div[^>]*class="bizcred-form-container"[^>]*>)/, `${inlineCSS}\n$1`);

    // Insert inline JS at the end, just before the closing tag
    processedHTML = processedHTML + "\n" + inlineJS;

    // Minify the final HTML
    console.log("🗜️  Minifying HTML...");
    const minifiedHTML = await minifyHTML(processedHTML, {
      removeComments: true,
      removeRedundantAttributes: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true,
      useShortDoctype: true,
      collapseWhitespace: true,
      conservativeCollapse: true,
      minifyCSS: true,
      minifyJS: true,
      removeEmptyAttributes: true,
      removeOptionalTags: false, // Keep for Webflow compatibility
      caseSensitive: false,
    });

    // Add header comment with GitHub repo link
    const headerComment = `<!-- 
  Credit Report Form - Minified Build
  Source repository: https://github.com/austin-thesing/orf-bizcred
  Last built: ${new Date().toISOString()}
  
  For editing this form, please see the source files in the GitHub repository above.
  Do not edit this minified file directly.
-->
`;

    // Write the output file with header comment
    const outputPath = join(BUILD_DIR, OUTPUT_FILE);
    const finalHTML = headerComment + minifiedHTML;
    writeFileSync(outputPath, finalHTML, "utf-8");

    // Calculate sizes
    const originalSize = htmlContent.length + cssContent.length + jsContent.length;
    const minifiedSize = finalHTML.length;
    const compressionRatio = (((originalSize - minifiedSize) / originalSize) * 100).toFixed(1);

    console.log("✅ Build completed successfully!");
    console.log(`📊 Original size: ${(originalSize / 1024).toFixed(1)}KB`);
    console.log(`📦 Minified size: ${(minifiedSize / 1024).toFixed(1)}KB`);
    console.log(`🗜️  Compression: ${compressionRatio}% smaller`);
    console.log(`📁 Output: ${outputPath}`);
    console.log("\n🎉 Ready for Webflow! Copy the contents of dist/webflow.html into your Webflow embed element.");
  } catch (error) {
    console.error("❌ Build failed:", error.message);
    process.exit(1);
  }
}

// Run the build
build();
