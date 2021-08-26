const path = require('path');

module.exports = {
    mode: 'development',
    entry: {
        app: path.join(__dirname, 'index.tsx')
    },
    resolve: {
        alias: {
            'react': path.join(__dirname, 'node_modules/react')
        },
        extensions: ['.ts', '.tsx', '.js', '.css']
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: '/node_modules/'
            }
        ],
    },
    devServer: {
        open: true,
        hot: true,
        writeToDisk: true,
        contentBase: "./",
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist')
    },
}
