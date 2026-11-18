import {
  URI_OATUH_REDIRECT,
  URL_OAUTH_SCOPE,
  URL_OAUTH_SCOPE_WRITE,
  URL_OAUTH_AUTH,
} from 'src/config';

/**
 * Generates the Google OAuth2 authorization URL for user authentication.
 *
 * @param clientId - The OAuth2 client ID provided by Google.
 * @param writeAccess - Request full contacts access (needed for notes write-back).
 * @returns A complete URL string that initiates the OAuth2 authorization flow.
 */
export function getAuthUrl(clientId: string, writeAccess = false): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: URI_OATUH_REDIRECT,
    response_type: 'code',
    scope: getRequestedScopes(writeAccess),
  });
  return `${URL_OAUTH_AUTH}?${params.toString()}`;
}

/**
 * Scopes requested during login.
 *
 * @param writeAccess - Whether notes write-back is enabled.
 * @returns Space-separated scopes.
 */
export function getRequestedScopes(writeAccess: boolean): string {
  return writeAccess ? URL_OAUTH_SCOPE_WRITE : URL_OAUTH_SCOPE;
}
