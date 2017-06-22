/* globals it */
/* globals describe */
import React from 'react';
import renderer from 'react-test-renderer';
import KwizzadDialog from '../components/kwizzad-dialog.jsx';

describe('KwizzadDialog', () => {
  it('renders without problems', () => {
    const props = {
      placement: { requestAd: () => {}, dismissAd: () => {} },
      placementId: 'myPlacement',
      apiKey: 'abc123',
    };
    const element = <KwizzadDialog {...props} />;
    const tree = renderer.create(element).toJSON();

    // See https://facebook.github.io/jest/docs/en/snapshot-testing.html#content to learn how this
    // works.
    expect(tree).toMatchSnapshot();
  });
});
