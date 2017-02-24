/* eslint max-len:0 */
import get from 'lodash/get';
import moment from 'moment';


export const translations = {
  en: {
    reward: {
      withLimit: 'up to {reward}',
      incentiveText: 'Earn {potentialTotalReward} with a quiz!',
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
      incentiveText: 'Verdiene {potentialTotalReward} mit einem Quiz!',
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

let currentLocale = 'en';


export function translate(stringName, options = {}) {
  const localizedTranslations = (translations[currentLocale || 'en'] || translations.en);
  let string = get(localizedTranslations, stringName);
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

export function setLocale(locale) {
  currentLocale = locale;
  console.log('Locale set to', locale);
  moment.locale(locale);
}

export const t = translate;
