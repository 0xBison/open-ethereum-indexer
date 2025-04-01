export default {
  logo: <span>Open Ethereum Indexer</span>,
  project: {
    link: 'https://github.com/0xBison/open-ethereum-indexer-new'
  },
  docsRepositoryBase: 'https://github.com/0xBison/open-ethereum-indexer-new/tree/main/docs',
  useNextSeoProps() {
    return {
      titleTemplate: '%s – Open Ethereum Indexer'
    }
  },
  primaryHue: 210,
  navigation: {
    prev: true,
    next: true
  },
  footer: {
    text: 'MIT - Open Ethereum Indexer.'
  }
} 