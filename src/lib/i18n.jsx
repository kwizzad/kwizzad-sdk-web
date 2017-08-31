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
      confirmationTextUnspecified: 'Congratulations, you earned a reward!',
    },
    enum: {
      two: '{first} and {second}',
      moreThanTwo: '{commaSeparated}, and {last}',
    },
    dismissDialog: {
      rewardUnspecifiedText: 'Are you sure you want to miss out on this offer?',
      rewardSpecifiedText: 'Are you sure you want to miss out on {rewardName}?',
      dismissButton: 'Give up',
      resumeButton: 'Continue and claim reward',
    },
  },
  de: {
    reward: {
      withLimit: 'bis zu {reward}',
      incentiveText: 'Verdiene {potentialTotalReward} mit einem Quiz',
    },
    transaction: {
      confirmationText: 'Herzlichen Glückwunsch zu {oneOrMoreRewards}!',
      confirmationTextUnspecified: 'Deine Belohnung ist unterwegs!',
    },
    enum: {
      two: '{first} und {second}',
      moreThanTwo: '{commaSeparated} und {last}',
    },
    dismissDialog: {
      rewardUnspecifiedText: 'Willst du dir das Angebot wirklich entgehen lassen?',
      rewardSpecifiedText: 'Willst du die Aktion wirklich beenden? Du verpasst {rewardName}.',
      dismissButton: 'Aufgeben',
      resumeButton: 'Weitermachen und Belohnung erhalten',
    },
  },
  fr: {
    reward: {
      withLimit: 'Jusqu‘à {reward}',
      incentiveText: 'Gagne {potentialTotalReward} avec un quiz',
    },
    transaction: {
      confirmationText: 'Félicitations, tu as gagné {oneOrMoreRewards} !',
      confirmationTextUnspecified: 'Félicitations, tu as gagné une récompense !',
    },
    enum: {
      two: '{first} et {second}',
      moreThanTwo: '{commaSeparated}, et {last}',
    },
    dismissDialog: {
      rewardUnspecifiedText: 'Es-tu sûr de vouloir quitter et manquer cette offre ?',
      rewardSpecifiedText: 'Es-tu sûr de vouloir quitter et manquer {rewardName} ?',
      dismissButton: 'Quitter et renoncer à la récompense',
      resumeButton: 'Continuer et réclamer la récompense',
    },
  },
};


const defaultLocale = 'en';
const supportedLocales = Object.keys(translations);
let overriddenLocale = null;

export function getOverriddenLanguageCode(): ?string {
  return overriddenLocale ? overriddenLocale.slice(0, 2) : null;
}

export function getLanguageCode(): string {
  return (overriddenLocale || navigator.language).slice(0, 2)
}

export function overrideLocale(locale: string): void {
  overriddenLocale = locale;
}

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
  const localesToTry = [overriddenLocale, navigator.language]
    .concat(navigator.languages || [])
    .concat([defaultLocale])
    .filter(Boolean);
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
