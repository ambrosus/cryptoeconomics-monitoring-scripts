import {setupWeb3, setupContracts, defineBlockRange, chainUrl} from './utils/setup_utils';
import {printInfo, setupBar, printSuccess, printHelp, parseArgs} from './utils/dialog_utils';
import {saveData} from './utils/file_utils';
import path from 'path';

const syncBundles = async (): Promise<void> => {
  const options = parseArgs();
  const web3 = await setupWeb3(chainUrl(options.env));
  if (!options.blockcount || options.blockcount < 0) {
    printHelp({
      header: 'Bundles',
      content: 'Gathers latest bundles.'
    });
    return;
  }

  const {bundleStoreWrapper, shelteringWrapper, blockchainStateWrapper, rolesWrapper} = await setupContracts(web3);
  const {toBlock, fromBlock} = await defineBlockRange(blockchainStateWrapper, options.blockcount);

  printInfo(`Fetching ${options.blockcount} blocks (${fromBlock} -> ${toBlock})`);
  const bundleStorageEvents = await bundleStoreWrapper.bundlesStored(fromBlock, toBlock);
  printInfo(`${bundleStorageEvents.length} events successfully extracted`);

  printInfo(`Processing events...`);
  const progressBar = await setupBar(bundleStorageEvents.length);

  const gatheredBundlesData = [];

  for(let index = 0; index < bundleStorageEvents.length; index++) {
    const bundleDataFromEvent = {
      bundleId: bundleStorageEvents[index].returnValues.bundleId,
      uploaderId: bundleStorageEvents[index].returnValues.uploader,
      blockHash: bundleStorageEvents[index].blockHash,
      blockNumber: bundleStorageEvents[index].blockNumber,
      transactionHash: bundleStorageEvents[index].transactionHash,
      signature: bundleStorageEvents[index].signature
    };

    const storagePeriods =  await shelteringWrapper.bundleStoragePeriods(bundleDataFromEvent.bundleId);
    const nodeUrl = await rolesWrapper.nodeUrl(bundleDataFromEvent.uploaderId);
    const bundleUrl = path.join(nodeUrl, 'bundle', bundleDataFromEvent.bundleId);
    const completeBundleData = {...bundleDataFromEvent, storagePeriods, bundleUrl};

    gatheredBundlesData.push(completeBundleData);
    progressBar.increment(1);
  }

  if (options.out) {
    printInfo(`Saving output...`);
    await saveData(gatheredBundlesData, options.out);
    printSuccess(`Done!`);
  } else {
    console.log(JSON.stringify(gatheredBundlesData, null, 2));
  }
};

syncBundles().catch(console.error);
