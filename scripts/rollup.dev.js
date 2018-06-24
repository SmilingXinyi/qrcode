import serve from 'rollup-plugin-serve'
import htmlTemplate from 'rollup-plugin-generate-html-template'
import livereload from 'rollup-plugin-livereload'
import postcss from 'rollup-plugin-postcss'
import clear from 'rollup-plugin-clear'
import yaml from 'rollup-plugin-yaml'
import alias from 'rollup-plugin-alias'

export default {
    input: 'demo/index.js',
    output: {
        file: 'examples/bundle.js',
        name: 'base',
        format: 'umd'
    },
    plugins: [
        serve({
            open: true,
            contentBase: 'examples',
            host: 'localhost',
            port: 8006
        }),
        livereload({
            watch: 'examples'
        }),
        postcss({
            plugins: [],
            minimize: true,
            extract: true
        }),
        htmlTemplate({
            template: 'demo/template.html',
            target: 'index.html'
        }),
        clear({
            targets: ['examples'],
            watch: true
        }),
        yaml({}),
        alias({
            resolve: ['.yml', '.json'],
            '@conf': 'src/conf'
        })
    ]
}