import {chainUrl, setupContracts, setupWeb3} from './utils/setup_utils';
import {parseArgs, printHelp, printInfo, printSuccess} from './utils/dialog_utils';
import {defineBlockRange} from './utils/event_utils';
import {IChallenge, IEvent} from './utils/type_utils';
import {saveData} from './utils/file_utils';
import _ from 'lodash';
import asciiHistogram from 'ascii-histogram';

const additionalOptions = [{
  name: 'bins',
  alias: 'b',
  defaultValue: 10,
  type: Number,
  description: 'Maximal number of bins in the block histogram'
}];

const fetchEventsFromBlockchain = async (options): Promise<{
  newChallengesEvents: IEvent[],
  resolvedChallengesEvents: IEvent[],
  timedOutChallengesEvents: IEvent[],
  toBlock: number,
  fromBlock: number
}> => {
  if (!options.blockcount || options.blockcount < 0) {
    printHelp({
        header: 'Challenge stats',
        content: 'Prints challenges statistics from several newest blocks.'
      }, additionalOptions
    );
    throw '';
  }
  printInfo('Connecting to the chain...');
  const web3 = await setupWeb3(options.rpc || chainUrl(options.env));
  const {blockchainStateWrapper, challengesEventEmitterWrapper} = await setupContracts(web3, options.headcontract);
  const {toBlock, fromBlock} = await defineBlockRange(blockchainStateWrapper, options.blockcount);
  printInfo(`Fetching ${options.blockcount} blocks (${fromBlock} -> ${toBlock})`);
  const newChallengesEvents = await challengesEventEmitterWrapper.challenges(fromBlock, toBlock);
  const resolvedChallengesEvents = await challengesEventEmitterWrapper.resolvedChallenges(fromBlock, toBlock);
  const timedOutChallengesEvents = await challengesEventEmitterWrapper.timedOutChallenges(fromBlock, toBlock);
  return {newChallengesEvents, resolvedChallengesEvents, timedOutChallengesEvents, toBlock, fromBlock};
};

const printChallengesCount = (challenges: { createdChallenges: IChallenge[], resolvedChallenges: IChallenge[], timedOutChallenges: IChallenge[] }) => {
  printInfo(`
New challenges: ${challenges.createdChallenges.length}  
Resolved challenges: ${challenges.resolvedChallenges.length} 
Timed out challenges: ${challenges.timedOutChallenges.length}`);
};

const printChallengesCreatedByShelterer = (createdChallenges: IChallenge[]) => {
  const challengesCreatedByShelterer = _(createdChallenges)
    .groupBy((challenge) => challenge.sheltererId)
    .mapValues((challenges) => challenges.length);
  printInfo(`\nChallenges by shelterer:`);
  console.log(JSON.stringify(challengesCreatedByShelterer, null, 2));
};

const printChallengeHistogram = (createdChallenges: IChallenge[], fromBlock: number, toBlock: number, binCount: number = 10) => {
  const blockCount = toBlock - fromBlock + 1;
  const binLength = Math.ceil(blockCount / binCount);
  const bins = _(createdChallenges)
    .map((challenge) => Math.floor((challenge.blockNumber - fromBlock) / binLength))
    .countBy((x) => x)
    .value();

  const namedHistogram = {};
  for (let i = 0; i < binCount; i++) {
    if (fromBlock + binLength * i > toBlock) {
      break;
    }
    namedHistogram[`${fromBlock + binLength * i}-${Math.min(fromBlock + binLength * (i + 1) - 1, toBlock)}`] = bins[i] || 0;
  }
  printInfo('\nNew challenges by block histogram');
  console.log(asciiHistogram(namedHistogram));
};

const extractDataFromEvent = (events: IEvent[], lastParamName: 'count' | 'resolverId' | 'penalty'): IChallenge[] => events.map((event) => ({
  blockHash: event.blockHash,
  blockNumber: event.blockNumber,
  transactionHash: event.transactionHash,
  signature: event.signature,
  sheltererId: event.returnValues.sheltererId,
  bundleId: event.returnValues.bundleId,
  challengeId: event.returnValues.challengeId,
  [lastParamName]: event.returnValues[lastParamName]
}));

const fetchChallengeStats = async (): Promise<void> => {
  const options = parseArgs(additionalOptions);
  const {newChallengesEvents, resolvedChallengesEvents, timedOutChallengesEvents, fromBlock, toBlock} = await fetchEventsFromBlockchain(options);
  const totalEventsCount = newChallengesEvents.length + resolvedChallengesEvents.length + timedOutChallengesEvents.length;
  printInfo(`${totalEventsCount} events successfully extracted`);
  const challenges = {
    createdChallenges: extractDataFromEvent(newChallengesEvents, 'count'),
    resolvedChallenges: extractDataFromEvent(resolvedChallengesEvents, 'resolverId'),
    timedOutChallenges: extractDataFromEvent(timedOutChallengesEvents, 'penalty')
  };
  printChallengesCount(challenges);
  printChallengesCreatedByShelterer(challenges.createdChallenges);
  printChallengeHistogram(challenges.createdChallenges, fromBlock, toBlock, options.bins);

  if (options.out) {
    printInfo(`Saving output...`);
    await saveData(challenges, options.out);
    printSuccess(`Done!`);
  } else {
    console.log(JSON.stringify(challenges, null, 2));
  }
};

fetchChallengeStats().catch(console.error);
