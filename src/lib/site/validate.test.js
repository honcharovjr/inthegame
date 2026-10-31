import { describe, expect, it } from "vitest";
import { validateSiteSettings } from "./validate";

describe("validateSiteSettings", () => {
  it("accepts all fields and trims them", () => {
    const result = validateSiteSettings({
      operatorName: "  Max Honcharov ",
      contactEmail: "hello@inthegame.app",
      minimumAge: "16",
      privacyUpdatedOn: "2026-11-01",
    });
    expect(result.settings).toEqual({
      operator_name: "Max Honcharov",
      contact_email: "hello@inthegame.app",
      minimum_age: 16,
      privacy_updated_on: "2026-11-01",
    });
  });

  it("stores empty fields as null", () => {
    expect(validateSiteSettings({}).settings).toEqual({
      operator_name: null,
      contact_email: null,
      minimum_age: null,
      privacy_updated_on: null,
    });
  });

  it("rejects a bad email", () => {
    expect(validateSiteSettings({ contactEmail: "not an email" }).error).toMatch(/email/);
  });

  it("rejects an age outside 13 to 21 or not whole", () => {
    expect(validateSiteSettings({ minimumAge: "12" }).error).toMatch(/age/);
    expect(validateSiteSettings({ minimumAge: "22" }).error).toMatch(/age/);
    expect(validateSiteSettings({ minimumAge: "16.5" }).error).toMatch(/age/);
  });

  it("rejects a bad date", () => {
    expect(validateSiteSettings({ privacyUpdatedOn: "01/11/2026" }).error).toMatch(/date/);
    expect(validateSiteSettings({ privacyUpdatedOn: "2026-13-40" }).error).toMatch(/date/);
  });
});
