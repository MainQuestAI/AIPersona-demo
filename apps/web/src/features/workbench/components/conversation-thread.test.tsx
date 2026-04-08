import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import type { ConversationEvent } from '@/types/demo';

import { ConversationThread } from './conversation-thread';

const events: ConversationEvent[] = [
  {
    id: 'event-1',
    type: 'agent_message',
    title: '研究计划已生成',
    body: '当前研究计划已经准备就绪。',
  },
  {
    id: 'event-2',
    type: 'qual_session_card',
    runningOn: ['孕期女性'],
    completedSessionsLabel: '已完成 2 / 6 轮',
    completedSessionsNote: '定性阶段正在进行。',
    emergingThemes: ['情绪安全感'],
    helperText: '系统正在沉淀主题。',
    excerpts: [],
  },
  {
    id: 'event-3',
    type: 'midrun_review_card',
    title: '中途审批',
    body: ['请确认是否继续进入定量排序。'],
    actions: ['继续定量排序'],
  },
];

describe('ConversationThread', () => {
  it('renders playback progress and skip action while streaming', () => {
    const html = renderToString(
      <ConversationThread
        events={events}
        visibleCount={1}
        isStreaming
        onCardAction={vi.fn()}
        playbackProgress={{ current: 1, total: 3 }}
        onSkipPlayback={vi.fn()}
      />,
    );

    expect(html).toContain('已完成 1 / 3 个关键节点');
    expect(html).toContain('33%');
    expect(html).toContain('跳过回放');
  });
});
