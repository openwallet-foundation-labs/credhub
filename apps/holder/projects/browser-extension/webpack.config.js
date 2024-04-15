module.exports = {
	entry: {
		background: "src/background.ts",
		"content-script": "src/content-script.ts",
	},
	optimization: {
		runtimeChunk: false,
	},
  resolve: {
    fallback: {
      crypto: false,
    }
  },
};
