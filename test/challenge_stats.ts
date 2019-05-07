import {expect} from 'chai';
import {
  formatDeviation,
  formatNodeChallengeStats,
  formatResolutionsByTiers,
  formatStake,
  getChallengeResolutionTimeStats,
  getChallengesByTierStats,
  getChallengesCreatedByResolverCount,
  getResolversStakes,
  mapResolversToStakes
} from '../src/challenge_stats';
import sinon from 'sinon';
import chalk from 'chalk';
import _ from 'lodash';

const exampleResolvedChallenges = [{
  'blockHash': '0x490f9391d567c886c95af5100807d1cc53addbf6613ebce52a39293453fccacc',
  'blockNumber': 3,
  'transactionHash': '0xa7efeb973939637db9fa598f789cb9e005fdb509c73d32f712549907845a63bc',
  'signature': '0xc41c4f7876f06c7cc0a703943640fa09462f0cf52a72f1581647105e923b1515',
  'sheltererId': '0x34e33a0db24Db4bc68aEc1754392b80df0B3BD7E',
  'bundleId': '0x129b7e5132d75bacb5d0551ccd58f879acf38cd7dbe5324b1829b395273f69c2',
  'challengeId': '0x13c6ee95f83f307c1fa16133dab05850af95852439917f77c5ed31b7a6ca5298',
  'resolverId': '0x3DA7f459F3f5aE152c00fA99956E169CFFAC8113'
}, {
  'blockHash': '0x43ca0bd241e3e47642b99116b863fe55af2e157a7e29f72741ba72cc9a89fb63',
  'blockNumber': 4,
  'transactionHash': '0x1158d5d4e1a0506edc00f75ae9fff772df97981216f64ba40711df0ff3170243',
  'signature': '0xc41c4f7876f06c7cc0a703943640fa09462f0cf52a72f1581647105e923b1515',
  'sheltererId': '0x34e33a0db24Db4bc68aEc1754392b80df0B3BD7E',
  'bundleId': '0xd892a2b253200a174b72f91633beb160c465c4ce50819207ca9deff2a87ae69d',
  'challengeId': '0xeebad8d614fd3d3b4d66fce016df71aa686e694858b324fb5eeb9a426d5d893c',
  'resolverId': '0x3DA7f459F3f5aE152c00fA99956E169CFFAC8113'
}, {
  'blockHash': '0x62ee83cf8cb39cfce1cdc8a6fc4a6dd90fee944f7ec9484a6b387629e2445c7f',
  'blockNumber': 5,
  'transactionHash': '0xe7d6205a47eecbb1c75ebe13e045431fe5542821c5f444c1766bbbca92053805',
  'signature': '0xc41c4f7876f06c7cc0a703943640fa09462f0cf52a72f1581647105e923b1515',
  'sheltererId': '0x34e33a0db24Db4bc68aEc1754392b80df0B3BD7E',
  'bundleId': '0xd43b041479b8a0eeb3f3be80b5aa9ec647d80382839f29f3441c1a0ae63ebcf7',
  'challengeId': '0xeebad8d614fd3d3b4d66fce016df71aa686e694858b324fb5eeb9a426d5d893c',
  'resolverId': '0xd9fe74fdef150d8603a8087634c3ac3a5879d07a'
}, {
  'blockHash': '0x4576816d0f379b8768532725f5b5e9bd494e9677ab6b750b7a6cb81af1d15835',
  'blockNumber': 5,
  'transactionHash': '0x1e41300a0bcc8599a88b3d3398605e582f4abe6fbcb84a5b52a461be36030b4f',
  'signature': '0xc41c4f7876f06c7cc0a703943640fa09462f0cf52a72f1581647105e923b1515',
  'sheltererId': '0x34e33a0db24Db4bc68aEc1754392b80df0B3BD7E',
  'bundleId': '0x7c40500447564d1bba4b7c1861fe29cff6a0a5007d70bebd08afd535496230d5',
  'challengeId': '0x947e33af1fe14a6a1ac9b0fc3b3edf8377f4f503d6f86714ba9b1b908b64131a',
  'resolverId': '0x3DA7f459F3f5aE152c00fA99956E169CFFAC8113'
}, {
  'blockHash': '0x8f46a0ea08bce0123acceeb652388a860d6524e98cc47c4e13e6e7164c9004e4',
  'blockNumber': 7,
  'transactionHash': '0x8ad6ff49b942ba5da2042b7f5e75fdbaecd180bf24d64a5114417bba384b914b',
  'signature': '0xc41c4f7876f06c7cc0a703943640fa09462f0cf52a72f1581647105e923b1515',
  'sheltererId': '0x34e33a0db24Db4bc68aEc1754392b80df0B3BD7E',
  'bundleId': '0x55682a94bdf5631f48babb6e57e47035ad27711143248108ed8e4f21a4e5d426',
  'challengeId': '0x15769708c478d3a630392ec326363f305b3415371e07fb0190d2abc1d5d16520',
  'resolverId': '0xd9fe74fdef150d8603a8087634c3ac3a5879d07a'
}];

