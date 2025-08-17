var path = require('path');

module.exports = {
	watch: false,
	target: 'electron-renderer',
	mode: 'development',
	devtool: 'inline-source-map',
	entry: './src/main.ts',
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: 'bundle.js'
	},
	resolve: {
		extensions: [ '.ts', '.js' ]
	},
	module: {
		rules: [
			// all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
			{ test: /\.tsx?$/, loader: "ts-loader" }
		]
	}
}
