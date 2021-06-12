import React, { Component }  from 'react';
import Typography from '@material-ui/core/Typography';
import {createTemporaryAccount, init, registerVote, parseNote} from '../cli.js'
import { FormGroup} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import Input from "@material-ui/core/Input"
import VoteButton from './VoteButton'
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Alert from '@material-ui/lab/Alert';

const useStyles = theme => ({
    root: {
       flexGrow: 1,
     },
     FormGroup:{
      marginBottom: '2rem',
     }
     
  
  });

class Vote extends Component{
    
    constructor(props) {
        super(props);
        this.state = {
            vote:{
                txHash : '',
                voteToken: ''
            },
            voteTokenNote: '',
            votingTokenReceived : false,
            loading: false,
            inited: false,
            error: ''
            
          };
        this.helpText = this.helpText.bind(this);
        this.vote = this.vote.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
      }

    
      componentDidMount() {
        const votingTokenReceived = localStorage.getItem('votingTokenReceived') === 'true';
        const voteTokenNote = votingTokenReceived ? localStorage.getItem('voteTokenNote') : '';
        this.state.votingTokenReceived = votingTokenReceived;
        this.state.voteTokenNote = voteTokenNote;
        this.forceUpdate();
      }

      
    helpText(){
        return <Typography display='inline' style={{ fontWeight: 600 }}>{this.props.candidate}</Typography>
    }

    async vote(voteToken, vote){
        this.state.loading = true;
        this.forceUpdate();
        //console.log("voteToken in voting comp: " + voteToken);
        const { netId, electionId, deposit } = parseNote(voteToken);
        //console.log("ttttttt: " + electionId);
        await init({ rpc: 'http://localhost:8545', noteNetId: netId });

        const newAddress = await createTemporaryAccount();
        await registerVote({ deposit, electionId, candidateId: vote, address :  newAddress }).then((txHash)=>{
          this.state.vote.txHash = txHash;
          this.state.loading = false;
          this.state.inited = true;
          this.props.handlerVote(true);
          // localStorage.setItem('votingTokenReceived', false);
          // localStorage.setItem('voteTokenNote', '');
          // localStorage.setItem('voteTokenTx', '');
          this.forceUpdate();
        }).catch((err) => {
          if (err ){
            console.log("This voteToken"+ err);
            this.props.handlerVote(true);
            if(err.toString().includes("note is")){
              this.state.error = "This voteToken is already used!";
            }
            else{
              if(err.toString().includes("end")){
                this.state.error = "This election has ended!";
              }else{
                this.state.error = "Error";
              }
              
            }
            
            this.forceUpdate();
          }
          
        });
    }

    handleChange(event) {    
        let value = event.target.value;
        let name = event.target.name;
        this.setState( prevState => ({
          vote:{
            ...prevState.vote, 
            [name]: value
          }
        }), () =>console.log(this.state.vote.voteToken))}

    handleSubmit() {
        let voteToken = this.state.voteTokenNote;
        //console.log("blt " + voteToken);
        let candidateId = this.props.candidateId;
        this.vote(voteToken, candidateId);
        
      }

    render() {
        const { classes } = this.props;
        return (
        
            <React.Fragment>
        <form className={classes.root} noValidate autoComplete="off" onSubmit={this.handleSubmit} id="voteForm">
          <legend>Vote using token: </legend>
          <FormGroup style={{ marginBottom: '0.5rem' }}>
            <Input disabled placeholder="Vote token info" inputProps={{ 'aria-label': 'description' }} value = {this.state.voteTokenNote} name= {'voteToken'} onChange={this.handleChange}/>
          </FormGroup>
          
          {this.state.error ===''?
          <VoteButton  vote = {this.vote} voteToken= {this.state.voteTokenNote} candidateId = {this.props.candidateId} ldng = {this.state.loading}/>
          :<Alert severity="error">{this.state.error}</Alert>}
      
        </form>
                {/* <Typography>Send your vote for this candidate {this.helpText()}</Typography> */}
                <List >
                   <ListItem>
                   {this.state.inited ? < ListItemText primary="Vote transaction hash" secondary={this.state.vote.txHash}/>: null}
                  </ListItem>
          
                 </List>
                {/* {!this.state.loading ?  <Typography>{"Voted! Transaction hash: "} </Typography> : <CircularProgress />} */}
         
            </React.Fragment>
          );
    }
}

export default withStyles(useStyles)(Vote); 
