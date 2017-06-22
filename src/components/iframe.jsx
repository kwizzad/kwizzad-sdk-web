import React from 'react';
import PropTypes from 'prop-types';

function addOpenTarget(url) {
  return `${url}&openTarget=_blank`;
}


export default function Iframe(props) {
  return (<iframe
    title="Kwizzad Komet"
    src={addOpenTarget(props.src)}
    className="kwizzad-iframe"
    allowFullScreen
    frameBorder="0"
    marginHeight="0"
    marginWidth="0"
  />);
}


Iframe.propTypes = {
  queryParams: PropTypes.object.isRequired,
};
