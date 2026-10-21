const { selectSuperseded, isDue, createCleanup, deleteUrl } = require('../src/utils/dailyDrawXCleanup.cjs');

const rec = (id, date, extra = {}) => ({
  id, drawId: id, status: 'published', postId: `10${id}`, draw: { drawDate: date }, deleteStatus: null, deleteAttempts: 0, ...extra,
});

function setup(records, remove, overrides = {}) {
  const finished = [];
  const repository = {
    listPublished: async () => records,
    claimDelete: async () => true,
    finishDelete: async (id, values) => finished.push({ id, ...values }),
  };
  const run = createCleanup({
    repository, remove, config: { enabled: true, deletePrevious: true, credentials: {}, ...overrides },
    logger: { log() {}, error() {} },
  });
  return { run, finished };
}

describe('daily draw X cleanup', () => {
  test('selects only announcements older than the newest live one', () => {
    const picked = selectSuperseded([rec(1, '2026-10-19'), rec(2, '2026-10-20'), rec(3, '2026-10-21', { status: 'failed' })]);
    expect(picked.map((r) => r.id)).toEqual([1]);
    expect(selectSuperseded([rec(1, '2026-10-19')])).toEqual([]);
    expect(selectSuperseded([rec(1, '2026-10-19'), rec(2, '2026-10-20', { postId: null })])).toEqual([]);
  });

  test('isDue honors status, schedule and attempts', () => {
    const now = new Date('2026-10-21T00:00:00Z');
    expect(isDue(rec(1, 'x'), now)).toBe(true);
    expect(isDue(rec(1, 'x', { deleteStatus: 'failed', deleteNextAttemptAt: '2026-10-20T00:00:00Z', deleteAttempts: 1 }), now)).toBe(true);
    expect(isDue(rec(1, 'x', { deleteStatus: 'failed', deleteNextAttemptAt: null, deleteAttempts: 3 }), now)).toBe(false);
    expect(isDue(rec(1, 'x', { deleteStatus: 'deleted' }), now)).toBe(false);
  });

  test('deleteUrl rejects non-numeric ids', () => {
    expect(deleteUrl('123')).toBe('https://api.x.com/2/tweets/123');
    expect(() => deleteUrl('1/../2')).toThrow();
  });

  test('deletes superseded posts and marks them deleted', async () => {
    const remove = jest.fn(async () => ({ data: { data: { deleted: true } } }));
    const { run, finished } = setup([rec(1, '2026-10-19'), rec(2, '2026-10-20')], remove);
    expect(await run()).toEqual({ status: 'complete', deleted: 1 });
    expect(remove).toHaveBeenCalledTimes(1);
    expect(finished[0]).toMatchObject({ id: 1, deleteStatus: 'deleted' });
  });

  test('404 counts as deleted; unconfirmed response fails', async () => {
    const gone = setup([rec(1, '2026-10-19'), rec(2, '2026-10-20')], async () => {
      throw Object.assign(new Error('nf'), { response: { status: 404 } });
    });
    expect((await gone.run()).deleted).toBe(1);
    const bad = setup([rec(1, '2026-10-19'), rec(2, '2026-10-20')], async () => ({ data: {} }));
    await bad.run();
    expect(bad.finished[0]).toMatchObject({ deleteStatus: 'failed', deleteErrorCode: 'X_DELETE_NOT_CONFIRMED' });
  });

  test('does nothing when disabled', async () => {
    const remove = jest.fn();
    const { run } = setup([rec(1, '2026-10-19'), rec(2, '2026-10-20')], remove, { deletePrevious: false });
    expect((await run()).status).toBe('disabled');
    expect(remove).not.toHaveBeenCalled();
  });
});
