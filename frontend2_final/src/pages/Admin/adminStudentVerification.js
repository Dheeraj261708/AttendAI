export function buildStudentCreatePayload(
    studentData,
    verificationToken
) {
    if (!verificationToken) {
        throw new Error(
            "Student email must be verified before account creation."
        );
    }

    return {
        ...studentData,
        emailVerificationToken: verificationToken,
    };
}
