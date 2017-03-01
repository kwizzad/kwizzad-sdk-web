/* globals it */
/* globals describe */
import KwizzadDialog from 'app/components/kwizzad-dialog';
import React from 'react';
import TestUtils from 'react/lib/ReactTestUtils';
import expect from 'expect';

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
