import api from "./api";

// =============================
// Student Authentication
// =============================

export const loginStudent = async (credentials) => {
  const response = await api.post("/auth/login", credentials);
  return response.data;
};

export const registerStudent = async (payload) => {
  const response = await api.post("/auth/register", payload);
  return response.data;
};


// =============================
// Teacher Authentication
// =============================

export const loginTeacher = async (credentials) => {
  const response = await api.post("/teacher/login", credentials);
  return response.data;
};

export const registerTeacher = async (payload) => {
  const response = await api.post("/teacher/register", payload);
  return response.data;
};


// =============================
// Backward compatibility
// =============================

export const loginUser = loginStudent;
export const registerUser = registerStudent;

export const requestPasswordReset = async ({
  role,
  identifier,
}) => {
  const response = await api.post(
    "/auth/password/forgot",
    {
      role,
      identifier,
    }
  );

  return response.data;
};


export const verifyPasswordResetOTP = async ({
  role,
  identifier,
  otp,
}) => {
  const response = await api.post(
    "/auth/password/verify-otp",
    {
      role,
      identifier,
      otp,
    }
  );

  return response.data;
};


export const resetPassword = async ({
  role,
  identifier,
  otp,
  newPassword,
}) => {
  const response = await api.post(
    "/auth/password/reset",
    {
      role,
      identifier,
      otp,
      newPassword,
    }
  );

  return response.data;
};