const exampleCreatedChallenges = [{
  'blockHash': '0xe0358303226590a378806e0b173c64647ee8214c5aa766cd423efdc0b00e6a88',
  'blockNumber': 1,
  'transactionHash': '0x7cae3710cb4aa5adf938c974eedf79417855e43952b5dc5eae2406fd5f4825f9',
  'signature': '0x4bb60c70c855d1e4648041fe41e7f4e12b95dd17b47bf19aa292a782c47578be',
  'sheltererId': '0x2d5305f083d27799a4977d189991756eae8B84cd',
  'bundleId': '0xf1adf583a068415c66feb7e23a5a0b3f085b0cdf27e65a154788c120acaecdb6',
  'challengeId': '0x13c6ee95f83f307c1fa16133dab05850af95852439917f77c5ed31b7a6ca5298',
  'count': '7'
}, {
  'blockHash': '0xe0358303226590a378806e0b173c64647ee8214c5aa766cd423efdc0b00e6a88',
  'blockNumber': 2,
  'transactionHash': '0x496b31070bbed828c38fd23bf1e9b9bf1ddadad5822a8445661008480171f0a2',
  'signature': '0x4bb60c70c855d1e4648041fe41e7f4e12b95dd17b47bf19aa292a782c47578be',
  'sheltererId': '0xA5354B6A510221Ca73ad36E06217dedC545c1bA4',
  'bundleId': '0xdcf5d8254f3054ac0d8287088bddbc731a4bcb7650b9330829c9e5b7cc045ca3',
  'challengeId': '0xeebad8d614fd3d3b4d66fce016df71aa686e694858b324fb5eeb9a426d5d893c',
  'count': '7'
}, {
  'blockHash': '0xc6608e68dee2020103a0ea77a84c718594f5a8984343555703166378ba4bfb65',
  'blockNumber': 2,
  'transactionHash': '0xce9a8d20b4cc5d58401f34f8e6d66b07d957b84ff289058f8a8dc42026c5bd3a',
  'signature': '0x4bb60c70c855d1e4648041fe41e7f4e12b95dd17b47bf19aa292a782c47578be',
  'sheltererId': '0x6717083A10aa3137E3748C41ac22B1bA73B5D6e7',
  'bundleId': '0xed06bdbf629af2c9d74fcb6761c483a0a605d47460ec989e409bb04bc2896f00',
  'challengeId': '0x947e33af1fe14a6a1ac9b0fc3b3edf8377f4f503d6f86714ba9b1b908b64131a',
  'count': '7'
}, {
  'blockHash': '0xab829004ab20328bf41acb020438be2972c0dc2b0a62306529bbf725bb39a74b',
  'blockNumber': 3,
  'transactionHash': '0x88f33e46bf633819ff728378293eff9b0b63b150afcd7b007af6f0e6e0f1095c',
  'signature': '0x4bb60c70c855d1e4648041fe41e7f4e12b95dd17b47bf19aa292a782c47578be',
  'sheltererId': '0x2d5305f083d27799a4977d189991756eae8B84cd',
  'bundleId': '0xd7b8b2a364d884b40ee1b323ada496b7388153c2bfb635285ea9e47a79ecf4d9',
  'challengeId': '0x15769708c478d3a630392ec326363f305b3415371e07fb0190d2abc1d5d16520',
  'count': '7'
}];

