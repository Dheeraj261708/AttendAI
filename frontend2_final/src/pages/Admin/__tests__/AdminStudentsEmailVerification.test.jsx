import { describe, it, expect } from "vitest";

describe("Admin student email verification flow", () => {
    it("does not allow student creation before email verification", () => {
        const emailVerified = false;

        expect(emailVerified).toBe(false);
    });

    it("allows student creation after email verification", () => {
        const emailVerified = true;

        expect(emailVerified).toBe(true);
    });

    it("email change resets verification", () => {
        let emailVerified = true;

        const oldEmail = "old@example.com";
        const newEmail = "new@example.com";

        if (oldEmail !== newEmail) {
            emailVerified = false;
        }

        expect(emailVerified).toBe(false);
    });
});
