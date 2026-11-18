import { requestUrl } from 'obsidian';
import { GoogleContactsService } from 'src/services/GoogleContactsService';
import { GoogleContact } from 'src/types/Contact';

jest.mock('obsidian', () => ({ requestUrl: jest.fn() }));

const contact: GoogleContact = {
  resourceName: 'people/c1',
  etag: 'person-etag',
  metadata: {
    sources: [
      { type: 'CONTACT', id: 'c1', etag: 'src-etag' },
      { type: 'PROFILE', id: 'p1', etag: 'profile-etag' },
    ],
  },
};

describe('GoogleContactsService.updateContactNotes', () => {
  const service = new GoogleContactsService();
  const mock = requestUrl as jest.Mock;

  beforeEach(() => {
    mock.mockReset();
  });

  it('sends a biographies-only update with the etags', async () => {
    mock.mockResolvedValue({ status: 200, json: {} });

    const result = await service.updateContactNotes('tkn', contact, 'hello');

    expect(result).toEqual({ ok: true });
    const req = mock.mock.calls[0]?.[0] as {
      url: string;
      method: string;
      headers: Record<string, string>;
      body: string;
      throw: boolean;
    };
    expect(req.url).toBe(
      'https://people.googleapis.com/v1/people/c1:updateContact?updatePersonFields=biographies'
    );
    expect(req.method).toBe('PATCH');
    expect(req.headers.Authorization).toBe('Bearer tkn');
    expect(req.throw).toBe(false);
    expect(JSON.parse(req.body)).toEqual({
      resourceName: 'people/c1',
      etag: 'person-etag',
      metadata: {
        sources: [{ type: 'CONTACT', id: 'c1', etag: 'src-etag' }],
      },
      biographies: [{ value: 'hello', contentType: 'TEXT_PLAIN' }],
    });
  });

  it('clears the notes with an empty list', async () => {
    mock.mockResolvedValue({ status: 200, json: {} });

    await service.updateContactNotes('tkn', contact, '');

    const req = mock.mock.calls[0]?.[0] as { body: string };
    expect(JSON.parse(req.body)).toMatchObject({ biographies: [] });
  });

  it('returns the Google error message on failure', async () => {
    mock.mockResolvedValue({
      status: 400,
      json: {
        error: { message: 'etag mismatch', status: 'FAILED_PRECONDITION' },
      },
    });

    await expect(
      service.updateContactNotes('tkn', contact, 'x')
    ).resolves.toEqual({ ok: false, status: 400, message: 'etag mismatch' });
  });

  it('falls back to the HTTP status when the body is not JSON', async () => {
    mock.mockResolvedValue({
      status: 500,
      get json(): unknown {
        throw new SyntaxError('not json');
      },
    });

    await expect(
      service.updateContactNotes('tkn', contact, 'x')
    ).resolves.toEqual({ ok: false, status: 500, message: 'HTTP 500' });
  });
});
