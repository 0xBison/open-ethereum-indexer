import {
  onEvent,
  onBlock,
} from 'core-module/event-manager/event-manager.service';

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
