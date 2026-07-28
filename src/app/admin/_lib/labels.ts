const statusLabels: Record<string, string> = {
  PENDING: "Ausstehend",
  PAID: "Bezahlt",
  PROCESSING: "In Bearbeitung",
  FULFILLED: "Abgeschlossen",
  CONFIRMED: "Bestätigt",
  COMPLETED: "Erledigt",
  CANCELLED: "Storniert",
  REFUNDED: "Erstattet",
};

export function adminStatusLabel(status: string) {
  return statusLabels[status] ?? status;
}

const uploadStateLabels: Record<string, string> = {
  queued: "Wartend",
  uploading: "Wird hochgeladen",
  success: "Hochgeladen",
  error: "Fehler",
};

export function uploadStateLabel(state: string) {
  return uploadStateLabels[state] ?? state;
}
