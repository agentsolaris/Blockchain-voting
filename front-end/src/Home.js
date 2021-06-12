import React from 'react';
import Box from '@material-ui/core/Box';
import Container from '@material-ui/core/Container';
import Typography from '@material-ui/core/Typography';
import ElectionInfo from './ElectionInfo';
import { useParams } from 'react-router';
import AppBar from '@material-ui/core/AppBar';
import { makeStyles } from '@material-ui/core/styles';
import Toolbar from '@material-ui/core/Toolbar';
const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  title: {
    flexGrow: 1,
  },
}));

function Home(props) {
  let {electionId} = useParams();
  const classes = useStyles();
  return (
    <Container maxWidth="md">
      <AppBar position="static">
  <Toolbar>
   
    <Typography variant="h6" className={classes.title}>
      Tornado Vote
    </Typography>
  </Toolbar>
</AppBar>
      <Box my={4}>
      <ElectionInfo account = {props.account} election = {electionId}/> 
        </Box>
    </Container>
  );
}

export default Home;
