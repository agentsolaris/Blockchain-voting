import React, {Component} from 'react';
import './App.css';
import Home from './Home'
import CreateElection from './CreateElection'
import { Switch, Route, BrowserRouter } from "react-router-dom";
import Web3 from 'web3'

class App extends Component {
  componentWillMount() {
    this.loadBlockchainData()
  }

  async loadBlockchainData() {
    const web3 = new Web3(Web3.givenProvider || "http://localhost:8545")
    const accounts = await web3.eth.getAccounts()
    this.setState({ account: accounts[0] })
  }

  constructor(props) {
    super(props)
    this.state = { account: '' }
  }

  render() {
    return (
      <BrowserRouter>
      <Switch>
            <Route path="/create">
              <CreateElection account = {this.state.account}/>
            </Route>
            <Route path="/election/:electionId">
              {this.state.account ? <Home account = {this.state.account}/> : "Please connect with Metamask"}
            </Route>
            <Route path="/">
              <CreateElection account = {this.state.account}/>
            </Route>
      </Switch>
      {/* Your account: {this.state.account} */}
    </BrowserRouter>
    
    );
  }
}

export default App;
