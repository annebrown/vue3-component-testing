// content.config.ts
import { defineContentConfig, defineCollection } from '@nuxt/content'

const isDev = process.env.NODE_ENV === 'development'

export default defineContentConfig({
    collections: {
        docs: defineCollection({
            type: 'page',
            source: isDev
                ? 'docs/**/*.md' 
                : 'https://raw.githubusercontent.com/annebrown/vue3-fleet-pub/main/content/docs/**/*.md'
        }),
        otherdocs: defineCollection({
            type: 'page',
            source: isDev
                ? 'otherdocs/**/*.md' 
                : 'https://raw.githubusercontent.com/annebrown/vue3-fleet-pub/main/content/otherdocs/**/*.md'
        })
    }
})