import React from 'react';
import { connect } from 'dva';
import ProjectComponent from '../components/ProjectComponent';
import styles from './ProjectList.css';


var ProjectList = React.createClass({
  componentWillMount: function () {
    this.serverRequest = fetch("https://api.github.com/users/xrlin/repos").then(function(response) {
      return response.json();
    }).then((result) => {
      let repos = result;
      this.setState({
        repos: repos
      })
    })
  },

  render: function () {
    if (this.state)
      return (
        <div>
          {this.state.repos.map((repo) => (<ProjectComponent repo={repo} key={repo.id}/>))}
        </div>
      );
    else
      return <div></div>;
  }
});

ProjectList.propTypes = {
};

export default connect()(ProjectList);
