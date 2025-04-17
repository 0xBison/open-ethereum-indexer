import withNextra from 'nextra';

const withNextraConfig = withNextra({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.jsx',
  defaultShowCopyCode: true,
  staticImage: true,
  search: false,
});

export default withNextraConfig({
  reactStrictMode: true,
  i18n: {
    locales: ['en'],
    defaultLocale: 'en',
  },
});
