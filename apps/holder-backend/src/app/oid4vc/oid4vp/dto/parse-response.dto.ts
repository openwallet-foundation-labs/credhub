export class Cred {
  iss: string;
  vct: string;
  jti: string;
}
export class VerifyRequestClaim {
  purpose: string;

  credentials: Cred[];

  id: string;
}

class RelyingParty {
  name: string;

  logo?: string;
}

export class Oid4vpParseRepsonse {
  /**
   * Session of this verify request
   */
  sessionId: string;

  /**
   * General purpose
   */
  purpose: string;

  requests: VerifyRequestClaim[];

  rp: RelyingParty;
}
