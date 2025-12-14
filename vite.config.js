import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
        petridish:"./petridish/index.html",
        aiassistant:"./aihelper/index.html",
        graphs:"./graphs/index.html",
        trendasaurus:"./Trendasaurus/index.html"
    }
    }
  }
})