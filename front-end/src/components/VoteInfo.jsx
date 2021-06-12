import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import DialogTitle from '@material-ui/core/DialogTitle';
import Dialog from '@material-ui/core/Dialog';
import PropTypes from 'prop-types';
import { FormGroup} from '@material-ui/core';
import Input from "@material-ui/core/Input"
import Divider from '@material-ui/core/Divider';
import VoteInfoCard from './VoteInfoCard'

const useStyles = makeStyles({
  root: {
    minWidth: 600,
  },
  FormGroup:{
    marginBottom: '2rem',
   }
});

function VoteInfoDialog(props) {
    const classes = useStyles();
    const { onClose, selectedValue, open } = props;
    
    const handleClose = () => {
      onClose(selectedValue);
    };
    
    const handleSubmit = (event) =>{
      //to do
      event.preventDefault();
    }

    const handleChange = (event) => {    
      let value = event.target.value;
      let name = event.target.name;
      }

    return (
      <Dialog onClose={handleClose} aria-labelledby="simple-dialog-title" open={open}>
        <DialogTitle id="simple-dialog-title">Vote info</DialogTitle>
          <form className={classes.root} noValidate autoComplete="off" onSubmit={handleSubmit} id="createForm">
            <legend>Get info for vote token: </legend>
            <FormGroup style={{ marginBottom: '0.5rem' }}>
              <Input placeholder="VoteInfo string" value = {props.voteToken}  inputProps={{ 'aria-label': 'description' }} name= {'vote'} onChange={handleChange}/>
            </FormGroup>
            <Divider />
            <VoteInfoCard voteToken = {props.voteToken} />
          </form>
        
      </Dialog>
    );
  }
  
  VoteInfoDialog.propTypes = {
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
    voteToken: PropTypes.string.isRequired,
  };

export default function VoteInfo(props) {
  const [open, setOpen] = React.useState(false);
  const [selectedValue, setSelectedValue] = React.useState(0);
  const [token, setToken] = React.useState('');

  const handleClickOpen = () => {
    setToken(localStorage.getItem('voteTokenNote'));
    setOpen(true);
  };

  const handleClose = (value) => {
    setOpen(false);
    setSelectedValue(value);
  };

  

  ////console.log("cands: " + props.candidates + " " + props.nrOfCandidates);
  //populateCandidates( props.candidates )
  return (
    <React.Fragment>

                <Button variant="contained" color="primary" onClick={handleClickOpen}>
                    Check info about your vote
                </Button>
                <VoteInfoDialog voteToken={token} open={open} onClose={handleClose} />
    </React.Fragment>
  );
}