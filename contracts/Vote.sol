pragma solidity 0.5.17;

import "@openzeppelin/contracts/math/SafeMath.sol";

contract Vote {
    using SafeMath for uint256;

    struct Candidate {
        uint256 id;
        string name;
        uint256 voteCount;
    }

    struct Voter {
        uint256 id;
        address voterAddress;
    }

    // events
    event votedEvent(uint256 indexed _candidateId);
    event electionStarted(address this_address);

    mapping(uint256 => Election) public elections;
    uint256 public nrOfElections;

    struct Election {
        address authorityAddress;
        string electionName;
        string description;
        //in seconds starting 1 jan 1970
        uint256 endTime;
        uint256 startTime;
        // Store Candidates Count and mapping of candidates using id
        uint256 nrOfCandidates;
        mapping(uint256 => Candidate) candidates;
        uint256 nrOfAllowedVoters;
        mapping(address => bool) allowedVoters;
        //Store addresses of users that voted
        mapping(address => bool) usersThatReceivedToken;
    }

    constructor() public {
        nrOfElections = 1;
    }

    function createElection(
        string memory _electionName,
        string memory _electionDescription,
        uint256 _endTime,
        uint256 _startTime
    ) public returns (uint256) {
        elections[nrOfElections] = Election(
            msg.sender,
            _electionName,
            _electionDescription,
            _endTime,
            _startTime,
            0,
            0
        );
        nrOfElections += 1;
        return nrOfElections - 1;
    }

    function getNrOfElections() public view returns(uint256){
        return nrOfElections;
    }

    function isAllowed(address voterAddress, uint256 _electionId) public view returns(bool){
        if (elections[_electionId].allowedVoters[voterAddress] == true){
            return true;
        }else{
            return false;
        }
        
    }

    function addRegisteredVoter(address voterAddress, uint256 _electionId)
        public
    {
        //only the voting authority has the right to add candidates
        require(elections[_electionId].authorityAddress == msg.sender, "Not election creator");

        elections[_electionId].nrOfAllowedVoters++;
        elections[_electionId].allowedVoters[voterAddress] = true;
    }

    function addCandidate(string memory _name, uint256 _electionId) public {
        require(elections[_electionId].authorityAddress == msg.sender, "Not election creator");
        uint256 currentDatetime= now;
        require(currentDatetime < elections[_electionId].startTime, "Can't add after start time");
        
        elections[_electionId].nrOfCandidates++;
        elections[_electionId].candidates[
            elections[_electionId].nrOfCandidates
        ] = Candidate(elections[_electionId].nrOfCandidates, _name, 0);
    }

    function getAllowed(uint256 electionId, address add)
        public
        view
        returns (bool )
    {
        return elections[electionId].allowedVoters[add];
    }

    function getCandidates(uint256 electionId, uint256 candidateId)
        public
        view
        returns (string memory)
    {
        return elections[electionId].candidates[candidateId].name;
    }

    function getVoteCount(uint256 electionId, uint256 candidateId)
        public
        view
        returns (uint256)
    {
        //uint256 currentDatetime= now;
        //better to comment require for testing
        //require (currentDatetime < elections[electionId].endTime/1000, "Can't get votes before endTime");
        return elections[electionId].candidates[candidateId].voteCount;
    }

    function setVoteTokenReceived(uint256 electionId, address voterAddress)
        public
        returns (bool)
    {
        require (elections[electionId].usersThatReceivedToken[voterAddress] == false, "User already received vote token");
        require (isAllowed(voterAddress, electionId) == true , "User is not allowed to get token" );
        elections[electionId].usersThatReceivedToken[voterAddress] = true;
        return true;
    }

    function receivedToken(uint256 electionId, address voterAddress) public view returns (bool){
        return elections[electionId].usersThatReceivedToken[voterAddress];
    }

    function vote(uint256 _electionId, uint256 _candidateId)
        public
        returns (bool)
    {
        uint256 currentDatetime= now;
        require(currentDatetime < elections[_electionId].endTime/1000, "Election ended");
        require(currentDatetime > elections[_electionId].startTime/1000, "Election didn't start");
        require (_candidateId >= 0 && _candidateId <= elections[_electionId].nrOfCandidates, "Invalid canidadate");
        elections[_electionId].candidates[_candidateId].voteCount = elections[_electionId].candidates[_candidateId].voteCount.add(1);

        return true;
    }
}
