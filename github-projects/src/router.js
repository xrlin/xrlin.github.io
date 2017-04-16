import React from 'react';
import { Router, Route } from 'dva/router';
import ProjectList from './routes/ProjectList';

function RouterConfig({ history }) {
  return (
    <Router history={history}>
      <Route path="/" component={ProjectList} />
    </Router>
  );
}

export default RouterConfig;
