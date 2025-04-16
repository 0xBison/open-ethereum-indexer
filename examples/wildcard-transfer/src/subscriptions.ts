import { onEvent } from '@open-ethereum/indexer';

onEvent('*:Transfer', {
  onIndex: async (payload) => {
    const contractAddress = payload.log.address;

    const USDT = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
    const DAI = '0x6B175474E89094C44Da98b954EedeAC495271d0F';

    // Only log for relevant events (dai or usdt)
    if (contractAddress === USDT) {
      console.log('USDT Transfer');
      // console.log('Payload', JSON.stringify(payload, null, 2));
    } else if (contractAddress === DAI) {
      console.log('DAI Transfer');
      // console.log('Payload', JSON.stringify(payload, null, 2));
    }
  },
});
