import { t } from 'app/lib/i18n';


export default function enumerate(array) {
  if (!array || array.length < 2) {
    throw new Error('Please supply an array of two or more strings.');
  }

  if (array.length === 2) {
    return t('enum.two', { first: array[0], second: array[1] });
  }

  return t(
    'enum.moreThanTwo',
    {
      commaSeparated: array.slice(0, -1).join(', '),
      last: array.slice(-1),
    });
}
