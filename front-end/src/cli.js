
//const readfile = util.promisify(fs.readFile);
require('dotenv').config()
const axios = require('axios')
const assert = require('assert')
const snarkjs = require('snarkjs')
const crypto = require('crypto')
const circomlib = require('circomlib')
const bigInt = snarkjs.bigInt
const merkleTree = require('./lib/MerkleTree')
const Web3 = require('web3')
const buildGroth16 = require('websnark/src/groth16')
const websnarkUtils = require('websnark/src/utils')
const config = require('./config')
const { toBN } = require('web3-utils')

let web3, tornado, circuit, proving_key, groth16, ownerAccount, netId, election, electionId, OWNER_PRIVATE_KEY, token_address, MERKLE_TREE_HEIGHT, tornadoAddress, electionAddress

/** Generate random number of specified byte length */
const rbigint = nbytes => snarkjs.bigInt.leBuff2int(crypto.randomBytes(nbytes))

/** Compute pedersen hash */
const pedersenHash = data => circomlib.babyJub.unpackPoint(circomlib.pedersenHash.hash(data))[0]

/** BigNumber to hex string of specified length */
function toHex(number, length = 32) {
  const str = number instanceof Buffer ? number.toString('hex') : bigInt(number).toString(16)
  return '0x' + str.padStart(length * 2, '0')
}


/**
 * Init web3, contracts, and snark
 */
async function init({ noteNetId, accountAddress }) {
  let contractJson, electionContractJson, tornadoContractAddress, electionContractAddress
  // Initialize from local node
  web3 = new Web3('http://localhost:8545', null, { transactionConfirmationBlocks: 1 })
  contractJson = require('./build/contracts/TornadoElection.json')
  circuit = require('./build/circuits/withdraw.json')

  //hardcoding - to change
  MERKLE_TREE_HEIGHT = 20
  OWNER_PRIVATE_KEY = 'de1bf26ee616e5e01521a6c0453226679be325949f1c6e3427de69283675fa72';

  const owner_account = web3.eth.accounts.privateKeyToAccount(OWNER_PRIVATE_KEY)
  web3.eth.accounts.wallet.add(OWNER_PRIVATE_KEY)
  ownerAccount = owner_account.address

  web3.eth.defaultAccount = accountAddress

  electionContractJson = require('./build/contracts/Vote.json')

  groth16 = await buildGroth16()
  netId = await web3.eth.net.getId()

  if (noteNetId && Number(noteNetId) !== netId) {
    throw new Error('This note is for a different network. Specify the --rpc option explicitly')
  }

  tornadoContractAddress = contractJson.networks[netId].address
  electionContractAddress = electionContractJson.networks[netId].address

  tornado = new web3.eth.Contract(contractJson.abi, tornadoContractAddress)
  election = new web3.eth.Contract(electionContractJson.abi, electionContractAddress)

}


/**
 * Create deposit object from secret and nullifier
 */
function createDeposit({ nullifier, secret, electionId }) {
  const deposit = { nullifier, secret, electionId }
  deposit.preimage = Buffer.concat([deposit.nullifier.leInt2Buff(31), deposit.secret.leInt2Buff(31), deposit.electionId.leInt2Buff(31)])
  deposit.commitment = pedersenHash(deposit.preimage)
  deposit.commitmentHex = toHex(deposit.commitment)
  deposit.nullifierHash = pedersenHash(deposit.nullifier.leInt2Buff(31))
  deposit.nullifierHex = toHex(deposit.nullifierHash)
  return deposit
}

/**
 * Make a deposit
 * @param address address of sender account
 * @param electionId election Id
 */
async function generateVoteToken({ address, electionId }) {

  const deposit = createDeposit({ nullifier: rbigint(31), secret: rbigint(31), electionId: snarkjs.bigInt.leBuff2int(toBN(electionId).toArrayLike(Buffer)) })
  const note = toHex(deposit.preimage, deposit.preimage.length);
  const noteString = `tornado-${electionId}-${netId}-${note}`
  var txHashh, receiptt, voteTokenNote
 
  await tornado.methods.registerVoteToken(toHex(deposit.commitment), electionId).send({ from: address, gas: 2e6 }).on('transactionHash', function (txHash) {

    txHashh = txHash
    web3.eth.getTransactionReceipt(txHash).then((receipt) => {
      receiptt = JSON.stringify(receipt);
      voteTokenNote = noteString;
      return (
        {
          txHash: txHash,
          recipt: JSON.stringify(receipt),
          voteTokenNote: noteString
        }
      )
    });


  }).on('error', function (e) {
    console.error('on transactionHash error', e.message)
  })

  //console.log("txxxxx" + receiptt)
  return { txHashh, receiptt, voteTokenNote }
}

/**
 * Generate merkle tree for a deposit.
 * Download deposit events from the tornado, reconstructs merkle tree, finds our deposit leaf
 * in it and generates merkle proof
 * @param deposit Deposit object
 */

