import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import StepContent from '@material-ui/core/StepContent';
import Button from '@material-ui/core/Button';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import UploadProvingKey from "./UploadProvingKey"
import {getProvingKey} from '../cli.js'
import GetVoteToken from './GetVoteToken'
import Vote from './Vote'

const useStyles = makeStyles((theme) => ({
  root: {
    minWidth: 1250,
    
  },
  button: {
    marginTop: theme.spacing(1),
    marginRight: theme.spacing(1),
  },
  actionsContainer: {
    marginBottom: theme.spacing(2),
  },
  resetContainer: {
    padding: theme.spacing(3),
  },
}));


function getSteps() {
  return ['Upload proving key', 'Get voting token', 'Vote'];
}

function getStepContent(account, step, electionId, candidateId, handler, handlerVote) {
  switch (step) {
    case 0:
      return <UploadProvingKey handler = {handler}/>;
    case 1:
      return <GetVoteToken electionId = {electionId} address = {account}/>;
    case 2:
      return <Vote candidateId = {candidateId} handlerVote = {handlerVote}/>;
    default:
      return 'Unknown step';
  }
}

export default function VerticalLinearStepper(props) {
  const classes = useStyles();
  const [activeStep, setActiveStep] = React.useState(0);
  const [uploaded, setUploaded] = React.useState(false);
  const [voted, setVoted] = React.useState(false);
  const steps = getSteps();
  localStorage.setItem('provingKeyUploaded', false);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleReset = () => {
    setActiveStep(0);
  };

  const handler = (x) => {
    setUploaded(x);
  }

  const handlerVote = (x) => {
    setVoted(x);
  }
  const handleClose = ()=>{
    props.handleClose();
  }
  return (
    <div className={classes.root}>
      <Stepper activeStep={activeStep} orientation="vertical">
        {steps.map((label, index) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
            <StepContent>
              {/* <Typography>{getStepContent(index)}</Typography> */}
              <React.Fragment>
                {getStepContent(props.account, index, props.electionId, props.candidateId, handler, handlerVote)}
              </React.Fragment>
              <div className={classes.actionsContainer}>
                <div>
                  <Button
                    disabled = {(activeStep ===0 && !uploaded) || (activeStep ===2 && !voted)}
                    variant="contained"
                    color="primary"
                    onClick={activeStep === steps.length - 1 ? handleClose : handleNext} 
                    className={classes.button}
                  >
                    {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
                  </Button>
                </div>
              </div>
            </StepContent>
          </Step>
        ))}
      </Stepper>
      {activeStep === steps.length && (
        <Paper square elevation={0} className={classes.resetContainer}>
          <Typography>Voting process finished</Typography>
          <Typography>Voting process finished</Typography>
        </Paper>
      )}
    </div>
  );
}
