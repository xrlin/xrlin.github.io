import React from 'react';

function ProjectComponent({repo: repo}) {
  return (
    <ul>
      <li className={"wow fadeInleft"} data-wow-duration="1.5s">
        <a className={"zoombtn"} href={repo.html_url}>{ repo.name }</a>
        <p>{ repo.description }</p>
        <a href={repo.html_url} className={"btn zoombtn"}>Read More</a>
      </li>
    </ul>
  );
}

export default ProjectComponent;
