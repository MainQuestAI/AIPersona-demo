import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';

import { appRoutes } from '@/app/routes';

function renderRoute(path: string): string {
  const router = createMemoryRouter(appRoutes, {
    initialEntries: [path],
  });
  return renderToString(<RouterProvider router={router} />);
}

describe('route smoke', () => {
  it('renders dashboard route shell without crashing', () => {
    const html = renderRoute('/dashboard');
    expect(html).toContain('业务总览');
    expect(html).toContain('正在加载业务概览');
  });

  it('renders studies route shell without crashing', () => {
    const html = renderRoute('/studies');
    expect(html).toContain('研究项目');
    expect(html).toContain('正在加载研究列表');
  });

  it('renders consumer twins route shell without crashing', () => {
    const html = renderRoute('/consumer-twins');
    expect(html).toContain('孪生中心');
    expect(html).toContain('正在加载数字孪生');
  });

  it('renders study detail workbench route shell without crashing', () => {
    const html = renderRoute('/studies/study-1/workbench');
    expect(html).toContain('研究详情');
    expect(html).toContain('正在加载研究详情');
  });
});
