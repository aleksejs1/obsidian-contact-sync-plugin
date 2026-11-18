import { requestUrl } from 'obsidian';
import { AuthManager } from 'src/auth/AuthManager';
import { getAuthUrl } from 'src/auth/getAuthUrl';
import { DEFAULT_SETTINGS } from 'src/config';

jest.mock('obsidian', () => ({ requestUrl: jest.fn() }));

const WRITE = 'https://www.googleapis.com/auth/contacts';
const READ = 'https://www.googleapis.com/auth/contacts.readonly';

describe('AuthManager scopes', () => {
  const mock = requestUrl as jest.Mock;

  it('has no write scope for existing read-only setups', () => {
    expect(new AuthManager({ ...DEFAULT_SETTINGS }).hasWriteScope()).toBe(
      false
    );
  });

  it('stores the scopes granted on code exchange', async () => {
    mock.mockResolvedValue({
      json: {
        access_token: 'a',
        refresh_token: 'r',
        expires_in: 3600,
        scope: `${WRITE} openid`,
      },
    });
    const auth = new AuthManager({ ...DEFAULT_SETTINGS });

    await auth.exchangeCode('code');

    expect(auth.hasWriteScope()).toBe(true);
    expect(auth.getSettingsUpdate().grantedScopes).toBe(`${WRITE} openid`);
  });

  it('does not treat the read-only scope as write access', () => {
    const auth = new AuthManager({ ...DEFAULT_SETTINGS, grantedScopes: READ });
    expect(auth.hasWriteScope()).toBe(false);
  });

  it('keeps known scopes when a refresh response omits them', async () => {
    mock.mockResolvedValue({ json: { access_token: 'b', expires_in: 3600 } });
    const auth = new AuthManager({
      ...DEFAULT_SETTINGS,
      refreshToken: 'r',
      grantedScopes: WRITE,
    });

    await auth.ensureValidToken();

    expect(auth.hasWriteScope()).toBe(true);
  });
});

describe('getAuthUrl', () => {
  it('requests read-only access by default', () => {
    const scope = new URL(getAuthUrl('id')).searchParams.get('scope');
    expect(scope?.split(' ')).toContain(READ);
    expect(scope?.split(' ')).not.toContain(WRITE);
  });

  it('requests full contacts access for write-back', () => {
    const scope = new URL(getAuthUrl('id', true)).searchParams.get('scope');
    expect(scope?.split(' ')).toContain(WRITE);
  });
});

describe('AuthManager scope fallback', () => {
  it('assumes the requested scopes when the token response omits them', async () => {
    (requestUrl as jest.Mock).mockResolvedValue({
      json: { access_token: 'a', refresh_token: 'r', expires_in: 3600 },
    });
    const auth = new AuthManager({ ...DEFAULT_SETTINGS });

    await auth.exchangeCode('code', `${WRITE} other`);

    expect(auth.hasWriteScope()).toBe(true);
  });
});
