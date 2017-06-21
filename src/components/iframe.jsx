import React from 'react';
import pick from 'lodash/pick';


function addOpenTarget(url) {
  return `${url}&openTarget=_blank`;
}


export default function Iframe(props) {
  return (<iframe
    src={addOpenTarget(props.src)}
    className="kwizzad-iframe"
    allowFullScreen
    frameBorder="0"
    marginHeight="0"
    marginWidth="0"
  />);
}


Iframe.propTypes = {
  queryParams: React.PropTypes.object.isRequired,
};
