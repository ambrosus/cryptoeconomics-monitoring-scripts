import {EventLog} from 'web3/types';

interface IBlockRange {
  fromBlock: number;
  toBlock: number;
}

interface IEvent extends EventLog {
  signature: string;
  type: string;
  id: string;
}

interface IChallenge {
  blockHash: string;
  blockNumber: number;
  transactionHash: string;
  signature: string;
  sheltererId: string;
  bundleId: string;
  challengeId: string;
}

interface ICreatedChallenge extends IChallenge {
  count: string;
}

interface IResolvedChallenge extends IChallenge {
  resolverId: string;
}

interface ITimedOutChallenge extends IChallenge {
  penalty: string;
}

export {IBlockRange, IEvent, ICreatedChallenge, IResolvedChallenge, ITimedOutChallenge, IChallenge};
