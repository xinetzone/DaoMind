// DaoMind Documentation Site Theme
// https://vitepress.dev/guide/custom-theme
import { h } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // Custom layout slots if needed
    })
  },
  enhanceApp({ app, router, siteData }) {
    // App level enhancements here
  }
} satisfies Theme
