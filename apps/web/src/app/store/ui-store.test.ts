import { beforeEach, describe, expect, it } from 'vitest';

import { useWorkbenchUiStore } from './ui-store';

describe('workbench ui store', () => {
  beforeEach(() => {
    useWorkbenchUiStore.setState({
      activeDrawer: null,
      replayOpen: false,
    });
  });

  it('opens and closes evidence drawers', () => {
    useWorkbenchUiStore.getState().openDrawer('trust');
    expect(useWorkbenchUiStore.getState().activeDrawer).toBe('trust');

    useWorkbenchUiStore.getState().closeDrawer();
    expect(useWorkbenchUiStore.getState().activeDrawer).toBeNull();
  });

  it('toggles replay modal state independently', () => {
    useWorkbenchUiStore.getState().openReplay();
    expect(useWorkbenchUiStore.getState().replayOpen).toBe(true);

    useWorkbenchUiStore.getState().closeReplay();
    expect(useWorkbenchUiStore.getState().replayOpen).toBe(false);
  });
});
