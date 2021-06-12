import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import DialogTitle from '@material-ui/core/DialogTitle';
import Dialog from '@material-ui/core/Dialog';
import PropTypes from 'prop-types';
import VotingSteps from "./VotingSteps"
import VotePercentage from "./VotePercentage"
import Typography from '@material-ui/core/Typography';
import Alert from '@material-ui/lab/Alert';

const useStyles = makeStyles({
  table: {
    minWidth: 650,
  },
});

function VotingDialog(props) {
    const { onClose, selectedValue, open } = props;
    
    
    const handleClose = () => {
      onClose(selectedValue);
    };
    return (
      <Dialog onClose={handleClose} aria-labelledby="simple-dialog-title" open={open}>
        <DialogTitle id="simple-dialog-title">Vote for candidate {props.candidate}</DialogTitle>
           <VotingSteps account = {props.account} electionId = {props.electionId} candidateId = {props.candidateId} handleClose= {handleClose}/>
      </Dialog>
    );
  }
  
  VotingDialog.propTypes = {
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
    selectedValue: PropTypes.number.isRequired,
  };

function result (votesCount, vote){
  //console.log("vvv : " + votesCount + " " + vote);
  var percentage = 0;
  if (votesCount !== 0){
    percentage = vote/votesCount*100;
  } 
  var rounded;
  var with2Decimals = percentage.toString().match(/^-?\d+(?:\.\d{0,2})?/)[0];
  rounded = with2Decimals;
  // /{vote}/{votesCount} {rounded}%
  return (
    <React.Fragment>
       <VotePercentage progress = {parseInt(rounded)}/>
       <Typography variant="h6" color="textSecondary">{vote}/{votesCount} votes</Typography>
    </React.Fragment>
  )
}


export default function CandidatesTable(props) {
  const classes = useStyles();
  const [open, setOpen] = React.useState(false);
  const [indexx, setIndexx] = React.useState(0);
  const [candidatee, setCandidatee] = React.useState(0);
  const [selectedValue, setSelectedValue] = React.useState(1);

  const handleClickOpen = (index, candidate) => (event) => {
      setOpen(true);
      //setUploaded(index);
      setIndexx(index);
      setCandidatee(candidate);
    
  };

  const handleClose = (value) => {
    setOpen(false);
    setSelectedValue(value);
  };

  //console.log( " allowed in cand table " + props.isAllowed);

  //console.log("tableeee : " + props.account);
  return (
    <TableContainer component={Paper}>
      <Table className={classes.table} aria-label="candidates table">
        <TableHead>
          <TableRow>
            <TableCell align="left">ID</TableCell>
            <TableCell align="center">Name</TableCell>
            <TableCell align="right">{props.electionEnded ? "Results" : props.isAllowed? !props.electionStarted ? 
                <Alert variant="outlined" severity="info">
                {"Election starts at " + new Date(props.startTime*1)}
                </Alert>:null: <Alert variant="filled" severity="error">
                You are not allowed to vote in this election
                </Alert>}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {props.candidates.map((candidate, index) => (
            <TableRow key={index}>
              <TableCell align="left">{index+1}</TableCell>
              <TableCell align="center">{candidate}</TableCell>
              <TableCell align="right">
      
                {props.isAllowed ? !props.electionEnded 
                ?props.electionStarted ? <Button variant="contained" color="primary" onClick={handleClickOpen(index+1, candidate)}> 
                    VOTE
                </Button>:
                null
                : 
                result(props.votesCount, props.votes[index])
                : null}
                <VotingDialog account = {props.account} selectedValue={selectedValue} open={open} onClose={handleClose} electionId = {props.electionId} candidate = {candidatee} candidateId = {indexx}/>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
