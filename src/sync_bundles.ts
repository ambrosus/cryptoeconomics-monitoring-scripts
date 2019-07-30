import {setupWeb3, setupContracts, chainUrl} from './utils/setup_utils';
import {defineBlockRange} from './utils/event_utils';
import {printInfo, setupBar, presentResults, printHelp, parseArgs} from './utils/dialog_utils';
import path from 'path';

const syncBundles = async (): Promise<void> => {
  const options = parseArgs();
  const web3 = await setupWeb3(options.rpc || chainUrl(options.env));
  if (!options.blockcount || options.blockcount < 0) {
    printHelp({
      header: 'Bundles',
      content: 'Gathers info about latest bundle uploads.'
    });
    return;
  }

  const {bundleStoreWrapper, shelteringWrapper, blockchainStateWrapper, rolesWrapper} = await setupContracts(web3, options.headcontract);
  const {toBlock, fromBlock} = await defineBlockRange(blockchainStateWrapper, options.blockcount);

  printInfo(`Fetching ${options.blockcount} blocks (${fromBlock} -> ${toBlock})`);
  const bundleStorageEvents = await bundleStoreWrapper.bundlesStored(fromBlock, toBlock);
  if (bundleStorageEvents.length === 0) {
    printInfo('No events were found');
    return;
  }
  printInfo(`${bundleStorageEvents.length} events successfully extracted`);

  printInfo(`Processing events...`);
  const progressBar = await setupBar(bundleStorageEvents.length);

  const gatheredBundlesData = [];

  for (const bundleStorageEvent of bundleStorageEvents) {
    const bundleDataFromEvent = {
      bundleId: bundleStorageEvent.returnValues.bundleId,
      uploaderId: bundleStorageEvent.returnValues.uploader,
      blockHash: bundleStorageEvent.blockHash,
      blockNumber: bundleStorageEvent.blockNumber,
      transactionHash: bundleStorageEvent.transactionHash,
      signature: bundleStorageEvent.signature
    };

    const storagePeriods =  await shelteringWrapper.bundleStoragePeriods(bundleDataFromEvent.bundleId);
    const nodeUrl = await rolesWrapper.nodeUrl(bundleDataFromEvent.uploaderId);
    const bundleUrl = path.join(nodeUrl, 'bundle', bundleDataFromEvent.bundleId);
    const completeBundleData = {...bundleDataFromEvent, storagePeriods, bundleUrl};

    gatheredBundlesData.push(completeBundleData);
    progressBar.increment(1);
  }
  await presentResults(gatheredBundlesData, options.out);
};

syncBundles().catch(console.error);
