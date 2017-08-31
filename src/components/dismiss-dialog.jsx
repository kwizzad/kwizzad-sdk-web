// @flow

import React from 'react';
import ModalDialog from './modal-dialog.jsx';
import Placement from '../model/placement';
import Reward, { potentialTotalRewardText } from '../model/reward';
import { translate } from  '../lib/i18n';
import type { AdMetaInfo } from '../model/placement';


import './dismiss-dialog.css';

type Props = {
  placement: Placement,
  onDismiss: (() => void),
  onResume: (() => void),
  isVisible: boolean,
  height: number,
};


export default function DismissDialog(props: Props) {
  const adMetaInfo: AdMetaInfo = props.placement.adMetaInfo;
  let headerText = translate('dismissDialog.rewardUnspecifiedText');
  const potentialRewards: ?Reward = adMetaInfo ? adMetaInfo.potentialRewards : null;
  const rewardName = potentialRewards ? potentialTotalRewardText(potentialRewards) : null;
  if (rewardName) {
    headerText = translate('dismissDialog.rewardSpecifiedText', { rewardName });
  }

  const dismissText = translate('dismissDialog.dismissButton');
  const resumeText = translate('dismissDialog.resumeButton');

  return (<ModalDialog
    className="dismiss-dialog"
    isRenderedIfInvisible
    isVisible={props.isVisible}
    height={props.height}
    >
    <header>{headerText}</header>
    <footer>
      <button className="kwizzad-button-negative" onClick={props.onDismiss}>{dismissText}</button>
      <button className="kwizzad-button-positive" onClick={props.onResume}>{resumeText}</button>
    </footer>
  </ModalDialog>);
}
