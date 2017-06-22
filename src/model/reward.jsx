import uniq from 'lodash/uniq';
import sum from 'lodash/sum';
import groupBy from 'lodash/groupBy';
import { t } from '../lib/i18n.jsx';
import enumerateAsText from '../lib/enumerate-as-text.jsx';


export default class Reward {
  constructor(jsonData) {
    if (jsonData) {
      Object.assign(this, jsonData);
    }
  }

  valueDescription() {
    if (this.maxAmount && this.maxAmount > this.amount) {
      return t(
        'reward.withLimit',
        { reward: `${this.maxAmount} ${this.currency}` }
      );
    } else if (this.amount) {
      return `${this.amount} ${this.currency}`;
    }
    return '';
  }

  debugValueDescription() {
    return `${this.valueDescription()} for ${this.type}`;
  }

  statusName() {
    return t(`rewardStatus.${this.status}`);
  }
}


function uniqueRewardCurrencies(rewards) {
  return uniq(rewards.map(reward => reward.currency));
}

// Returns one `Reward` object per found currency in the given rewards. The amount of each reward
// is the sum of the given reward amounts in the same currency.

export function summarize(rewards) {
  const rewardsByCurrency = groupBy(rewards, reward => reward.currency);
  return Object.keys(rewardsByCurrency).map(currency => {
    const amount = sum(rewardsByCurrency[currency].map(reward => reward.amount));
    const maxAmount = sum(rewardsByCurrency[currency].map(reward => reward.maxAmount));
    const reward = new Reward({ currency, amount, maxAmount });
    return reward;
  });
}

// This does not take maximal amounts into account.
export function enumerateRewardsAsText(rewards) {
  return enumerateAsText(summarize(rewards).map(reward => reward.valueDescription()));
}


export function incentiveTextForRewards(rewards) {
  if (!rewards) {
    return null;
  }
  const summarizedRewards = summarize(rewards);
  const currencyCount = uniqueRewardCurrencies(summarizedRewards).length;
  if (!currencyCount) {
    return null;
  }
  if (currencyCount === 1) {
    const totalAmount = sum(summarizedRewards.map(reward => reward.amount));
    const maxTotalAmount = sum(summarizedRewards.map(reward => reward.maxAmount || reward.amount));
    const currency = summarizedRewards[0].currency;
    let potentialTotalReward;
    if (maxTotalAmount > totalAmount || uniq(summarizedRewards.map(reward => reward.type).length > 1)) {
      potentialTotalReward = t('reward.withLimit', { reward: `${maxTotalAmount} ${currency}` });
    } else {
      potentialTotalReward = `${totalAmount} ${currency}`;
    }
    return t('reward.incentiveText', { potentialTotalReward });
  }
  const potentialTotalReward = enumerateAsText(summarizedRewards.map(reward => reward.valueDescription()));
  return t('reward.incentiveText', { potentialTotalReward });
}
