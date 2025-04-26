import { URI_OATUH_REDIRECT, URL_OAUTH_SCOPE, URL_OAUTH_AUTH } from '../config';

/**
 * Generates the Google OAuth2 authorization URL for user authentication.
 *
 * @param clientId - The OAuth2 client ID provided by Google.
 * @returns A complete URL string that initiates the OAuth2 authorization flow.
 */
export function getAuthUrl(clientId: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: URI_OATUH_REDIRECT,
    response_type: 'code',
    scope: URL_OAUTH_SCOPE,
  });
  return `${URL_OAUTH_AUTH}?${params.toString()}`;
}
