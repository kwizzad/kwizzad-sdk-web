import React from 'react';
import pick from 'lodash/pick';


export default function Iframe(props) {
  return (<iframe
    {...pick(props, 'src')}
    className="kwizzad-iframe"
    allowFullScreen
    frameBorder="0"
    scrolling="no"
    marginHeight="0"
    marginWidth="0"
  />);
}


Iframe.propTypes = {
  queryParams: React.PropTypes.object.isRequired,
};
