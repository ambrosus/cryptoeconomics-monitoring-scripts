import {chainUrl, setupContracts, setupWeb3} from './utils/setup_utils';
import {parseArgs, printHelp, printInfo, printSuccess} from './utils/dialog_utils';
import {defineBlockRange} from './utils/event_utils';
import {
  IChallenge,
  ICreatedChallenge,
  IEvent,
  IResolvedChallenge,
  ITierStat,
  ITimedOutChallenge
} from './utils/type_utils';
import {saveData} from './utils/file_utils';
import _, {LoDashImplicitWrapper} from 'lodash';
import asciiHistogram from 'ascii-histogram';
import chalk from 'chalk';

type Lodash<T> = LoDashImplicitWrapper<T>;

const additionalOptions = [{
  name: 'bins',
  alias: 'b',
  defaultValue: 10,
  type: Number,
  description: 'Maximal number of bins in the block histogram'
}];

export const formatStake = (stake: string): string => stake.replace(/0{21}$/, 'K');

export const formatDeviation = (mean: number, value: number): string => value > mean
  ? chalk.green(`+${((value - mean) * 100 / mean).toFixed(2)}%`)
  : chalk.red(`-${((mean - value) * 100 / mean).toFixed(2)}%`);

export const formatNodeChallengeStats = (resolverId: string, resolvedCount: number, tier: string, tierResolutionCountMean: number): string =>
  `${resolverId}(${formatStake(tier)}): ${resolvedCount} (${formatDeviation(tierResolutionCountMean, resolvedCount)})`;

export const formatResolutionsByTiers = (challengesByTier) => _(challengesByTier)
  .mapValues(({min, max, count, mean, total}) => `total: ${total} nodes: ${count} mean: ${mean.toFixed(2)} min: ${min} max: ${max}`)
  .mapKeys((_, stake) => formatStake(stake))
  .value();

export const formatDistribution = (valueByTier: Lodash<{[stake: string]: number}>): string => {
  const sum = valueByTier.values().sum();
  return valueByTier
    .toPairs()
    .sortBy(([stake]) => -Number(stake))
    .map(([, value]) => Math.round(value * 100 / sum))
    .join('/');
};

export const getChallengesCreatedByResolverCount = (resolvedChallenges: IResolvedChallenge[]): Lodash<{ [resolverId: string]: number }> => _(resolvedChallenges)
  .groupBy((challenge) => challenge.resolverId)
  .mapValues((challenges) => challenges.length);

export const mapResolversToStakes = async (challengesCreatedByResolverCount: Lodash<{ [resolverId: string]: number }>,
                                           atlasStakeStoreWrapper): Promise<Lodash<{ [address: string]: string }>> => {
  const resolversWithStakesPromises = challengesCreatedByResolverCount
    .keys()
    .map((resolverId) => getResolversStakes(resolverId, atlasStakeStoreWrapper)).value();
  return _(await Promise.all(resolversWithStakesPromises)).keyBy('address').mapValues('stake');
};

export const getResolversStakes = async (address, atlasStakeStoreWrapper): Promise<{ address: string, stake: string }> => {
  return {
    address,
    stake: await (await atlasStakeStoreWrapper.contract()).methods.getStake(address).call()
  };
};

export const getChallengesByTierStats = (challengesCreatedByResolverCount: Lodash<{ [resolverId: string]: number }>,
                                         resolversWithStakes: Lodash<{ [address: string]: string }>): { [stake: string]: ITierStat } =>
  resolversWithStakes
    .invertBy()
    .mapValues((addresses) => _(addresses).map((address) => challengesCreatedByResolverCount.get(address)))
    .mapValues((resolvedChallenges) => ({
      mean: resolvedChallenges.mean(),
      total: resolvedChallenges.sum(),
      min: resolvedChallenges.min(),
      max: resolvedChallenges.max(),
      count: resolvedChallenges.size()
    }))
    .value();

export const sortedResolvedChallengesCountByTier = (challengesCreatedByResolverCount: Lodash<{ [resolverId: string]: number }>,
                                                    resolversWithStakes: Lodash<{ [address: string]: string }>): Lodash<[string, number][]> => challengesCreatedByResolverCount
  .toPairs()
  .sortBy(([resolverId]) => -Number(resolversWithStakes.get(resolverId)));

