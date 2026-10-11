export const MAX_PORTFOLIO_PDF_SIZE = 30 * 1024 * 1024;
export const PORTFOLIO_DOWNLOAD_NAME = "Gian-Luca-Blasius-Portfolio.pdf";

export function isPortfolioPdfKey(key: string) {
  return /^portfolio\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.pdf$/.test(
    key,
  );
}

export function hasPdfHeader(bytes: Uint8Array) {
  return (
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d
  );
}
