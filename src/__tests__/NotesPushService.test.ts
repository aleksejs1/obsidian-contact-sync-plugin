import { TFile } from 'obsidian';
import { NOTES_PUSH_CONFIRM_THRESHOLD } from 'src/config';
import { NotesPushDeps, NotesPushService } from 'src/services/NotesPushService';
import { NotesSyncReport, PendingNotesPush } from 'src/types/NotesSync';

const push = (name: string): PendingNotesPush => ({
  name,
  text: `notes of ${name}`,
  file: { path: `${name}.md` } as TFile,
  contact: { resourceName: `people/${name}` },
});

const report = (
  pushes: PendingNotesPush[],
  extra: Partial<NotesSyncReport> = {}
): NotesSyncReport => ({
  pushes,
  conflicts: [],
  readOnly: [],
  broken: [],
  ...extra,
});

describe('NotesPushService', () => {
  let deps: jest.Mocked<NotesPushDeps>;
  let service: NotesPushService;

  beforeEach(() => {
    deps = {
      updateContactNotes: jest.fn().mockResolvedValue({ ok: true }),
      markNotesPushed: jest.fn().mockResolvedValue(undefined),
      hasWriteScope: jest.fn().mockReturnValue(true),
      confirm: jest.fn().mockResolvedValue(true),
      notify: jest.fn(),
    };
    service = new NotesPushService(deps);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('does nothing when there is nothing to push', async () => {
    const result = await service.pushNotes('tkn', report([]));

    expect(result).toEqual({ pushed: 0, failed: [], skipped: false });
    expect(deps.updateContactNotes).not.toHaveBeenCalled();
    expect(deps.notify).not.toHaveBeenCalled();
  });

  it('sends each push and records it', async () => {
    const pushes = [push('a'), push('b')];
    const result = await service.pushNotes('tkn', report(pushes));

    expect(deps.updateContactNotes).toHaveBeenCalledTimes(2);
    expect(deps.updateContactNotes).toHaveBeenCalledWith(
      'tkn',
      pushes[0]?.contact,
      'notes of a'
    );
    expect(deps.markNotesPushed).toHaveBeenCalledTimes(2);
    expect(result.pushed).toBe(2);
    expect(deps.confirm).not.toHaveBeenCalled();
  });

  it('sends requests one at a time', async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    deps.updateContactNotes.mockImplementation(async () => {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await Promise.resolve();
      inFlight--;
      return { ok: true };
    });

    await service.pushNotes('tkn', report([push('a'), push('b'), push('c')]));

    expect(maxInFlight).toBe(1);
  });

  it('skips pushing without the write scope', async () => {
    deps.hasWriteScope.mockReturnValue(false);

    const result = await service.pushNotes('tkn', report([push('a')]));

    expect(result.skipped).toBe(true);
    expect(deps.updateContactNotes).not.toHaveBeenCalled();
    expect(deps.notify).toHaveBeenCalledTimes(1);
  });

  it('asks for confirmation above the threshold and respects a cancel', async () => {
    deps.confirm.mockResolvedValue(false);
    const pushes = Array.from(
      { length: NOTES_PUSH_CONFIRM_THRESHOLD + 1 },
      (_, i) => push(`p${i}`)
    );

    const result = await service.pushNotes('tkn', report(pushes));

    expect(deps.confirm).toHaveBeenCalledWith(pushes.map((p) => p.name));
    expect(result.skipped).toBe(true);
    expect(deps.updateContactNotes).not.toHaveBeenCalled();
  });

  it('does not ask for confirmation at the threshold', async () => {
    const pushes = Array.from(
      { length: NOTES_PUSH_CONFIRM_THRESHOLD },
      (_, i) => push(`p${i}`)
    );

    await service.pushNotes('tkn', report(pushes));

    expect(deps.confirm).not.toHaveBeenCalled();
    expect(deps.updateContactNotes).toHaveBeenCalledTimes(
      NOTES_PUSH_CONFIRM_THRESHOLD
    );
  });

  it('does not record failed pushes and continues with the rest', async () => {
    deps.updateContactNotes
      .mockResolvedValueOnce({ ok: false, status: 400, message: 'too long' })
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce({ ok: true });

    const result = await service.pushNotes(
      'tkn',
      report([push('a'), push('b'), push('c')])
    );

    expect(result).toEqual({ pushed: 1, failed: ['a', 'b'], skipped: false });
    expect(deps.markNotesPushed).toHaveBeenCalledTimes(1);
    expect(deps.notify).toHaveBeenCalledWith(expect.stringContaining('a, b'));
  });

  it('reports conflicts and read-only contacts', async () => {
    await service.pushNotes(
      'tkn',
      report([], { conflicts: ['x'], readOnly: ['y'] })
    );

    expect(deps.notify).toHaveBeenCalledWith(expect.stringContaining('x'));
    expect(deps.notify).toHaveBeenCalledWith(expect.stringContaining('y'));
  });

  it('shortens long name lists', async () => {
    const conflicts = Array.from({ length: 12 }, (_, i) => `n${i}`);

    await service.pushNotes('tkn', report([], { conflicts }));

    expect(deps.notify).toHaveBeenCalledWith(expect.stringContaining('(+2)'));
  });
});

describe('NotesPushService.reportProblems', () => {
  it('reports notes with broken markers', () => {
    const notify = jest.fn();
    const service = new NotesPushService({
      updateContactNotes: jest.fn(),
      markNotesPushed: jest.fn(),
      hasWriteScope: () => true,
      confirm: jest.fn(),
      notify,
    });

    service.reportProblems({
      pushes: [],
      conflicts: [],
      readOnly: [],
      broken: ['Bob'],
    });

    expect(notify).toHaveBeenCalledWith(expect.stringContaining('Bob'));
  });
});
