import { onEvent } from '@open-ethereum/indexer';
import { BigNumber, ethers } from 'ethers';

onEvent('USDT:Transfer', {
  onIndex: async (payload) => {
    // console.log('USDT Transfer in transaction', payload.log.transactionHash);

    const transferAmount = BigNumber.from(payload.parsedEvent.args[2]);

    // console.log('Transfer amount', ethers.utils.formatUnits(transferAmount, 6));

    if (transferAmount.gt(BigNumber.from('1000000000000000000'))) {
      // console.log('Large transfer detected', payload.log.transactionHash);
    }
  },
});
