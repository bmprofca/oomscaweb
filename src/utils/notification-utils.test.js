import { normalizeNotification } from './notification-utils';

test('normalizes CA notification fields and omits sensitive extras', () => {
  expect(normalizeNotification({
    notification_id: 'ca-1',
    title: 'Review requested',
    body: 'A task is ready for review',
    category: 'task',
    create_date: '2026-10-22T10:00:00.000Z',
    read_at: null,
    private_value: 'not copied',
  })).toEqual({
    id: 'ca-1',
    title: 'Review requested',
    body: 'A task is ready for review',
    category: 'task',
    createdAt: '2026-10-22T10:00:00.000Z',
    isRead: false,
  });
});
