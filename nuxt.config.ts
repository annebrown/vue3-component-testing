export default defineNuxtConfig({

    compatibilityDate: '2025-05-15',
    devtools: { enabled: true },

    srcDir: 'app/',

    modules: [
        '@nuxt/content',
        '@nuxt/eslint',
        '@nuxt/fonts',
        '@nuxt/icon',
        '@nuxt/image',
        '@nuxt/ui'
    ],

    css: ['~/assets/css/ship.css'],

   content: {
        build: {
            markdown: {
                highlight: {
                    theme: {
                        default: 'github-light',
                        dark: 'github-dark'
                    },
                    langs: [
                        'console',
                        'css',
                        'diff',
                        'properties',
                        'go',
                        'html',
                        'ini',
                        'java',
                        'json',
                        'js',
                        'log',
                        'md',
                        'mdc',
                        'mermaid',
                        'perl',
                        'regexp',
                        'shell',
                        'ts',
                        'tsx',
                        'vue',
                        'yaml'
                    ]
                } // highlight
            } // markdown
        } // build
    },
        ui: {
        theme: {
            colors: ['primary', 'secondary', 'tertiary', 'neutral', 'tertiary', 'success', 'warning', 'error']
        }
    },
})