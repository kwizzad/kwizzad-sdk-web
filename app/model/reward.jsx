import moment from 'moment';
import uniq from 'lodash/uniq';
import sum from 'lodash/sum';
import { t } from 'app/lib/i18n';
import enumerateAsText from 'app/lib/enumerate-as-text';


export default class Reward {
  constructor(jsonData) {
    if (jsonData) {
      Object.assign(this, jsonData);
      this.averageDurationToCallback = this.averageDurationToCallback * 1.3;
    }
  }

  valueDescription() {
    const reward = this.reward;
    if (!reward) {
      return '';
    }
    if (reward.amount) {
      return `${reward.amount} ${reward.currency}`;
    } else if (reward.maxAmount) {
      return t(
        'reward.withLimit',
        { reward: `${reward.maxAmount} ${reward.currency}` }
      );
    }
    return '';
  }

  debugValueDescription() {
    return `${this.valueDescription()} for ${this.reward.type}`;
  }

  statusName() {
    return t(`rewardStatus.${this.status}`);
  }

  durationFromNow() {
    return this.eventTimestamp && moment(this.eventTimestamp).fromNow();
  }

  averageDurationString() {
    return this.averageDurationToCallback &&
    moment.duration(this.averageDurationToCallback).humanize();
  }
}

export function incentiveTextForRewards(rewards) {
  const currencyCount = uniq(rewards.map(reward => reward.currency)).length;
  if (!currencyCount) {
    return null;
  }
  if (currencyCount === 1) {
    const totalAmount = sum(rewards.map(reward => reward.amount));
    const maxTotalAmount = sum(rewards.map(reward => reward.maxAmount));
    const currency = rewards[0].currency;
    const potentialTotalReward = (maxTotalAmount > totalAmount) ?
      t('reward.withLimit', { reward: `${maxTotalAmount} ${currency}` }) :
      `${totalAmount} ${currency}`;
    return t('reward.incentiveText', { potentialTotalReward });
  }
  return enumerateAsText(rewards.map(reward => reward.valueDescription()));
}
