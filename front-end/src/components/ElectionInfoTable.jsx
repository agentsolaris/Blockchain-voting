import React, { Component} from "react"
import {getElectionInfo, init, isAllowed} from '../cli.js'
import VoteInfo from "./VoteInfo.jsx";
import ElectionCard from "./ElectionCard";
import LinearProgress from '@material-ui/core/LinearProgress';


class ElectionInfoTable extends Component {
    
    constructor(props) {
      super(props);
      this.state = {
        electionInfo: [],
        inited: false,
        electionEnded: false,
        votesCount: 0,
        isAllowed : false
      };
      this.GetElectionInfo = this.GetElectionInfo.bind(this);
    }

    async GetElectionInfo(electionId) {
      await init({ rpc: 'http://localhost:8545' });

      var allowed = await isAllowed(this.props.account, this.props.electionId);
      //console.log("ALLL : " + allowed + " "+ this.props.account + " "+ this.props.electionId);
        if( this.state.inited !== true){ 
          var votesCount = 0;
          await getElectionInfo(electionId).then((electionInfo)=>{
              this.state.electionInfo = electionInfo;
              this.state.inited = true;
              for (let i=0;i<this.state.electionInfo.votes.length ; i++){
                votesCount = votesCount + this.state.electionInfo.votes[i];
              }
              this.state.votesCount = votesCount;
              this.state.isAllowed = allowed;
              //console.log("Allowed : " + allowed);
              this.forceUpdate();
          });
      };
    }

    async componentDidMount() {
      await this.GetElectionInfo(this.props.electionId);
       
     }

    render() {
      //console.log ("dates : "+  new Date().getTime() + " " +  this.state.electionInfo.electionTime + " " + this.state.electionInfo.electionStartTime )
      
      return (
        <React.Fragment>
          <VoteInfo/><br></br>
        {this.state.inited ?
          <ElectionCard 
            account = {this.props.account}
            electionId = {this.props.electionId}
            electionDescription = {this.state.electionInfo.electionDescription}
            title = {this.state.electionInfo.electionName}
            endTime = {this.state.electionInfo.electionTime}
            startTime = {this.state.electionInfo.electionStartTime}
            candidates = {this.state.electionInfo.candidates}
            nrOfCandidates = {this.state.electionInfo.candidates ? this.state.electionInfo.candidates.length : null}
            electionEnded = {this.state.electionInfo.electionTime < new Date().getTime()}
            electionStarted = {this.state.electionInfo.electionStartTime < new Date().getTime()}
            votesCount = {this.state.votesCount}
            votes = {this.state.electionInfo.votes}
            isAllowed = {this.state.isAllowed}
          /> : <LinearProgress />}
        </React.Fragment>
    )
       
    }
  }

  export default ElectionInfoTable; 