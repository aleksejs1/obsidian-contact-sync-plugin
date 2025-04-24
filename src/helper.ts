import {
  URI_OATUH_REDIRECT,
  URL_OAUTH_SCOPE,
  URL_OAUTH_AUTH
} from "./config";

export function getAuthUrl(clientId: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: URI_OATUH_REDIRECT,
    response_type: "code",
    scope: URL_OAUTH_SCOPE,
  });
  return `${URL_OAUTH_AUTH}?${params.toString()}`;
}
