import type { Config } from 'tailwindcss'
import tailwindTypography from '@tailwindcss/typography'

export default {

    content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.{vue,js,ts}',
    './pages/**/*.{vue,js,ts}',
    './composables/**/*.{vue,js,ts}',
    './plugins/**/*.{vue,js,ts}',
    './App.{vue,js,ts}',
    './app.{vue,js,ts}',
    './Error.{vue,js,ts}',
    './error.{vue,js,ts}',
    './content/**/*.md',
'./node_modules/@annebrown.ca/vue3-fleet-pub/**/*.mjs', 
'./node_modules/@annebrown.ca/vue3-fleet-pub/**/*.mjs', 
    ],

    plugins: [tailwindTypography()],

} satisfies Config