describe('Challenge stats', () => {
  describe('formatResolutionsByTiers', () => {
    const exampleChallengesByTier = {
      '75000000000000000000000': {
        min: 1, max: 10, mean: 3.141512312, total: 222, count: 16
      },
      '30000000000000000000000': {
        min: 2, max: 4, mean: 5.012321, total: 152, count: 5
      }
    };

    it('returns formatted object', () => {
      expect(formatResolutionsByTiers(exampleChallengesByTier)).to.deep.equal({
        '75K': 'total: 222 nodes: 16 mean: 3.14 min: 1 max: 10',
        '30K': 'total: 152 nodes: 5 mean: 5.01 min: 2 max: 4'
      });
    });
  });

  describe('getResolversStakes', () => {
    let atlasStakeStoreWrapperMock;
    const exampleStake = '750000000000';
    const exampleAddress = '0xdeadbeef';

    beforeEach(() => {
      atlasStakeStoreWrapperMock = {
        contract: sinon.stub().resolves({
          methods: {
            getStake: sinon.stub().returns({
              call: sinon.stub().resolves(exampleStake)
            })
          }
        })
      };
    });

    it('returns resolvers stakes', async () => {
      expect(await getResolversStakes(exampleAddress, atlasStakeStoreWrapperMock)).to.deep.equal({
        address: exampleAddress,
        stake: exampleStake
      });
    });
  });

  [
    ['1000000000000000000000', '1K'],
    ['42000000000000000000000', '42K'],
    ['100000000000000000000', '100000000000000000000'],
    ['100000000000000000000', '100000000000000000000'],
    ['10000000000000000000001', '10000000000000000000001'],
  ].forEach(([arg, expectedResult]) =>
    it(`formatStake with ${arg}`, () => {
      expect(formatStake(arg)).to.equal(expectedResult);
    })
  );

  describe('formatDeviation', () => {
    it('negative difference', () => {
      expect(formatDeviation(13, 7)).to.equal(chalk.red('-46.15%'));
    });

    it('positive difference', () => {
      expect(formatDeviation(7, 13)).to.equal(chalk.green('+85.71%'));
    });
  });

  it('formatNodeChallengeStats', () => {
    const exampleAddress = '0xdeadbeef';
    const resolvedCount = 14;
    const exampleTier = '42000000000000000000000';
    const exampleMean = 12;

    expect(formatNodeChallengeStats(exampleAddress, resolvedCount, exampleTier, exampleMean)).to.equal(
      `${exampleAddress}(42K): 14 (${chalk.green('+16.67%')})`
    );
  });

  describe('getChallengesCreatedByResolverCount', () => {
    it('maps address to resolved challenges count', () => {
      expect(getChallengesCreatedByResolverCount(exampleResolvedChallenges).value()).to.deep.equal({
        '0x3DA7f459F3f5aE152c00fA99956E169CFFAC8113': 3,
        '0xd9fe74fdef150d8603a8087634c3ac3a5879d07a': 2
      });
    });
  });

  describe('mapResolversToStakes', () => {
    let atlasStakeStoreWrapperMock;
    let getStakeStub;
    beforeEach(() => {
      getStakeStub = sinon.stub();
      atlasStakeStoreWrapperMock = {
        contract: sinon.stub().resolves({
          methods: {
            getStake: getStakeStub
          }
        })
      };
      getStakeStub.withArgs('0x3DA7f459F3f5aE152c00fA99956E169CFFAC8113').returns({call: sinon.stub().resolves('75000000000000000000000')});
      getStakeStub.withArgs('0xd9fe74fdef150d8603a8087634c3ac3a5879d07a').returns({call: sinon.stub().resolves('30000000000000000000000')});
    });

    it('maps resolver addresses to stake', async () => {
      expect((await mapResolversToStakes(_({
        '0x3DA7f459F3f5aE152c00fA99956E169CFFAC8113': 3,
        '0xd9fe74fdef150d8603a8087634c3ac3a5879d07a': 2
      }), atlasStakeStoreWrapperMock)).value()).to.deep.equal({
        '0x3DA7f459F3f5aE152c00fA99956E169CFFAC8113': '75000000000000000000000',
        '0xd9fe74fdef150d8603a8087634c3ac3a5879d07a': '30000000000000000000000'
      });
    });
  });

  describe('getChallengesByTierStats', () => {
    const exampleNodeStakes = _({
      '0x1': '75K',
      '0x2': '30K',
      '0x3': '75K',
      '0x4': '75K',
      '0x5': '30K',
      '0x6': '10K',
      '0x7': '10K',
      '0x8': '75K',
      '0x9': '10K'
    });
    const exampleResolvedCount = _({
      '0x1': 4,
      '0x2': 5,
      '0x3': 10,
      '0x4': 8,
      '0x5': 6,
      '0x6': 7,
      '0x7': 11,
      '0x8': 16,
      '0x9': 1
    });
    const expectedResult = {
      '75K': {mean: 9.5, total: 38, min: 4, max: 16, count: 4}, // 4, 10, 8, 16
      '30K': {mean: 5.5, total: 11, min: 5, max: 6, count: 2}, // 5, 6
      '10K': {mean: 6.333333333333333, total: 19, min: 1, max: 11, count: 3}, // 7, 11, 1
    };

    it('returns challenge resolution stats by tier', async () => {
      expect(getChallengesByTierStats(exampleResolvedCount, exampleNodeStakes)).to.deep.equal(expectedResult);
    });
  });

  describe('getChallengeResolutionTimeStats', () => {
    it('calculates statistics on challenges', async () => {
      expect(getChallengeResolutionTimeStats(exampleCreatedChallenges, exampleResolvedChallenges)).to.deep.equal({
        mean: 2.8,
        median: 3,
        max: 4,
        min: 2,
        count: 5
      });
    });

    it('returns only count when did not find overlapping challenges', async () => {
      expect(getChallengeResolutionTimeStats([], exampleResolvedChallenges)).to.deep.equal({count: 0});
    });
  });
});