///DONE
async function generateMerkleProof(deposit) {
  // Get all deposit events from smart contract and assemble merkle tree from them
  //console.log('Getting current state from tornado contract')
  const events = await tornado.getPastEvents('VotingToken', { fromBlock: 0, toBlock: 'latest' })

  const leaves = events
    .sort((a, b) => a.returnValues.leafIndex - b.returnValues.leafIndex) // Sort events in chronological order
    .map(e => e.returnValues.commitment)
  const tree = new merkleTree(MERKLE_TREE_HEIGHT, leaves)

  // Find current commitment in the tree
  const depositEvent = events.find(e => e.returnValues.commitment === toHex(deposit.commitment))
  const leafIndex = depositEvent ? depositEvent.returnValues.leafIndex : -1

  // Validate that our data is correct
  const root = await tree.root()
  const isValidRoot = await tornado.methods.isKnownRoot(toHex(root)).call()
  const isSpent = await tornado.methods.isSpent(toHex(deposit.nullifierHash)).call()
  assert(isValidRoot === true, 'Merkle tree is corrupted')
  assert(isSpent === false, 'The note is already spent')
  assert(leafIndex >= 0, 'The deposit is not found in the tree')

  // Compute merkle proof of our commitment
  return tree.path(leafIndex)
}

/**
 * Generate SNARK proof for withdrawal
 * @param deposit Deposit object
 * @param recipient Funds recipient
 * @param relayer Relayer address
 * @param fee Relayer fee
 * @param refund Receive ether for exchanged tokens
 */
async function generateSnarkProof({ deposit, electionId,  relayerAddress = 0, fee = 0, refund = 0  }) {
  // Compute merkle proof of our commitment
  const { root, path_elements, path_index } = await generateMerkleProof(deposit)
  //console.log("generated");
  // Prepare circuit input
  const input = {
    // Public snark inputs
    root: root,
    nullifierHash: deposit.nullifierHash,
    electionId: bigInt(electionId),
    relayer: bigInt(relayerAddress),
    fee: bigInt(fee),
    refund: bigInt(refund),

    // Private snark inputs
    nullifier: deposit.nullifier,
    secret: deposit.secret,
    pathElements: path_elements,
    pathIndices: path_index,
  }

  //console.log('Generating SNARK proof')
  ////console.log("XXXXXXXXXXXXXXXXXXXXXXxx: " + proving_key);
  //let ui33 = new Uint32Array(proving_key, proving_key.byteOffset, proving_key.byteLength / Uint32Array.BYTES_PER_ELEMENT);
  ////console.log("PPPPPPPp" + ui33);
  console.time('Proof time')
  console.log("proof");
  ////console.log(proving_key)
  const proofData = await websnarkUtils.genWitnessAndProve(groth16, input, circuit, proving_key)
  console.log("proof2");
  const { proof } = websnarkUtils.toSolidityInput(proofData)
  console.timeEnd('Proof time')

  const args = [
    toHex(input.root),
    toHex(input.nullifierHash),
    toHex(input.electionId, 31),
  ]

  return { proof, args }
}

/**
 * Do an ETH withdrawal
 * @param noteString Note to withdraw
 * @param recipient Recipient address
 */
async function registerVote({ deposit, electionId, candidateId, address }) {
  console.log("vote gen proof" ) ;
  const { proof, args } = await generateSnarkProof({ deposit, electionId })
  console.log("vote register start" ) ;
  let tx;
  await tornado.methods.vote(proof, ...args, candidateId).send({ from: address, gas: 1e6 })
    .on('transactionHash', function (txHash) {
      //console.log("txXXX");
      tx = txHash;
    }).on('error', function (e) {
      console.error('on transactionHash error', e.message)
    })
  web3.eth.accounts.wallet.remove(address);
  //console.log("retunred tx " + tx);
  return tx;
}


/**
 * Create election
 */

async function createElection(electionName, electionDescription, endTime, startTime, address) {
  //console.log("createElectionadd :" + address);
  await election.methods.createElection(electionName, electionDescription, endTime, startTime).send({ from: address, gas: 2e6 })
  electionId = await election.methods.nrOfElections().call() - 1
  return electionId
}

async function addCandidate(candidateName, electionId, address) {
  //console.log("caddcand :" + address);
  await election.methods.addCandidate(candidateName, electionId).send({ from: address, gas: 2e6 })
  //console.log('Added candidate ' + candidateName + ' ' + electionId)
}

async function addRegisteredVoter(voter_address, electionId, address) {
  //console.log("addadd :" + address);
  await election.methods.addRegisteredVoter(voter_address, electionId).send({ from: address, gas: 2e6 })
  //console.log('Added allowed voter address ' + voter_address)

}

async function getElectionsNames(){
  var names = [];
  var nrOfElections = await election.methods.getNrOfElections().call();
  for (var i=1;i<=nrOfElections ;i++){
    const electionContract = await election.methods.elections(i).call();
    names.push(electionContract.electionName);
  }
  return names;
}

