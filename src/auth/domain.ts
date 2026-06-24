// Validacao de e-mail e do dominio permitido para o console interno.
// O acesso e restrito a e-mails cujo dominio esta exatamente na allowlist
// (ex.: garagem.dev.br) — sem aceitar subdominios ou bypass com multiplos "@".

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(input: string): string {
  return input.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email);
}

// Extrai o dominio apos o ultimo "@" (defesa contra "a@b@dominio").
export function emailDomain(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at < 0) return null;
  const domain = email.slice(at + 1);
  return domain.length ? domain : null;
}

// Aceita apenas e-mails validos cujo dominio esta exatamente na allowlist.
export function isAllowedDomain(email: string, allowedDomains: string[]): boolean {
  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized)) return false;
  const domain = emailDomain(normalized);
  if (!domain) return false;
  return allowedDomains.includes(domain);
}
