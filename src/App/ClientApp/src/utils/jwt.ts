export interface JwtPayload {
  sub?: string;
  email?: string;
  role?: string;
}

const ROLE_CLAIM =
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

export function parseJwt(token: string): JwtPayload {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload)) as Record<string, string>;

    return {
      sub: decoded.sub,
      email: decoded.email,
      role: decoded.role ?? decoded[ROLE_CLAIM],
    };
  } catch {
    return {};
  }
}
