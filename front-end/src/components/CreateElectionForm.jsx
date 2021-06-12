import React, { Component } from "react"
import {init, createElection, addCandidate, addRegisteredVoter, getElectionsNames} from '../cli.js'
import Input from "@material-ui/core/Input"
import {FormGroup, Button } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import Alert from '@material-ui/lab/Alert';
import DateFnsUtils from '@date-io/date-fns';
import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
import AddIcon from '@material-ui/icons/Add';
import RemoveIcon from '@material-ui/icons/Remove';
import LinearProgress from '@material-ui/core/LinearProgress';
import Web3 from 'web3';
import TextField from '@material-ui/core/TextField';

import {
  MuiPickersUtilsProvider,
  KeyboardTimePicker,
  KeyboardDatePicker,
} from '@material-ui/pickers';

//https://github.com/candraKriswinarto/dymanic-form/blob/master/src/App.js

const useStyles = theme => ({
  root: {
     flexGrow: 1,
   },
   FormGroup:{
    marginBottom: '2rem',
   }
   

});

class CreateElectionForm extends Component {
    constructor(props) {
      super(props);
      this.state = {
        newElection:{
          elId: 0,
          electionName: '', 
          electionDescription: '',
          candidates: '', 
          endTime: '', 
          startTime: '',
          registeredVoters: ''
        },
        selectedDate: new Date(),
        selectedStartDate: new Date(),
        candidatesCounter: 0,
        candidatesInput: [
          { id: 0, name: '' },
        ],
        votersCounter: 0,
        votersInput: [
          { id: 0, address: '' },
        ],
        loading:false,
        inited:false,
        errorMessage: '',
        electionsNames:[]
      };

      
      
      this.handleChange = this.handleChange.bind(this);
      this.handleSubmit = this.handleSubmit.bind(this);
      this.CreateElection = this.CreateElection.bind(this);
      this.handleDateChange = this.handleDateChange.bind(this);
      this.handleDateChangeStart = this.handleDateChangeStart.bind(this);
      this.handleAddFields = this.handleAddFields.bind(this);
      this.handleCandidateChange = this.handleCandidateChange.bind(this);
      this.handleRemoveFields = this.handleRemoveFields.bind(this);
      this.handleAddFieldsVoters = this.handleAddFieldsVoters.bind(this);
      this.handleVotersChange = this.handleVotersChange.bind(this);
      this.handleRemoveFieldsVoters = this.handleRemoveFieldsVoters.bind(this);
      this.hasDuplicates = this.hasDuplicates.bind(this);
      this.hasInvalidAddress = this.hasInvalidAddress.bind(this);
      this.hasEmptyElement = this.hasEmptyElement.bind(this);
    }
    
    async componentDidMount(){
      await init({rpc : "http://localhost:8545"});
      const electionNames = await getElectionsNames();
      this.setState({electionsNames : electionNames});
      //console.log("namez " + this.state.electionsNames);
    }
    async CreateElection(electionName, electionDescription, endTime, startTime, candidates, registeredVoters) {

    
          let acc = this.props.account;
          await init({rpc : "http://localhost:8545"});
          await createElection(electionName, electionDescription, endTime, startTime,acc).then((electionId)=>{
              //console.log("created " + electionId);
              this.state.newElection.elId = electionId;
          });
          let candidatesArr = candidates;
          let allowedVotersArr= registeredVoters;
          var i;
          for ( i = 0 ; i <candidatesArr.length; i++) {
              await addCandidate(candidatesArr[i] , this.state.newElection.elId, acc);
          }
          
          for ( i = 0 ; i <allowedVotersArr.length; i++) {
              await addRegisteredVoter(allowedVotersArr[i], this.state.newElection.elId ,acc);
          }
              
              //this.forceUpdate();
              this.setState({ loading:false});
              
          this.forceUpdate();
    }

    hasDuplicates(array) {
      return (new Set(array)).size !== array.length;
    }

    hasEmptyElement(array) {
      for (var i = 0;i<array.length;i++){
        //console.log("aARRARR " + array[i]);
        if (array[i]==='' || !array[i]){
          return true;
        }
      }
  
      return false;
    }
    
    hasInvalidAddress(array){
      for (var i = 0 ;i<array.length;i++){
          if (!Web3.utils.isAddress(array[i])){
          //console.log("not address");
          return true;
        }
      }
      return false;
    }