async function getElectionInfo(electionId) {
  var candidates = []
  var votess = []
  const electionContract = await election.methods.elections(electionId).call()
  for (let i = 1; i <= electionContract.nrOfCandidates; i++) {
    let candName = await election.methods.getCandidates(electionId, i).call()
    let voteCount = await election.methods.getVoteCount(electionId, i).call()
    //console.log("cand vote : " + candName + " " + voteCount);
    candidates.push(candName);
    //votes.push(voteCount);
    votess.push(parseInt(voteCount));
  }
  //console.log("cli desc " + electionContract.description);
  return ({
    electionId: electionId,
    authorityAddress: electionContract.authorityAddress,
    nrOfCandidates: electionContract.nrOfCandidates,
    electionName: electionContract.electionName,
    electionTime: electionContract.endTime,
    electionStartTime: electionContract.startTime,
    candidates: candidates,
    electionDescription: electionContract.description,
    votes: votess
  })
}

async function createTemporaryAccount() {
  const tempAccount = await web3.eth.accounts.create()
  web3.eth.accounts.wallet.add(tempAccount)
  //console.log("owner : " + ownerAccount);
  web3.eth.sendTransaction({ from: ownerAccount, to: tempAccount.address, value: web3.utils.toWei('0.05', 'ether'), gas: 3e4 })
  return tempAccount.address;
}

/**
 * Parses Tornado.cash note
 * @param noteString the note
 */
function parseNote(noteString) {
  const noteRegex = /tornado-(?<electionId>\d+)-(?<netId>\d+)-0x(?<note>[0-9a-fA-F]{186})/g;
  const match = noteRegex.exec(noteString);
  if (!match) {
    throw new Error('The note has invalid format')
  }

  const buf = Buffer.from(match.groups.note, 'hex');

  const nullifier = bigInt.leBuff2int(buf.slice(0, 31));
  const secret = bigInt.leBuff2int(buf.slice(31, 62));
  const electionId = bigInt.leBuff2int(buf.slice(62, 93));

  const deposit = createDeposit({ nullifier, secret, electionId });
  const netId = Number(match.groups.netId);

  return { netId, electionId, deposit }
}

async function loadVoteTokenData({ deposit }) {
  try {
    const eventWhenHappened = await await tornado.getPastEvents('VotingToken', {
      filter: {
        commitment: deposit.commitmentHex
      },
      fromBlock: 0,
      toBlock: 'latest'
    })
    if (eventWhenHappened.length === 0) {
      throw new Error('Invalid VoteToken')
    }

    const { timestamp } = eventWhenHappened[0].returnValues
    const txHash = eventWhenHappened[0].transactionHash
    const isSpent = await tornado.methods.isSpent(deposit.nullifierHex).call()
    const receipt = await web3.eth.getTransactionReceipt(txHash)

    return { timestamp, txHash, isSpent, from: receipt.from, commitment: deposit.commitmentHex }
  } catch (e) {
    console.error('loadVoteTokenData', e)
  }
  return {}
}
async function loadVoteData({ deposit }) {
  try {
    const events = await await tornado.getPastEvents('Vote', {
      fromBlock: 0,
      toBlock: 'latest'
    })

    const withdrawEvent = events.filter((event) => {
      return event.returnValues.nullifierHash === deposit.nullifierHex
    })[0]

    if (withdrawEvent == null) {
      return null
    }
    const receipt = await web3.eth.getTransactionReceipt(withdrawEvent.transactionHash)

    const electionId = withdrawEvent.returnValues.electionId
    const candidateId = withdrawEvent.returnValues.candidateId
    const { timestamp } = await web3.eth.getBlock(withdrawEvent.blockHash)
    return {
      electionId: electionId,
      candidateId: candidateId,
      txHash: withdrawEvent.transactionHash,
      from: receipt.from,
      to: withdrawEvent.returnValues.to,
      timestamp,
      nullifier: deposit.nullifierHex,
    }
  } catch (e) {
    console.error('loadVoteData', e)
  }
}

function setProvingKey(pr_k) {
  proving_key = pr_k;
  //console.log("PrK: " + proving_key + " " + proving_key.byteLength);
}

function getProvingKey() {
  if (proving_key !== undefined && proving_key.byteLength > 1) {
    return true;
  }
  return false;
}

async function isAllowed(address, electionId) {
  var allowed = false;
  //console.log("resultgeagag " + address);
  const result = await election.methods.getAllowed(electionId, address).call().then((result22) => {
    allowed = result22;
    //console.log("result " + result22);
  });

  if (allowed) {
    return true;
  }
  return false;

}

async function receivedTokenAdd(address, electionId) {
  var received = false;
  const result = await election.methods.receivedToken(electionId, address).call().then((result22) => {
    received = result22;
    //console.log("result " + result22);
  });


  if (received) {
    return true;
  }
  return false;
}


module.exports = {
  init,
  createElection,
  addCandidate,
  addRegisteredVoter,
  getElectionInfo,
  generateVoteToken,
  registerVote,
  parseNote,
  setProvingKey,
  loadVoteTokenData,
  loadVoteData,
  getProvingKey,
  createTemporaryAccount,
  isAllowed,
  receivedTokenAdd,
  getElectionsNames
}
