/**
 * Public provider details for the Impressum.
 *
 * Replace every value marked with "BITTE" before publishing the site.
 * Add optional register or VAT details to the Impressum page if they apply to
 * the business.
 */
export const legalDetails = {
  providerName: "Gian-Luca Blasius",
  streetAddress: "Saarlouis",
  postalCodeAndCity: "Roden",
  email: "anfrage@gian-luca.art",
  phone: "",
  vatId: "",
  registerName: "",
  registerNumber: "",
} as const;

export const legalDetailsComplete = [
  legalDetails.providerName,
  legalDetails.streetAddress,
  legalDetails.postalCodeAndCity,
  legalDetails.email,
  legalDetails.phone,
].every((value) => !value.startsWith("BITTE"));
