module.exports = {
	entry: {
		background: "apps/holder-browser-extension/src/background.ts",
		"content-script": "apps/holder-browser-extension/src/content-script.ts",
	},
	optimization: {
		runtimeChunk: false,
	},
};
