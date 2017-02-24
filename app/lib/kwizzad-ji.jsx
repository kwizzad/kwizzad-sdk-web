import Logger from 'js-logger';


// Interface to the external SDK that uses Komet. The interface is one-way, Komet can only send its
// own events to the SDK using `sendJIEvent`.

// Sends a given event name + args to the native app / SDK that integrates Komet.

function sendJIEvent(eventName, ...args) {
  if (typeof KwizzAdJI !== 'undefined') {
    Logger.debug(`Sending '${eventName}' event to Kwizzad JI API3`, args);
    try {
      if (args && args.length > 0) {
        KwizzAdJI[eventName](...args); // eslint-disable-line no-undef
      } else {
        KwizzAdJI[eventName](); // eslint-disable-line no-undef
      }
    } catch (error) {
      Logger.error(`Could not send '${eventName}' event to JI API:`, error);
    }
  } else {
    Logger.debug(`Ignored '${eventName}' event, JI API not available.`);
  }

  try {
    const message = {
      event: eventName,
      arguments: args,
    };
    if (
      window.webkit &&
      window.webkit.messageHandlers &&
      window.webkit.messageHandlers.KwizzAdJI
    ) {
      window.webkit.messageHandlers.KwizzAdJI.postMessage(message);
    }
  } catch (error) {
    console.log('Error while posting message', error);
  }
}

export default sendJIEvent;
