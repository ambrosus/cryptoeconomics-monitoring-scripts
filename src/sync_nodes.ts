import {setupWeb3, setupContracts} from './utils/setup_utils';
import {printInfo, setupBar, printSuccess} from './utils/dialog_utils';
import {saveData} from './utils/file_utils';
import {sortChronologically, convertRoleCodeToRoleName, convertWeiToAmber} from './utils/event_utils';

const syncBundles = async (): Promise<void> => {
  const web3 = await setupWeb3(process.env.ENVIRONMENT);

  const {blockchainStateWrapper, rolesEventEmitterWrapper} = await setupContracts(web3);
  const currentBlockNumber = await blockchainStateWrapper.getCurrentBlockNumber();

  printInfo(`Fetching ${currentBlockNumber} blocks`);
  const nodeOnboardingEvents = await rolesEventEmitterWrapper.nodeOnboardings(0, currentBlockNumber);
  const nodeRetirementEvents = await rolesEventEmitterWrapper.nodeRetirements(0, currentBlockNumber);
  const nodeUrlChangeEvents = await rolesEventEmitterWrapper.nodeUrlChanges(0, currentBlockNumber);
  const gatheredEvents = [...nodeOnboardingEvents, ...nodeRetirementEvents, ...nodeUrlChangeEvents];
  const totalEventsNumber: number = gatheredEvents.length;
  printInfo(`${totalEventsNumber} events successfully extracted`);

  printInfo(`Sorting events...`);
  const sortedEvents = sortChronologically(gatheredEvents);

  printInfo(`Processing events...`);
  const progressBar = await setupBar(totalEventsNumber);

  let nodesState = {};

  for(let index = 0; index < totalEventsNumber; index++) {
    const nodeAddress = sortedEvents[index].returnValues.nodeAddress;
    switch(sortedEvents[index].event) {
      case 'NodeOnboarded':
        nodesState[nodeAddress] = {
          nodeAddress,
          role: convertRoleCodeToRoleName(sortedEvents[index].returnValues.role),
          deposit: convertWeiToAmber(sortedEvents[index].returnValues.placedDeposit),
          url: sortedEvents[index].returnValues.nodeUrl
        };
        break;
      case 'NodeUrlChanged':
        nodesState[nodeAddress].url = sortedEvents[index].returnValues.nodeUrl;
        break;
      case 'NodeRetired':
        delete nodesState[nodeAddress];
        break;
    }
    progressBar.increment(1);
  }

  printInfo(`Saving output...`);
  const nodeStateArray = Object.values(nodesState);
  await saveData(nodeStateArray, 'nodes.json');

  printSuccess(`Done!`);
};

syncBundles().catch(console.log);
