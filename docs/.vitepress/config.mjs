import { defineConfig } from 'vitepress'

export default defineConfig({
  base: '/VHDL-Essentials/',
  title: 'VHDL Essentials',
  description: 'Complete Quartus + VHDL workflow integration for Visual Studio Code',
  themeConfig: {
    logo: '/screenshots/panel.png',
    siteTitle: 'VHDL Essentials',
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Reference', link: '/reference/commands' },
      { text: 'Development', link: '/development/changelog' },
    ],
    sidebar: {
      '/guide/': [
        { text: 'Getting Started', link: '/guide/getting-started' },
        { text: 'Features', link: '/guide/features' },
        { text: 'Troubleshooting', link: '/guide/troubleshooting' },
      ],
      '/reference/': [
        { text: 'Commands', link: '/reference/commands' },
        { text: 'Configuration', link: '/reference/configuration' },
      ],
      '/development/': [
        { text: 'Changelog', link: '/development/changelog' },
      ],
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/Guizzz/VHDL-Essentials' },
    ],
  },
})
