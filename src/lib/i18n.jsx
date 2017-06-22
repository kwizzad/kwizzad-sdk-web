/* eslint max-len:0 */

import get from 'lodash/get';
import uniq from 'lodash/uniq';
import flatten from 'lodash/flatten';

export const translations = {
  en: {
    reward: {
      withLimit: 'up to {reward}',
      incentiveText: 'Earn {potentialTotalReward} with a quiz',
    },
    transaction: {
      confirmationText: 'Congratulations, you earned {oneOrMoreRewards}!',
    },
    enum: {
      two: '{first} and {second}',
      moreThanTwo: '{commaSeparated}, and {last}',
    },
  },
  de: {
    reward: {
      withLimit: 'bis zu {reward}',
      incentiveText: 'Verdiene {potentialTotalReward} mit einem Quiz',
    },
    transaction: {
      confirmationText: 'Herzlichen Glückwunsch zu {oneOrMoreRewards}!',
    },
    enum: {
      two: '{first} und {second}',
      moreThanTwo: '{commaSeparated} und {last}',
    },
  },
};


const defaultLocale = 'en';
const supportedLocales = Object.keys(translations);


function findLocaleWithCountry(localeWithoutCountry) {
  const regexp = new RegExp(`^${localeWithoutCountry}`);
  const result = supportedLocales.find(locale => locale.match(regexp));
  return result;
}


function expandLocale(requestedLocale) {
  const sanitizedRequestedLocale = requestedLocale.replace('_', '-');
  const localeWithoutCountry = requestedLocale.substring(0,2).toLowerCase();
  const localeHasCountry = sanitizedRequestedLocale !== localeWithoutCountry;
  const localeWithDefaultCountry = localeHasCountry ? sanitizedRequestedLocale :
    findLocaleWithCountry(sanitizedRequestedLocale);

  return [
    requestedLocale,
    sanitizedRequestedLocale,
    localeWithoutCountry,
    localeWithDefaultCountry,
  ];
}

function translatedStringWithPlaceholders(stringName) {
  const localesToTry = [navigator.language]
    .concat(navigator.languages || [])
    .concat([defaultLocale]);
  const expandedLocalesToTry = uniq(flatten(localesToTry.map(expandLocale))).filter(Boolean);

  for (const locale of expandedLocalesToTry) {
    const translation = get(translations[locale], stringName);
    if (translation) {
      return translation;
    }
  }

  return stringName; // return the untranslated attribute
};


export function translate(stringName, options = {}) {
  let string = translatedStringWithPlaceholders(stringName);
  if (!string) {
    return null;
  }
  if (typeof string !== 'string') {
    console.error('String for', stringName, 'has invalid class.');
    return null;
  }
  string = string.replace(/\{[a-zA-Z1-9]+\}/g, keyWithCurlyBraces => {
    const key = keyWithCurlyBraces.replace(/{/, '').replace('}', '');
    return options[key] || keyWithCurlyBraces;
  });
  return string;
}


export const t = translate;
