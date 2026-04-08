import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { MidrunReviewCard } from './midrun-review-card';

describe('MidrunReviewCard', () => {
  it('renders decision support metrics and recommendation copy', () => {
    const html = renderToString(
      <MidrunReviewCard
        event={{
          id: 'midrun-review-1',
          type: 'midrun_review_card',
          title: '中途审批',
          body: ['定性探索已经充分，可以继续推进。'],
          decisionSummary: '当前定性阶段已经形成足够稳定的判断信号。',
          metrics: [
            { label: '目标人群覆盖', value: '2 / 2 已覆盖', tone: 'positive' },
            { label: '访谈轮次', value: '6 轮已完成', tone: 'positive' },
          ],
          focusThemes: ['功能可信度', '情绪安全感'],
          recommendation: '建议继续进入定量排序。',
          actions: ['继续定量排序', '暂停编辑'],
        }}
      />,
    );

    expect(html).toContain('当前定性阶段已经形成足够稳定的判断信号');
    expect(html).toContain('目标人群覆盖');
    expect(html).toContain('2 / 2 已覆盖');
    expect(html).toContain('功能可信度');
    expect(html).toContain('建议继续进入定量排序');
  });
});
