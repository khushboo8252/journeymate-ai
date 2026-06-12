import { defineNitroConfig } from 'nitro'

export default defineNitroConfig({
  preset: 'vercel',
  output: {
    dir: '.output',
    publicDir: 'public'
  }
})
