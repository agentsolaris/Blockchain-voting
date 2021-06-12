import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import Collapse from '@material-ui/core/Collapse';
import Avatar from '@material-ui/core/Avatar';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import { red } from '@material-ui/core/colors';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import CandidatesTable from "./CandidatesTable";

const useStyles = makeStyles((theme) => ({
  root: {
    maxWidth: 900,
  },
  media: {
    height: 0,
    paddingTop: '56.25%', // 16:9
  },
  expand: {
    transform: 'rotate(0deg)',
    marginLeft: 'auto',
    transition: theme.transitions.create('transform', {
      duration: theme.transitions.duration.shortest,
    }),
  },
  expandOpen: {
    transform: 'rotate(180deg)',
  },
  avatar: {
    backgroundColor: red[500],
  },
}));

export default function ElectionCard(props) {
  const classes = useStyles();
  const [expanded, setExpanded] = React.useState(false);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };
  // 
  //console.log(props.endTime + " tetet");
  

  return (
    <Card className={classes.root}>
      <CardHeader
        avatar={
          <Avatar aria-label="recipe" className={classes.avatar}>
            #{props.electionId}
          </Avatar>
        }
        
        title={props.title}
        subheader={"End time: " + new Date(props.endTime*1) }
      />
      <CardContent>
        <Typography variant="body2" color="textSecondary" component="p">
          {props.electionDescription}
        </Typography>
      </CardContent>
      <CardActions disableSpacing>
        <IconButton
          className={clsx(classes.expand, {
            [classes.expandOpen]: expanded,
          })}
          onClick={handleExpandClick}
          aria-expanded={expanded}
          aria-label="show more"
        >
          <ExpandMoreIcon />
        </IconButton>
      </CardActions>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent>
          <Typography paragraph>Candidates:</Typography>
            <CandidatesTable votesCount = {props.votesCount} isAllowed= {props.isAllowed}
            votes = {props.votes} account = {props.account} electionId = {props.electionId} 
            candidates = {props.candidates} electionEnded ={props.electionEnded} 
            electionStarted ={props.electionStarted} startTime = {props.startTime}/>
        </CardContent>
      </Collapse>
    </Card>
  );
}
