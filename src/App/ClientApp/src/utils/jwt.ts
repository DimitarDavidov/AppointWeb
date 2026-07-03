export interface JwtPayload {
  sub?: string;
  email?: string;
  username?: string;
  unique_name?: string;
  role?: string;
}

const ROLE_CLAIM =
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

function base64UrlDecode(value: string): string {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = base64.length % 4;
  const padded = padding ? base64 + "=".repeat(4 - padding) : base64;
  return atob(padded);
}

export function parseJwt(token: string): JwtPayload {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(base64UrlDecode(payload)) as Record<
      string,
      string
    >;

    return {
      sub: decoded.sub,
      email: decoded.email,
      username: decoded.unique_name ?? decoded.username,
      role: decoded.role ?? decoded[ROLE_CLAIM],
    };
  } catch {
    return {};
  }
}