    handleSubmit(event) {
      // //console.log("InputFields", inputFields);
      this.setState({ errorMessage : '', loading:true});
      this.forceUpdate();
      let electionName = this.state.newElection.electionName;
      let electionDescription = this.state.newElection.electionDescription;
      // let candidates = this.state.newElection.candidates;
      let endTime = this.state.selectedDate.getTime() ;
      let startTime = this.state.selectedStartDate.getTime() ;
      //let registeredVoters = this.state.newElection.registeredVoters;
      var candidates = [];
      this.state.candidatesInput.map(candidate => {
        //console.log("CANIDATE " + candidate.name);
        if (candidate.name !==''){
          candidates.push(candidate.name);
        }
        
      });
      var allowed = [];
      this.state.votersInput.map(address=>{
        if(address.address!==''){
          allowed.push(address.address);
        }
        
      });

      //console.log(this.state.selectedDate.getTime() + " "+  this.state.selectedStartDate.getTime());
      if (this.hasDuplicates(candidates)){
        this.setState({loading: false, errorMessage: "Duplicate candidates"});
       // this.forceUpdate();
      }
      else{ 
        if(this.state.selectedDate.getTime() <= this.state.selectedStartDate.getTime()){
          this.setState({loading: false,  errorMessage: "The end time of election must be after it's start time"});
        }
        else{
          //console.log("all len " + allowed.length);
          if(electionName === '' || electionDescription ==='' || candidates.length ===0 || allowed.length === 0 || this.hasEmptyElement(candidates)||this.hasEmptyElement(allowed)){
            this.setState({loading: false,  errorMessage: "Please complete all fields"});
          }
          else{
            if (this.hasInvalidAddress(allowed)){
              this.setState({loading: false,  errorMessage: "Invalid allowed voter address"});
            }else{
              if (this.state.electionsNames.includes(electionName)){
                this.setState({loading: false,  errorMessage: "An election with this name already exists"});
              }else{
                this.CreateElection(electionName,electionDescription,endTime, startTime, candidates, allowed);
              }
              
            }
            
          }
          
        }
        
      }

      
      event.preventDefault();
    }

    handleChange(event) {    
      let value = event.target.value;
      let name = event.target.name;
      this.setState( prevState => ({
        newElection:{
          ...prevState.newElection, 
          [name]: value
        }
      }), () =>console.log(this.state.newElection.candidates))}
    
    success(electionId){
      return (
        <React.Fragment>
          <Alert severity="success">Election with ID {electionId} created!</Alert>
          <Button  variant="outlined" color="primary" type="submit" form="createForm"  href= {"/election/" + electionId} >
            Go to election {electionId}</Button>
        </React.Fragment>
      )
    }

    error(){
      return (
        <React.Fragment>
          <Alert severity="error">{this.state.errorMessage}</Alert>
        </React.Fragment>
      )
    }

    handleDateChange = (date) => {
    
      this.setState({ selectedDate: date});
    };

    handleDateChangeStart = (date) => {
      
      this.setState({ selectedStartDate: date});
    };

    handleAddFields = () => {
      this.state.candidatesCounter +=1;
      this.setState( prevState => ({
        candidatesInput:[
          ...prevState.candidatesInput, { id: this.state.candidatesCounter,  name: ''}
        ]
      }), () =>console.log(this.state.candidatesInput))

      //console.log(this.state.candidatesInput);
    }

    handleCandidateChange = (id, event) => {
      const candidates = this.state.candidatesInput.map(candidate => {
        //console.log(id + " "+ candidate.id)
        if(id === candidate.id) {
          //console.log(event.target.name + " "+event.target.value);
          candidate[event.target.name] = event.target.value
        }
        return candidate;
      }) 
      this.setState({candidatesInput: candidates})
    }

    handleRemoveFields = id => {
      const values  = [...this.state.candidatesInput];
      values.splice(values.findIndex(value => value.id === id), 1);
      this.setState({candidatesInput: values, candidatesCounter:this.state.candidatesCounter -1 })
    }

    handleAddFieldsVoters = () => {
      this.state.votersCounter +=1;
      this.setState( prevState => ({
        votersInput:[
          ...prevState.votersInput, { id: this.state.votersCounter,  address: ''}
        ]
      }), () =>console.log(this.state.votersInput))

      //console.log(this.state.votersInput);
    }

    handleVotersChange = (id, event) => {
      //console.log(id  + " " + event.target.name + " " + event.target.value + " FEAfaef");
      const voters = this.state.votersInput.map(voter => {
        //console.log(id + " "+ voter.id)
        if(id === voter.id) {
          //console.log(event.target.name + " "+event.target.value);
          voter[event.target.name] = event.target.value
        }
        return voter;
      }) 
      this.setState({votersInput: voters})
    }

    handleRemoveFieldsVoters = id => {
      const values  = [...this.state.votersInput];
      values.splice(values.findIndex(value => value.id === id), 1);
      this.setState({votersInput: values, votersCounter:this.state.votersCounter -1 })
    }

