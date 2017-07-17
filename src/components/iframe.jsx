import React from 'react';
import PropTypes from 'prop-types';

function addOpenTarget(url) {
  return `${url}&openTarget=_blank`;
}


function replaceOverriddenKometUrl(url, baseUrl) {
  if (!baseUrl) return url;
  return url.replace(/(https)?:\/\/.*?\//, `${baseUrl}/`);
}


export default function Iframe(props) {
  return (<iframe
    title="Kwizzad Komet"
    src={replaceOverriddenKometUrl(addOpenTarget(props.src), props.overriddenKometBaseUrl)}
    className="kwizzad-iframe"
    allowFullScreen
    frameBorder="0"
    marginHeight="0"
    marginWidth="0"
  />);
}


Iframe.propTypes = {
  queryParams: PropTypes.object.isRequired,
  overriddenKometBaseUrl: PropTypes.string,
};
