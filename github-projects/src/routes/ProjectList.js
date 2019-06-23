import React from 'react';
import { connect } from 'dva';
import ProjectComponent from '../components/ProjectComponent';
import styles from './ProjectList.css';


var ProjectList = React.createClass({
  componentWillMount: function () {
    this.serverRequest = fetch("https://api.github.com/users/xrlin/repos").then(function(response) {
      return response.json();
    }).then((result) => {
      let repos = result.filter(repo => repo.fork == false).sort((repo1, repo2) => {
      		if (repo1.stargazers_count > repo2.stargazers_count) {
			return -1;
		}
		if (repo1.stargazers_count < repo2.stargazers_count) {
			return 1;
		}
		if (repo1.updated_at > repo2.updated_at) {
			return -1;
		}
		if (repo1.updated_at < repo2.updated_at) {
			return 1;
		}
		return 0;
	});
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
