import withNextra from 'nextra';

const withNextraConfig = withNextra({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.jsx',
  defaultShowCopyCode: true,
  flexsearch: {
    codeblocks: true,
  },
  staticImage: true,
});

export default withNextraConfig({
  reactStrictMode: true,
});
