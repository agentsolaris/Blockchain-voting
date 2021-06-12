import React from 'react';
import Box from '@material-ui/core/Box';
import Container from '@material-ui/core/Container';
import ElectionInfoTable  from './components/ElectionInfoTable'


function ElectionInfo(props) {
console.log("testst")
  return (
    <Container maxWidth="md">
 
      <Box my={4}>
     <ElectionInfoTable account = {props.account} electionId = {props.election} numberOfElections = {props.numberOfElections}/>
        </Box>
    </Container>

    
  );
}

export default ElectionInfo;
