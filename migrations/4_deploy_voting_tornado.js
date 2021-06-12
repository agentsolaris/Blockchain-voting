/* global artifacts */
require('dotenv').config({ path: '../.env' })
const TornadoElection = artifacts.require('TornadoElection')
const Verifier = artifacts.require('Verifier')
const hasherContract = artifacts.require('Hasher')
const Vote = artifacts.require('Vote')


module.exports = function(deployer, network, accounts) {
  return deployer.then(async () => {
    const { MERKLE_TREE_HEIGHT } = process.env
    const verifier = await Verifier.deployed()
    const hasherInstance = await hasherContract.deployed()
    await TornadoElection.link(hasherContract, hasherInstance.address)
    
    const election = await deployer.deploy(Vote)
    const tornado = await deployer.deploy(TornadoElection, verifier.address, MERKLE_TREE_HEIGHT, accounts[0], election.address)
    console.log('TornadoElection\'s address ', tornado.address)
  })
}
