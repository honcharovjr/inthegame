// Checks the site settings an admin types (C31). Pure, so it is tested.
// Empty fields are allowed: the public pages then show a placeholder.

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

// Returns { settings } with the database columns, or { error }.
export function validateSiteSettings(input) {
  const value = input && typeof input === "object" ? input : {};
  const operator = String(value.operatorName ?? "").trim();
  const email = String(value.contactEmail ?? "").trim();
  const age = String(value.minimumAge ?? "").trim();
  const updated = String(value.privacyUpdatedOn ?? "").trim();

  if (operator.length > 120) return { error: "The operator name can be 120 characters at most." };
  if (email && (email.length > 254 || !EMAIL.test(email))) return { error: "Enter a valid contact email." };

  let minimumAge = null;
  if (age) {
    minimumAge = Number(age);
    if (!Number.isInteger(minimumAge) || minimumAge < 13 || minimumAge > 21) {
      return { error: "The minimum age must be a whole number from 13 to 21." };
    }
  }

  if (updated && (!DAY.test(updated) || Number.isNaN(Date.parse(`${updated}T00:00:00Z`)))) {
    return { error: "Pick a valid date for the last update." };
  }

  return {
    settings: {
      operator_name: operator || null,
      contact_email: email || null,
      minimum_age: minimumAge,
      privacy_updated_on: updated || null,
    },
  };
}
