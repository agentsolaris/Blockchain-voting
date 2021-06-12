import React from 'react';
import Box from '@material-ui/core/Box';
import Container from '@material-ui/core/Container';
import CreateElectionForm  from './components/CreateElectionForm'


function CreateElection(props) {
  return (
    <Container maxWidth="md">
      
      <Box my={4}>
     <CreateElectionForm account = {props.account}/>
        </Box>
    </Container>

    
  );
}

export default CreateElection;
