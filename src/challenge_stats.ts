import {chainUrl, setupContracts, setupWeb3} from './utils/setup_utils';
import {parseArgs, printHelp, printInfo, printSuccess} from './utils/dialog_utils';
import {defineBlockRange} from './utils/event_utils';
import {IChallenge, ICreatedChallenge, IEvent, IResolvedChallenge, ITimedOutChallenge} from './utils/type_utils';
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
    throw new Error('');
  }
  printInfo('Connecting to the chain...');
  const web3 = await setupWeb3(options.rpc || chainUrl(options.env));
  const {blockchainStateWrapper, challengesEventEmitterWrapper} = await setupContracts(web3, options.headcontract);
  const {fromBlock, toBlock} = await defineBlockRange(blockchainStateWrapper, options.blockcount);
  printInfo(`Fetching ${options.blockcount} blocks (${fromBlock} -> ${toBlock})`);
  const newChallengesEvents = await challengesEventEmitterWrapper.challenges(fromBlock, toBlock);
  const resolvedChallengesEvents = await challengesEventEmitterWrapper.resolvedChallenges(fromBlock, toBlock);
  const timedOutChallengesEvents = await challengesEventEmitterWrapper.timedOutChallenges(fromBlock, toBlock);
  return {newChallengesEvents, resolvedChallengesEvents, timedOutChallengesEvents, fromBlock, toBlock};
};

const printChallengesCount = (challenges: { createdChallenges: ICreatedChallenge[], resolvedChallenges: IResolvedChallenge[], timedOutChallenges: ITimedOutChallenge[] }) => {
  printInfo(`
New challenges: ${challenges.createdChallenges.length}
Resolved challenges: ${challenges.resolvedChallenges.length}
Timed out challenges: ${challenges.timedOutChallenges.length}`);
};

const printChallengesCreatedByShelterer = (createdChallenges: ICreatedChallenge[]) => {
  const challengesCreatedByShelterer = _(createdChallenges)
    .groupBy((challenge) => challenge.sheltererId)
    .mapValues((challenges) => challenges.length);
  printInfo(`\nChallenges by shelterer:`);
  console.log(JSON.stringify(challengesCreatedByShelterer, null, 2));
};

const printChallengeHistogram = (createdChallenges: ICreatedChallenge[], fromBlockInclusive: number, toBlockInclusive: number, binCount: number = 10) => {
  const blockCount = toBlockInclusive - fromBlockInclusive + 1;
  const binLength = Math.ceil(blockCount / binCount);
  const bins = _(createdChallenges)
    .map((challenge) => Math.floor((challenge.blockNumber - fromBlockInclusive) / binLength))
    .countBy(_.identity())
    .value();

  const namedHistogram = {};
  for (let i = 0; i < binCount; i++) {
    const binStartBlock = fromBlockInclusive + binLength * i;
    const binEndBlock = Math.min(fromBlockInclusive + binLength * (i + 1) - 1, toBlockInclusive);
    if (binStartBlock > binEndBlock) {
      break;
    }
    namedHistogram[`${binStartBlock}-${binEndBlock}`] = bins[i] || 0;
  }
  printInfo('\nNew challenges by block histogram');
  console.log(asciiHistogram(namedHistogram));
};

const extractDataFromEvents = (events: IEvent[], lastParamName: 'count' | 'resolverId' | 'penalty'): IChallenge[] =>
  events.map((event) => ({
    blockHash: event.blockHash,
    blockNumber: event.blockNumber,
    transactionHash: event.transactionHash,
    signature: event.signature,
    sheltererId: event.returnValues.sheltererId,
    bundleId: event.returnValues.bundleId,
    challengeId: event.returnValues.challengeId,
    [lastParamName]: event.returnValues[lastParamName]
  }));

const extractCreatedChallengesFromEvents = (events: IEvent[]): ICreatedChallenge[] => extractDataFromEvents(events, 'count') as ICreatedChallenge[];

const extractResolvedChallengesFromEvents = (events: IEvent[]): IResolvedChallenge[] => extractDataFromEvents(events, 'resolverId') as IResolvedChallenge[];

const extractTimedOutChallengesFromEvents = (events: IEvent[]): ITimedOutChallenge[] => extractDataFromEvents(events, 'penalty') as ITimedOutChallenge[];

const fetchChallengeStats = async (): Promise<void> => {
  const options = parseArgs(additionalOptions);
  const {newChallengesEvents, resolvedChallengesEvents, timedOutChallengesEvents, fromBlock, toBlock} = await fetchEventsFromBlockchain(options);
  const totalEventsCount = newChallengesEvents.length + resolvedChallengesEvents.length + timedOutChallengesEvents.length;
  printInfo(`${totalEventsCount} events successfully extracted`);
  const challenges = {
    createdChallenges: extractCreatedChallengesFromEvents(newChallengesEvents),
    resolvedChallenges: extractResolvedChallengesFromEvents(resolvedChallengesEvents),
    timedOutChallenges: extractTimedOutChallengesFromEvents(timedOutChallengesEvents)
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
