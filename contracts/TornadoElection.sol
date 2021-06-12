// https://tornado.cash
/*
 * d888888P                                           dP              a88888b.                   dP
 *    88                                              88             d8'   `88                   88
 *    88    .d8888b. 88d888b. 88d888b. .d8888b. .d888b88 .d8888b.    88        .d8888b. .d8888b. 88d888b.
 *    88    88'  `88 88'  `88 88'  `88 88'  `88 88'  `88 88'  `88    88        88'  `88 Y8ooooo. 88'  `88
 *    88    88.  .88 88       88    88 88.  .88 88.  .88 88.  .88 dP Y8.   .88 88.  .88       88 88    88
 *    dP    `88888P' dP       dP    dP `88888P8 `88888P8 `88888P' 88  Y88888P' `88888P8 `88888P' dP    dP
 * ooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo
 */

pragma solidity 0.5.17;

import "./MerkleTreeWithHistory.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./Vote.sol";

interface Voting {
    function setVoteTokenReceived(uint256 votingId, address voterAddress)
        external
        returns (bool);

    function vote(uint256 votingId, uint256 candidateId) 
        external 
        returns (bool);
}

contract IVerifier {
    function verifyProof(bytes memory _proof, uint256[6] memory _input)
        public
        returns (bool);
}

contract TornadoElection is MerkleTreeWithHistory, ReentrancyGuard {
    address voteContractAddress;

    uint256 public denomination;
    mapping(bytes32 => bool) public nullifierHashes;
    // we store all commitments just to prevent accidental deposits with the same commitment
    mapping(bytes32 => bool) public commitments;
    IVerifier public verifier;

    // operator can update snark verification key
    // after the final trusted setup ceremony operator rights are supposed to be transferred to zero address
    address public operator;
    modifier onlyOperator {
        require(
            msg.sender == operator,
            "Only operator can call this function."
        );
        _;
    }

    event VotingToken(
        bytes32 indexed commitment,
        uint32 leafIndex,
        uint256 electionId,
        uint256 timestamp
    );
    event Vote(uint256 electionId, uint256 candidateId, bytes32 nullifierHash);

    /**
    @dev The constructor
    @param _verifier the address of SNARK verifier for this contract
    @param _merkleTreeHeight the height of deposits' Merkle Tree
    @param _operator operator address (see operator comment above)
  */
    constructor(
        IVerifier _verifier,
        uint32 _merkleTreeHeight,
        address _operator,
        address _voteContractAddress
    ) public MerkleTreeWithHistory(_merkleTreeHeight) {
        verifier = _verifier;
        operator = _operator;
        voteContractAddress = _voteContractAddress;
    }

    /**
    @dev Deposit funds into the contract. The caller must send (for ETH) or approve (for ERC20) value equal to or `denomination` of this instance.
    @param _commitment the note commitment, which is PedersenHash(nullifier + secret)
  */
    function registerVoteToken(bytes32 _commitment, uint256 electionId)
        external
        payable
        nonReentrant
    {
        require(!commitments[_commitment], "The commitment has been submitted");

        uint32 insertedIndex = _insert(_commitment);
        commitments[_commitment] = true;
        _processVoteToken(electionId);

        emit VotingToken(
            _commitment,
            insertedIndex,
            electionId,
            block.timestamp
        );
    }

    function _processVoteToken(uint256 electionId) internal {
        Voting(voteContractAddress).setVoteTokenReceived(electionId, msg.sender);
    }


    /**
    @dev Withdraw a deposit from the contract. `proof` is a zkSNARK proof data, and input is an array of circuit public inputs
    `input` array consists of:
      - merkle root of all deposits in the contract
      - hash of unique deposit nullifier to prevent double spends
      - the recipient of funds
      - optional fee that goes to the transaction sender (usually a relay)
  */
    function vote(
        bytes calldata _proof,
        bytes32 _root,
        bytes32 _nullifierHash,
        uint256 _electionId,
        uint256 _candidateId
    ) external payable nonReentrant {
        require(
            !nullifierHashes[_nullifierHash],
            "The note has been already spent"
        );
        require(isKnownRoot(_root), "Cannot find your merkle root"); // Make sure to use a recent one
        require(
            verifier.verifyProof(
                _proof,
                [uint256(_root), uint256(_nullifierHash), _electionId, 0, 0, 0]
            ),
            "Invalid withdraw proof"
        );

        nullifierHashes[_nullifierHash] = true;
        _processVote(_electionId, _candidateId);
        emit Vote(_electionId,  _candidateId, _nullifierHash);
    }

    function _processVote(uint256 electionId, uint256 candidateId) internal {
        Voting(voteContractAddress).vote(electionId, candidateId);
    }

    /** @dev whether a note is already spent */
    function isSpent(bytes32 _nullifierHash) public view returns (bool) {
        return nullifierHashes[_nullifierHash];
    }

    /** @dev whether an array of notes is already spent */
    function isSpentArray(bytes32[] calldata _nullifierHashes)
        external
        view
        returns (bool[] memory spent)
    {
        spent = new bool[](_nullifierHashes.length);
        for (uint256 i = 0; i < _nullifierHashes.length; i++) {
            if (isSpent(_nullifierHashes[i])) {
                spent[i] = true;
            }
        }
    }

    /**
    @dev allow operator to update SNARK verification keys. This is needed to update keys after the final trusted setup ceremony is held.
    After that operator rights are supposed to be transferred to zero address
  */
    function updateVerifier(address _newVerifier) external onlyOperator {
        verifier = IVerifier(_newVerifier);
    }

    /** @dev operator can change his address */
    function changeOperator(address _newOperator) external onlyOperator {
        operator = _newOperator;
    }
}
