import "server-only";

export function getAuthorizedOwnerEmail() {
  return process.env.AUTHORIZED_OWNER_EMAIL?.trim().toLocaleLowerCase("en-US") ?? null;
}

