import type { ContactSyncSettings } from './types/Settings';
import { requestUrl } from 'obsidian';
import { URL_OAUTH_TOKEN, URI_OATUH_REDIRECT } from './config';

/**
 * Manages OAuth2 authentication for accessing the Google Contacts API.
 * Handles exchanging authorization codes, refreshing access tokens,
 * and providing updated credentials.
 */
export class AuthManager {
  private clientId: string;
  private clientSecret: string;
  private accessToken: string;
  private refreshToken: string;
  private tokenExpiresAt: number;

  /**
   * Creates a new AuthManager instance using saved authentication settings.
   *
   * @param settings - The authentication and client configuration.
   */
  constructor(settings: ContactSyncSettings) {
    this.clientId = settings.clientId;
    this.clientSecret = settings.clientSecret;
    this.accessToken = settings.accessToken;
    this.refreshToken = settings.refreshToken;
    this.tokenExpiresAt = settings.tokenExpiresAt;
  }

  /**
   * Exchanges an authorization code for access and refresh tokens.
   *
   * @param code - The authorization code received from the OAuth flow.
   * @returns A promise that resolves when tokens have been successfully obtained.
   */
  async exchangeCode(code: string): Promise<void> {
    const body = {
      code: code,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: URI_OATUH_REDIRECT,
      grant_type: 'authorization_code',
    };
    const response = await requestUrl({
      url: URL_OAUTH_TOKEN,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json;
    this.accessToken = data.access_token;
    this.refreshToken = data.refresh_token || this.refreshToken;
    this.tokenExpiresAt = Date.now() + data.expires_in * 1000;
  }

  /**
   * Ensures the access token is valid and refreshes it if expired.
   *
   * @returns A promise that resolves to a valid access token.
   */
  async ensureValidToken(): Promise<string> {
    if (!this.accessToken || Date.now() > this.tokenExpiresAt) {
      await this.refreshTokenFlow();
    }
    return this.accessToken;
  }

  /**
   * Refreshes the access token using the refresh token.
   * Throws an error if the refresh token is missing or the request fails.
   *
   * @private
   * @returns A promise that resolves when the token has been refreshed.
   */
  private async refreshTokenFlow(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await requestUrl({
      url: URL_OAUTH_TOKEN,
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: this.refreshToken,
        grant_type: 'refresh_token',
      }).toString(),
    });
    const data = await response.json;
    if (!data.access_token) {
      throw new Error('Failed to refresh token');
    }
    this.accessToken = data.access_token;
    this.tokenExpiresAt = Date.now() + data.expires_in * 1000;
  }

  /**
   * Returns updated authentication-related settings that can be saved.
   *
   * @returns A partial settings object containing updated tokens and expiry.
   */
  getSettingsUpdate(): Partial<ContactSyncSettings> {
    return {
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
      tokenExpiresAt: this.tokenExpiresAt,
    };
  }
}
