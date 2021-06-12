import React, { Component } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import {loadVoteTokenData,  loadVoteData, parseNote} from '../cli.js'
import Divider from '@material-ui/core/Divider';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import LinearProgress from '@material-ui/core/LinearProgress';


class VoteInfoCard extends Component{
  //const classes = useStyles();
  constructor(props) {
    super(props);
    this.state = {
      inited: false,
      votingToken: [],
      votingTokenReceived: false,
      loading: false,
      voteData: []
    };
    
    this.getVoteInfoData = this.getVoteInfoData.bind(this);
  }
  
  async getVoteInfoData() {
    let timer = null;
    const { currency, amount, netId, deposit } = parseNote(this.props.voteToken);
    if( this.state.inited !== true){ 
      this.state.loading = true;
      this.forceUpdate();
      timer = setTimeout(() => loadVoteTokenData({deposit}).then((token)=>{
        this.state.votingToken = token;
        this.state.votingToken.depositDate = new Date(this.state.votingToken.timestamp * 1000);
        this.inited = true;
        
        const timestampToDate = new Date(this.state.votingToken.timestamp * 1000);
        this.state.votingToken.voteTokenDate = timestampToDate.toLocaleDateString('ro-RO');
        this.state.votingToken.voteTokenTime = timestampToDate.toLocaleTimeString('ro-RO');
        if (this.state.votingToken.isSpent){
          loadVoteData({ deposit }).then((withdrawInfo)=>{
            this.state.voteData = withdrawInfo;
            if( withdrawInfo != null ){
              this.state.voteData = withdrawInfo;
              this.state.voteData.voteSpent = true;
              //const withdrawalDate = new Date(withdrawInfo.timestamp * 1000)
              this.state.voteData.electionId = withdrawInfo.electionId;
            } else{
              this.state.voteData.voteTokenSpent = false;
    
            }
            this.state.inited = true;
          this.state.loading = false;
          this.forceUpdate();
          })
        }
        
          this.state.inited = true;
          this.state.loading = false;
          this.forceUpdate();
      
        
      }), 1000)
      
      
    }
  }

  infoToken(){
    
  }

  infoVote(){
    const timestampToDate = new Date(this.state.voteData.timestamp * 1000);
    this.state.voteData.voteDate = timestampToDate.toLocaleDateString('ro-RO');
    this.state.voteData.voteTime = timestampToDate.toLocaleTimeString('ro-RO');
    if (this.state.voteData!==null){
      return(
        <List >
        <ListItem>
                <ListItemText primary="Election ID" secondary={this.state.voteData.electionId}/>
        </ListItem>
        <ListItem>
                <ListItemText primary="Candidate ID" secondary={this.state.voteData.candidateId}/>
        </ListItem>
        <ListItem>
                <ListItemText primary="From" secondary={this.state.voteData.from}/>
        </ListItem>
        <ListItem>
                <ListItemText primary="Date" secondary={this.state.voteData.voteDate }/>
                <ListItemText primary="Time" secondary={this.state.voteData.voteTime}/>
        </ListItem>
        <ListItem>
                <ListItemText primary="Transaction hash" secondary={this.state.voteData.txHash}/>
        </ListItem>
       
        <ListItem>
                <ListItemText primary="Nullifier" secondary={this.state.voteData.nullifier}/>
        </ListItem>
      </List>
      )
    }
    else{
      return(
        "Vote is not used"
      )
    }
    
  }
  render(){
    return  (
    <React.Fragment>
    <Card  variant="outlined">
    <CardActions>
    {!this.state.inited ?<Button variant="contained" color="primary"  onClick={this.getVoteInfoData} >Get info</Button>:null}
      </CardActions>
      {this.state.loading ? <LinearProgress /> : null}
      {this.state.inited ?<CardContent>
      
        <Typography variant="h6" component="h6">
            Info about your voteToken:
        </Typography>
        <List >
          <ListItem>
                  <ListItemText primary="From" secondary={this.state.votingToken.from}/>
          </ListItem>
          <ListItem>
                  <ListItemText primary="Date" secondary={this.state.votingToken.voteTokenDate}/>
                  <ListItemText primary="Time" secondary={this.state.votingToken.voteTokenTime}/>
          </ListItem>
          <ListItem>
                  <ListItemText primary="Transaction hash" secondary={this.state.votingToken.txHash}/>
          </ListItem>
          <ListItem>
                  <ListItemText primary="Commitment" secondary={this.state.votingToken.commitment}/>
          </ListItem>
         </List>
        <Divider/>
        <Typography variant="h6" component="h6">
            Info about your vote:
        </Typography>
        {this.state.votingToken.isSpent ? this.infoVote() : "Vote token is not used" }

        <Divider />
      </CardContent>:null}
     
    </Card>
    </React.Fragment>
    );
  }
}

export default VoteInfoCard; 
