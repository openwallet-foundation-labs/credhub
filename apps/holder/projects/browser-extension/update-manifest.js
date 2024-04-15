const fs = require("fs");
const path = require("path");

const distPath = path.join(__dirname, "../../", "dist", "browser-extension"); // Adjust if your dist path is different
const manifestPath = path.join(distPath, "manifest.json");

// Function to find a specific script or style file
function findFile(pattern) {
	return new Promise((resolve, reject) => {
		fs.readdir(distPath, (err, files) => {
			if (err) {
				return reject("Failed to read dist directory: " + err);
			}
			const foundFile = files.find((file) => new RegExp(pattern).test(file));
			if (!foundFile) {
				return reject(`${pattern} file not found.`);
			}
			resolve(foundFile);
		});
	});
}

// Function to update the manifest.json
function updateManifest(backgroundScript, contentScript, styleFile) {
	fs.readFile(manifestPath, "utf8", (err, data) => {
		if (err) {
			return console.error("Failed to read manifest.json:", err);
		}

		let manifest;
		try {
			manifest = JSON.parse(data);
		} catch (e) {
			return console.error("Failed to parse manifest.json:", e);
		}

		// Update the manifest with new script and style filenames
		manifest.background.service_worker = backgroundScript;
		manifest.content_scripts[0].js = [contentScript];
		manifest.content_scripts[0].css = [styleFile]; // Update the CSS file for content scripts

		fs.writeFile(
			manifestPath,
			JSON.stringify(manifest, null, 2),
			"utf8",
			(err) => {
				if (err) {
					return console.error("Failed to write updated manifest.json:", err);
				}

				console.log(
					"Manifest updated successfully with scripts and style:",
					backgroundScript,
					contentScript,
					styleFile,
				);
			},
		);
	});
}

// Execute the script and style updates
Promise.all([
	findFile("^background\\..*\\.js$"), // Regex pattern for background script
	findFile("^content-script\\..*\\.js$"), // Regex pattern for content script
	findFile("^styles\\..*\\.css$"), // Regex pattern for the styles
])
	.then(([backgroundScript, contentScript, styleFile]) => {
		updateManifest(backgroundScript, contentScript, styleFile);
	})
	.catch(console.error);
