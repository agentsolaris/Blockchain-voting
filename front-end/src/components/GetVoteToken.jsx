import React, { Component }  from 'react';
import Typography from '@material-ui/core/Typography';
import {generateVoteToken, receivedTokenAdd} from '../cli.js'
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import LinearProgress from '@material-ui/core/LinearProgress';
import Alert from '@material-ui/lab/Alert';
import Skeleton from '@material-ui/lab/Skeleton';

class GetVoteToken extends Component{
    constructor(props) {
        super(props);
        this.state = {
          inited: false,
          votingToken: [],
          votingTokenReceived: false,
          loading: false,
          error : false
        };
        this.registerVoteToken = this.registerVoteToken.bind(this);
        this.helpText = this.helpText.bind(this);
        this.renderVoteTokenData = this.renderVoteTokenData.bind(this);
        this.getVoteTokenInfo = this.getVoteTokenInfo.bind(this);
      }

    

    helpText(){
        return 'Get your voting token. Please note your transaction info'
    }

    async registerVoteToken(electionId, address){
        if( this.state.inited !== true){ 
            await generateVoteToken({electionId : electionId , address: address}).then((votingTokenInfo)=>{
                this.state.votingToken = votingTokenInfo;
                this.state.inited = true;
                //console.log(this.state.votingToken.txHashh);
                this.forceUpdate();
            });
        };
        
    }

    getVoteTokenInfo(electionId, address) {
        
        if( this.state.inited !== true){ 
            this.state.loading = true;
            this.forceUpdate();
            generateVoteToken({electionId : electionId , address: address}).then((votingTokenInfo)=>{
                this.state.votingToken = votingTokenInfo;
                this.state.inited = true;
                //console.log(this.state.votingToken.txHashh);
                this.state.votingTokenReceived = true;
                localStorage.setItem('votingTokenReceived', true);
                localStorage.setItem('voteTokenNote', this.state.votingTokenReceived ? this.state.votingToken.voteTokenNote : '');
                localStorage.setItem('voteTokenTx', this.state.votingTokenReceived ? this.state.votingToken.txHashh : '');
                this.state.loading = false;
                this.forceUpdate();
                
            }).catch((err) => {
                if (err ){
                  //console.log("This voteToken"+ err);
                  this.state.error = true;
                  this.state.loading = false;
                  this.forceUpdate();
                }
                
              });
            
        };
    }

    renderVoteTokenData(){
        return(
            <React.Fragment>
                <Typography>{"Your votingToken: "} {this.state.inited ? this.state.votingToken.voteTokenNote: null}</Typography>
                <Typography>{"Your transaction hash:"} {this.state.inited ? this.votingToken.state.txHashh: null}</Typography>
            </React.Fragment>
        )
    }

    async componentDidMount(){
        //console.log("fgeagaegea : " + await receivedTokenAdd( this.props.address, this.props.electionId));
        var addressReceivedToken = await receivedTokenAdd( this.props.address, this.props.electionId);
        if ((localStorage.getItem('votingTokenReceived') === false || localStorage.getItem('votingTokenReceived')  ===null)
        || !addressReceivedToken){
            this.getVoteTokenInfo(this.props.electionId, this.props.address);
        }
        else{
            this.state.inited = true;
            this.state.votingToken.voteTokenNote = localStorage.getItem('voteTokenNote');
            this.state.votingToken.txHashh = localStorage.getItem('voteTokenTx');

            //this.getVoteTokenInfo(this.props.electionId, this.props.address);

            this.forceUpdate();

        }
        
    }
   

    render() {
       
        return (
        
            <React.Fragment>
                
                {this.state.loading ? 
                    <div>
                        <LinearProgress /> 
                        <Skeleton variant="text" animation="wave"/>
                        <Skeleton variant="text" animation="wave"/>
                        <Skeleton variant="text" animation="wave"/>
                        <Skeleton variant="text" animation="wave"/>
                   
                    </div>
                    
                    
                    : this.state.error ? 
                    <Alert severity="error">This address already received a vote token!</Alert>
                    :
                     <List >
                    <ListItem>
                        {this.state.inited? <ListItemText primary="Vote token" secondary={this.state.votingToken.voteTokenNote}/>:null}
                    </ListItem>
                    <ListItem>
                        {this.state.inited? <ListItemText primary="Your transaction hash" secondary={this.state.votingToken.txHashh}/>:null}
                    </ListItem>
                     </List>
             }
                {/* {(!this.state.inited && !this.state.loading) ? <Button variant="contained" component="label"  onClick={() => this.getVoteTokenInfo(this.props.electionId, this.props.address)} >
                    GET
                </Button>: null}  */}
                
   
            </React.Fragment>
          );
    }
}

export default GetVoteToken; 
