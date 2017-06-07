import { t } from '../lib/i18n';


export default function enumerate(array) {
  if (!array || array.length === 0) {
    throw new Error('Please supply an array of one or more strings.');
  }

  switch (array.length) {
    case 1: return array[0];
    case 2: return t('enum.two', { first: array[0], second: array[1] });
    default: return t(
      'enum.moreThanTwo',
      {
        commaSeparated: array.slice(0, -1).join(', '),
        last: array.slice(-1),
      });
  }
}
