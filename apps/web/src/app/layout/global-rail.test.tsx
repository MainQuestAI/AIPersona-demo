import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import { useShellUiStore } from '../providers';
import { GlobalRail } from './global-rail';

describe('GlobalRail', () => {
  beforeEach(() => {
    useShellUiStore.setState({
      railCollapsed: false,
      mobileRailOpen: false,
      theme: 'light',
    });
  });

  afterEach(() => {
    useShellUiStore.setState({
      railCollapsed: false,
      mobileRailOpen: false,
      theme: 'light',
    });
  });

  it('shows the MirrorWorld brand in the expanded rail', () => {
    const html = renderToString(
      <MemoryRouter>
        <GlobalRail />
      </MemoryRouter>,
    );

    expect(html).toContain('MirrorWorld');
    expect(html).not.toContain('AIpersona');
  });

  it('clips overflow when the rail is collapsed', () => {
    useShellUiStore.setState({
      railCollapsed: true,
      mobileRailOpen: false,
    });

    const html = renderToString(
      <MemoryRouter>
        <GlobalRail />
      </MemoryRouter>,
    );

    expect(html).toContain('overflow-x-hidden');
    expect(html).toContain('shrink-0');
  });

  it('shows the dark mode toggle label when the app is in light mode', () => {
    const html = renderToString(
      <MemoryRouter>
        <GlobalRail />
      </MemoryRouter>,
    );

    expect(html).toContain('切换深色模式');
    expect(html).toContain('深色模式');
  });
});
