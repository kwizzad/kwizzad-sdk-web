import mixpanel from 'mixpanel-browser';


// This file is supposed to enable easy switching or adding tracking libraries without changing
// all tracking code places inside the app code.

// Holds properties that are persistently tracked in all tracked events.
let additionalTrackProperties = {};

const eventQueue = [];
let isLoaded = false;

export function flushQueuedEvents() {
  eventQueue.forEach(([eventName, properties, callback]) => {
    mixpanel.track(eventName, properties, callback);
  });
  eventQueue.length = 0;
}

// Tracks an even with given properties including previously added persistent track properties.
export function track(eventName, properties, callback) {
  const propertiesToTrack = Object.assign({}, additionalTrackProperties, properties);
  eventQueue.push([eventName, propertiesToTrack, callback]);
  if (isLoaded) {
    flushQueuedEvents();
  }
}

// Adds properties that should be persistently tracked in all tracked events.
export function addPersistentTrackProperties(properties) {
  Object.assign(additionalTrackProperties, properties);
}

export function resetPersistentTrackProperties() {
  additionalTrackProperties = {};
}

// Tracks clicks on a link. Described here: https://mixpanel.com/help/reference/javascript-full-api-reference#mixpanel.track_links
export function trackLinks(query, eventName, properties) {
  const propertiesToTrack = Object.assign({}, additionalTrackProperties, properties);
  mixpanel.track_links(query, eventName, propertiesToTrack);
}

export function initializeTracking(mpProject) {
  mixpanel.init(mpProject, {
    loaded() {
      isLoaded = true;
      flushQueuedEvents();
    },
  });
}

window.track = track;
