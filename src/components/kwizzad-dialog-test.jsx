/* globals it */
/* globals describe */
import React from 'react';
import TestUtils from 'react/lib/ReactTestUtils';
import expect from 'expect';
import KwizzadDialog from '../components/kwizzad-dialog.jsx';

describe('KwizzadDialog', () => {
  it('renders without problems', () => {
    const props = {
      placement: { requestAd: () => {}, dismissAd: () => {} },
      placementId: 'myPlacement',
      apiKey: 'abc123',
    };
    const element = <KwizzadDialog {...props} />;
    const rootElement = TestUtils.renderIntoDocument(element);
    expect(rootElement).toExist();
  });
});
