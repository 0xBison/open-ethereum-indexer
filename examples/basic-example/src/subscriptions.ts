import { onEvent, onBlock } from '@open-ethereum/indexer';

onEvent('*:*', {
  onIndex: async (payload) => {
    console.log('ON EVENT');
  },
});

onBlock({
  onIndex: async (payload) => {
    console.log('ON BLOCK');
  },
});
