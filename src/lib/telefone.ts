/**
 * Smart phone mask: +55 (00) 90000-0000
 * Defaults: country code 55, area code 31
 */

const DEFAULT_COUNTRY = "55";
const DEFAULT_DDD = "31";

export function formatTelefone(value: string): string {
  // Extract only digits
  let digits = value.replace(/\D/g, "");

  // Always strip leading country code 55 so we work with national digits only
  if (digits.startsWith("55") && digits.length > 2) {
    digits = digits.slice(2);
  }

  // Cap at 11 digits (DDD + number)
  digits = digits.slice(0, 11);

  if (digits.length === 0) return "+55 (31) ";
  if (digits.length <= 2) return `+55 (${digits}`;
  if (digits.length <= 7) return `+55 (${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    // Landline: +55 (00) 0000-0000
    return `+55 (${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  // Mobile: +55 (00) 90000-0000
  return `+55 (${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/**
 * Extract digits for DB persistence: always includes country code 55.
 * e.g. "5531900000000" (13 digits for mobile)
 */
export function unformatTelefone(value: string): string {
  let digits = value.replace(/\D/g, "");

  // If already starts with 55 and has 12-13 digits, it's complete
  if (digits.startsWith("55") && digits.length >= 12) {
    return digits.slice(0, 13);
  }

  // If it's national digits only (10-11), prepend 55
  if (digits.length >= 10 && digits.length <= 11) {
    return "55" + digits;
  }

  // Partial or empty — return as-is (won't pass validation anyway)
  if (digits.startsWith("55")) {
    return digits.slice(0, 13);
  }
  return digits.length > 0 ? "55" + digits.slice(0, 11) : "";
}

/**
 * Format for display (read-only contexts).
 * If digits are empty, returns "—".
 */
export function displayTelefone(value: string): string {
  const digits = unformatTelefone(value);
  if (digits.length === 0) return "—";
  return formatTelefone(digits);
}

/**
 * Handle phone input change: formats and limits.
 * Returns the formatted value.
 */
export function handleTelefoneInput(rawValue: string): string {
  return formatTelefone(rawValue);
}

/**
 * Returns default empty phone value with prefilled codes.
 */
export function defaultTelefone(): string {
  return `+${DEFAULT_COUNTRY} (${DEFAULT_DDD}) `;
}

// DDDs válidos no Brasil (2 dígitos)
const VALID_DDDS = new Set([
  "11","12","13","14","15","16","17","18","19", // SP
  "21","22","24", // RJ
  "27","28", // ES
  "31","32","33","34","35","37","38", // MG
  "41","42","43","44","45","46", // PR
  "47","48","49", // SC
  "51","53","54","55", // RS
  "61", // DF
  "62","64", // GO
  "63", // TO
  "65","66", // MT
  "67", // MS
  "68", // AC
  "69", // RO
  "71","73","74","75","77", // BA
  "79", // SE
  "81","82", // PE/AL
  "83", // PB
  "84", // RN
  "85","88", // CE
  "86","89", // PI
  "87", // PE
  "91","93","94", // PA
  "92","97", // AM
  "95", // RR
  "96", // AP
  "98","99", // MA
]);

/**
 * Validates a phone number (already unformatted, e.g. "5531999870106").
 * Returns error message or null if valid.
 */
export function validateTelefone(digits: string): string | null {
  if (digits.length === 0) return null; // empty is ok (optional)

  // Must start with 55
  if (!digits.startsWith("55")) return "Telefone deve iniciar com código do país 55";

  const national = digits.slice(2);

  if (national.length < 10 || national.length > 11) {
    return "Telefone incompleto. Deve ter 10 ou 11 dígitos após o código do país";
  }

  const ddd = national.slice(0, 2);
  if (!VALID_DDDS.has(ddd)) {
    return `DDD ${ddd} inválido`;
  }

  // Mobile numbers (11 digits) must start with 9 after DDD
  if (national.length === 11 && national[2] !== "9") {
    return "Celular deve começar com 9 após o DDD";
  }

  return null;
}
