import {uglify} from 'rollup-plugin-uglify'
import babel from 'rollup-plugin-babel'
import clear from 'rollup-plugin-clear'
import {version, name} from '../package.json'
import json from 'rollup-plugin-json'

const config_uglify = {
    input: 'src/index.js',
    output: {
        file: `dist/${name}-${version}.min.js`,
        name: 'base',
        format: 'umd'
    },
    plugins: [
        clear({
            targets: ['dist']
        }),
        babel({
            exclude: 'node_modules/**'
        }),
        json(),
        uglify({
            output: {
                comments: function (node, comment) {
                    const text = comment.value
                    const type = comment.type
                    if (type === "comment2") {
                        // multiline comment
                        return /eslint/i.test(text)
                    }
                }
            }
        })
    ]
}


const config = {
    input: 'src/index.js',
    output: {
        file: `dist/${name}-${version}.js`,
        name: 'base',
        format: 'umd'
    },
    plugins: [
        clear({
            targets: ['dist']
        }),
        babel({
            exclude: 'node_modules/**'
        }),
        json()
    ]
}

export default [config, config_uglify]