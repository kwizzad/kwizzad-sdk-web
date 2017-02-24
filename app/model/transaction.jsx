import compact from 'lodash/compact';
import { t } from 'app/lib/i18n';
import Reward, { enumerateRewardsAsText } from './reward';

export default class Transaction {
  constructor(jsonData, confirmFunction) {
    if (jsonData) {
      Object.assign(this, jsonData);
      if (this.reward) {
        this.reward = new Reward(this.reward);
      }
    }
    this.confirm = () => confirmFunction(this);
  }

  rewardConfirmationText() {
    if (!this.reward) {
      return null;
    }
    return t('transaction.confirmationText', { oneOrMoreRewards: this.reward.valueDescription() });
  }
}

export function transactionsFromJSON(json, confirmFunction) {
  if (!json || !(json instanceof Array) || json.length === 0) {
    return [];
  }
  const transactions = json.map(transaction => new Transaction(transaction, confirmFunction));
  const rewards = compact(transactions.map(transaction => transaction.reward));
  const summarizedRewardsText = rewards && enumerateRewardsAsText(rewards);
  transactions.summarizedRewardsText = summarizedRewardsText;
  transactions.summarizedRewardConfirmationText = rewards &&
    t('transaction.confirmationText', { oneOrMoreRewards: summarizedRewardsText });
  transactions.confirmAll = () => confirmFunction(transactions);
  return transactions;
}