export const getChallengeResolutionTimeStats = (createdChallenges: ICreatedChallenge[], resolvedChallenges: IResolvedChallenge[]): {
  mean?: number, median?: number, max?: number, min?: number, count: number
} => {
  const createdChallengeBlocks = _(createdChallenges).keyBy('challengeId').mapValues('blockNumber').value();
  const challengeResolutionTimes = _(resolvedChallenges)
    .filter(({challengeId}) => createdChallengeBlocks[challengeId] !== undefined)
    .map(({challengeId, blockNumber}) => blockNumber - createdChallengeBlocks[challengeId]);

  if (challengeResolutionTimes.size() === 0) {
    return {count: 0};
  }
  return {
    mean: challengeResolutionTimes.mean(),
    median: challengeResolutionTimes.sort().nth(challengeResolutionTimes.size() / 2),
    max: challengeResolutionTimes.max(),
    min: challengeResolutionTimes.min(),
    count: challengeResolutionTimes.size()
  };
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

const printChallengesByResolver = async (resolvedChallenges: IResolvedChallenge[], atlasStakeStoreWrapper) => {
  const challengesCreatedByResolverCount = getChallengesCreatedByResolverCount(resolvedChallenges);
  const resolversWithStakes = await mapResolversToStakes(challengesCreatedByResolverCount, atlasStakeStoreWrapper);
  const challengesByTiers = getChallengesByTierStats(challengesCreatedByResolverCount, resolversWithStakes);

  printInfo(`\nChallenges by resolver:`);
  sortedResolvedChallengesCountByTier(challengesCreatedByResolverCount, resolversWithStakes)
    .forEach(([resolverId, count]) => console.log(
      formatNodeChallengeStats(resolverId, count, resolversWithStakes.get(resolverId), challengesByTiers[resolversWithStakes.get(resolverId)].mean)));

  printInfo(`\nResolutions in Atlas tier groups`);
  console.log(JSON.stringify(formatResolutionsByTiers(challengesByTiers), null, 2));

  printInfo('Distribution of resolutions (group total)');
  console.log(formatDistribution(_(challengesByTiers).mapValues('total')));
  printInfo('Distribution of resolutions (by tier)');
  console.log(formatDistribution(_(challengesByTiers).mapValues('mean')));
};

const printChallengeHistogram = (challenges: IChallenge[], fromBlockInclusive: number, toBlockInclusive: number, binCount: number = 10) => {
  const blockCount = toBlockInclusive - fromBlockInclusive + 1;
  const binLength = Math.ceil(blockCount / binCount);
  const bins = _(challenges)
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
  console.log(asciiHistogram(namedHistogram));
};

const printChallengeResolutionTimeStats = (createdChallenges: ICreatedChallenge[], resolvedChallenges: IResolvedChallenge[]) => {
  const {mean, median, max, min, count} = getChallengeResolutionTimeStats(createdChallenges, resolvedChallenges);

  if (count === 0) {
    printInfo('\nNo challenges were both created and resolved in this block range');
    return;
  }

  printInfo(`Challenge resolution times:
    challenges: ${count}
    avg: ${mean.toFixed(2)} blocks
    median: ${median} blocks
    min: ${min} blocks
    max: ${max} blocks`);
};

const printTotalChallengesCount = (challenges: { createdChallenges: any[], resolvedChallenges: any[], timedOutChallenges: any[] }): void => {
  const totalEventsCount = challenges.createdChallenges.length + challenges.resolvedChallenges.length + challenges.timedOutChallenges.length;
  printInfo(`${totalEventsCount} events successfully extracted`);
};

const saveChallenges = async (options, challenges): Promise<void> => {
  if (options.out) {
    printInfo(`Saving output...`);
    await saveData(challenges, options.out);
    printSuccess(`Done!`);
  } else {
    console.log(JSON.stringify(challenges, null, 2));
  }
};

const fetchEventsFromBlockchain = async (options, blockchainStateWrapper, challengesEventEmitterWrapper): Promise<{
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
  const {fromBlock, toBlock} = await defineBlockRange(blockchainStateWrapper, options.blockcount);
  printInfo(`Fetching ${options.blockcount} blocks (${fromBlock} -> ${toBlock})`);
  const newChallengesEvents = await challengesEventEmitterWrapper.challenges(fromBlock, toBlock);
  const resolvedChallengesEvents = await challengesEventEmitterWrapper.resolvedChallenges(fromBlock, toBlock);
  const timedOutChallengesEvents = await challengesEventEmitterWrapper.timedOutChallenges(fromBlock, toBlock);
  return {newChallengesEvents, resolvedChallengesEvents, timedOutChallengesEvents, fromBlock, toBlock};
};

const fetchChallenges = async (options): Promise<{
  challenges: {
    createdChallenges: ICreatedChallenge[],
    resolvedChallenges: IResolvedChallenge[],
    timedOutChallenges: ITimedOutChallenge[]
  },
  atlasStakeStoreWrapper: any,
  fromBlock: number,
  toBlock: number
}> => {
  const web3 = await setupWeb3(options.rpc || chainUrl(options.env));
  const {blockchainStateWrapper, challengesEventEmitterWrapper, atlasStakeStoreWrapper} = await setupContracts(web3, options.headcontract, options.validatorsetcontract);
  const {newChallengesEvents, resolvedChallengesEvents, timedOutChallengesEvents, fromBlock, toBlock} = await fetchEventsFromBlockchain(options, blockchainStateWrapper, challengesEventEmitterWrapper);
  return {
    challenges: {
      createdChallenges: extractCreatedChallengesFromEvents(newChallengesEvents),
      resolvedChallenges: extractResolvedChallengesFromEvents(resolvedChallengesEvents),
      timedOutChallenges: extractTimedOutChallengesFromEvents(timedOutChallengesEvents)
    },
    atlasStakeStoreWrapper,
    fromBlock,
    toBlock
  };
};

const fetchChallengeStats = async (): Promise<void> => {
  const options = parseArgs(additionalOptions);
  printInfo('Connecting to the chain...');
  const {challenges, atlasStakeStoreWrapper, fromBlock, toBlock} = await fetchChallenges(options);

  printTotalChallengesCount(challenges);
  printChallengesCount(challenges);
  printChallengesCreatedByShelterer(challenges.createdChallenges);
  await printChallengesByResolver(challenges.resolvedChallenges, atlasStakeStoreWrapper);
  printInfo('\nNew challenges by block histogram');
  printChallengeHistogram(challenges.createdChallenges, fromBlock, toBlock, options.bins);
  printInfo('\nResolved challenges by block histogram');
  printChallengeHistogram(challenges.resolvedChallenges, fromBlock, toBlock, options.bins);
  printChallengeResolutionTimeStats(challenges.createdChallenges, challenges.resolvedChallenges);

  await saveChallenges(options, challenges);
};

if (require.main === module) {
  fetchChallengeStats().catch(console.error);
}