    datepicker(){
      return(
      <MuiPickersUtilsProvider utils={DateFnsUtils}>
      <Grid container >
        <KeyboardDatePicker
          disableToolbar
          variant="inline"
          format="dd/MM/yyyy"
          margin="normal"
          id="date-picker-inline"
          label="Election end date"
          value={this.state.selectedDate}
          onChange={this.handleDateChange}
          autoOk={true}
          KeyboardButtonProps={{
            'aria-label': 'change date',
          }}
        />
        <KeyboardTimePicker
          margin="normal"
          id="time-picker"
          ampm={false}
          label="Election end time"
          value={this.state.selectedDate}
          onChange={this.handleDateChange}
          KeyboardButtonProps={{
            'aria-label': 'change time',
          }}
        />
      </Grid>
    </MuiPickersUtilsProvider>)
    }

    datepickerStart(){
      return(
      <MuiPickersUtilsProvider utils={DateFnsUtils}>
      <Grid container >
        <KeyboardDatePicker
          disableToolbar
          variant="inline"
          format="dd/MM/yyyy"
          margin="normal"
          id="date-picker-inline"
          label="Election start date"
          value={this.state.selectedStartDate}
          autoOk={true}
          onChange={this.handleDateChangeStart}
          KeyboardButtonProps={{
            'aria-label': 'change date',
          }}
        />
        <KeyboardTimePicker
          margin="normal"
          id="time-picker"
          ampm={false}
          label="Election start time"
          value={this.state.selectedStartDate}
          onChange={this.handleDateChangeStart}
          KeyboardButtonProps={{
            'aria-label': 'change time',
          }}
        />
      </Grid>
    </MuiPickersUtilsProvider>)
    }

    render() {
      const { classes } = this.props;
      //console.log(this.props.account);
      return (
        <React.Fragment>
        <form className={classes.root} noValidate autoComplete="off" onSubmit={this.handleSubmit} id="createForm">
          <legend>Create new election: </legend>
          {this.datepickerStart()}
          {this.datepicker()}
          
          <FormGroup style={{ marginBottom: '0.5rem' }}>
            < TextField label="Election Name" placeholder="Election Name" inputProps={{ 'aria-label': 'description' }} name= {'electionName'} onChange={this.handleChange}/>
          </FormGroup>
          <FormGroup style={{ marginBottom: '0.5rem' }}>
            <TextField label="Election Description" inputProps={{ 'aria-label': 'description' }} name= {'electionDescription'} onChange={this.handleChange}/>
          </FormGroup>
          <FormGroup style={{ marginBottom: '0.5rem' }}>
            {/* <TextField label="Allowed voters" inputProps={{ 'aria-label': 'description' }} name= {'registeredVoters'} onChange={this.handleChange}/> */}
            Allowed voter addresses
            { this.state.votersInput.map(voter=> (
              <TextField label = {"Voter " + (voter.id + 1)} key={voter.id} value={voter.address} inputProps={{ 'aria-label': 'description' }} name= {'address'} onChange={event => this.handleVotersChange(voter.id,event)}/>
          
        )) }
            <IconButton onClick={this.handleAddFieldsVoters} > <AddIcon /> </IconButton>
            <IconButton disabled={this.state.votersInput.length === 1} onClick={() => this.handleRemoveFieldsVoters(this.state.votersCounter)}> <RemoveIcon /></IconButton>
          </FormGroup>
          <FormGroup style={{ marginBottom: '0.5rem' }}>
            {/* <TextField label="Candidates" inputProps={{ 'aria-label': 'description' }} name= {'candidates'} onChange={this.handleChange}/> */}
            Candidates
            { this.state.candidatesInput.map(candidate=> (
              <TextField key={candidate.id} label={"Candidate " + (candidate.id + 1)} value={candidate.name} inputProps={{ 'aria-label': 'description' }} name= {'name'} onChange={event => this.handleCandidateChange(candidate.id,event)}/>
          
        )) }
            
            <IconButton onClick={this.handleAddFields} > <AddIcon /> </IconButton>
            <IconButton disabled={this.state.candidatesInput.length === 1} onClick={() => this.handleRemoveFields(this.state.candidatesCounter)}> <RemoveIcon /></IconButton>
            
          </FormGroup>
          
            
          {!this.state.loading ? this.state.newElection.elId === 0 ? <Button variant="contained" color="primary" type="submit" form="createForm" value="Submit" >
            Create election
          </Button>:null : <LinearProgress />}
        </form>
        {this.state.newElection.elId !== 0 
        ? 
        
        this.success(this.state.newElection.elId) 
  
        : this.state.errorMessage !== '' ? this.error() : null}
       
        
        </React.Fragment>

      );
    }
  }

  export default withStyles(useStyles)(CreateElectionForm); 