// Create and send a XMLHttpRequest.

export default function requestJSON({ method = 'GET', url, data, headers = {}, callback }) {
  const request = new XMLHttpRequest();
  const loadHandler = function loadHandler() {
    try {
      callback(null, JSON.parse(this.responseText));
    } catch (error) {
      callback(error, this.response);
    }
  };
  request.addEventListener('load', loadHandler);
  request.addEventListener('error', callback);
  request.addEventListener('abort', callback);
  request.addEventListener('timeout', callback);
  request.open(method, url);
  request.setRequestHeader('Content-Type', 'application/json');
  request.setRequestHeader('Accept', 'application/json');
  Object.keys(headers).forEach(headerName =>
    request.setRequestHeader(headerName, headers[headerName])
  );
  request.send(JSON.stringify(data));
  return request;
}
