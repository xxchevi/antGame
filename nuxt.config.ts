// https://nuxt.com/docs/api/configuration/nuxt-config
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss'
  ],
  css: ['~/assets/css/main.css'],
  compatibilityDate: '2025-07-30',
  ssr: false,
  runtimeConfig: {
    // The private keys which are only available within server-side
    secretKey: 'my-secret-key',
    // Keys within public, will be also exposed to the client-side
    public: {
      apiBase: '/api'
    }
  },
  nitro: {
    experimental: {
      wasm: true
    }
  },

})