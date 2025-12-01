import { http } from "@/api/http";

export interface PasskeyDto {
  id: number;
  name: string;
  createdAt: string;
}

export interface RegisterStartResponse {
  options: PublicKeyCredentialCreationOptions;
}

export interface AuthenticateStartResponse {
  options: PublicKeyCredentialRequestOptions;
  sessionId: string;
}

export interface AuthenticateFinishResponse {
  token: string;
  user: {
    id: number;
    name: string;
    avatar: string;
    email: string;
  };
  storages: Array<{
    id: number;
    name: string;
    path: string;
  }>;
}

// Registration flow
export async function startPasskeyRegistration(): Promise<PublicKeyCredential> {
  const response = await http.post("webauthn/register/start").json<any>();

  console.log("Backend response:", response);
  console.log("Options:", response.options);

  // Convert base64 strings to ArrayBuffers for WebAuthn API
  const publicKey = response.options.publicKey;
  const credentialCreationOptions: CredentialCreationOptions = {
    publicKey: {
      ...publicKey,
      challenge: base64ToArrayBuffer(publicKey.challenge),
      user: {
        ...publicKey.user,
        id: base64ToArrayBuffer(publicKey.user.id),
      },
      excludeCredentials:
        publicKey.excludeCredentials?.map((cred: any) => ({
          ...cred,
          id: base64ToArrayBuffer(cred.id),
        })) || [],
    },
  };

  console.log("Converted options:", credentialCreationOptions);

  // Use native browser WebAuthn API to create credential
  const credential = await navigator.credentials.create(
    credentialCreationOptions,
  );

  if (!credential) {
    throw new Error("Failed to create credential");
  }

  return credential as PublicKeyCredential;
}

export async function finishPasskeyRegistration(
  credential: PublicKeyCredential,
  name: string,
): Promise<void> {
  const response = credential.response as AuthenticatorAttestationResponse;

  // Convert credential to JSON format for backend
  const credentialJSON = {
    id: credential.id,
    rawId: arrayBufferToBase64(credential.rawId),
    response: {
      clientDataJSON: arrayBufferToBase64(response.clientDataJSON),
      attestationObject: arrayBufferToBase64(response.attestationObject),
    },
    type: credential.type,
  };

  await http.post("webauthn/register/finish", {
    json: {
      name,
      credential: credentialJSON,
    },
  });
}

// Authentication flow
export async function startPasskeyAuthentication(
  email: string,
): Promise<{ credential: PublicKeyCredential; sessionId: string }> {
  const response = await http
    .post("webauthn/authenticate/start", {
      json: { email },
    })
    .json<any>();

  // Convert base64 strings to ArrayBuffers for WebAuthn API
  const publicKey = response.options.publicKey;
  const credentialRequestOptions: CredentialRequestOptions = {
    publicKey: {
      ...publicKey,
      challenge: base64ToArrayBuffer(publicKey.challenge),
      allowCredentials:
        publicKey.allowCredentials?.map((cred: any) => ({
          ...cred,
          id: base64ToArrayBuffer(cred.id),
        })) || [],
    },
  };

  // Use native browser WebAuthn API to get credential
  const credential = await navigator.credentials.get(credentialRequestOptions);

  if (!credential) {
    throw new Error("Failed to get credential");
  }

  return {
    credential: credential as PublicKeyCredential,
    sessionId: response.sessionId,
  };
}

export async function finishPasskeyAuthentication(
  credential: PublicKeyCredential,
  sessionId: string,
): Promise<AuthenticateFinishResponse> {
  const response = credential.response as AuthenticatorAssertionResponse;

  // Convert credential to JSON format for backend
  const credentialJSON = {
    id: credential.id,
    rawId: arrayBufferToBase64(credential.rawId),
    response: {
      clientDataJSON: arrayBufferToBase64(response.clientDataJSON),
      authenticatorData: arrayBufferToBase64(response.authenticatorData),
      signature: arrayBufferToBase64(response.signature),
      userHandle: response.userHandle
        ? arrayBufferToBase64(response.userHandle)
        : null,
    },
    type: credential.type,
  };

  return http
    .post("webauthn/authenticate/finish", {
      json: {
        sessionId,
        credential: credentialJSON,
      },
    })
    .json<AuthenticateFinishResponse>();
}

// Management
export async function listPasskeys(): Promise<PasskeyDto[]> {
  return http.get("webauthn/list").json<PasskeyDto[]>();
}

export async function deletePasskey(id: number): Promise<void> {
  await http.post(`webauthn/delete/${id}`);
}

// Helper function to convert ArrayBuffer to base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper function to convert base64 (or base64url) to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  // Handle both base64 and base64url formats
  const base64Cleaned = base64.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (base64Cleaned.length % 4)) % 4);
  const base64Padded = base64Cleaned + padding;

  const binaryString = atob(base64Padded);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}
