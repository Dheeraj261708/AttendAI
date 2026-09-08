import api from "./api";

export const loginAdmin = async (
    username,
    password
) => {
    const response = await api.post(
        "/admin/login",
        {
            username,
            password,
        }
    );

    return response.data;
};

export const getAdminDashboard = async () => {
    const response = await api.get(
        "/admin/dashboard"
    );

    return response.data;
};

export const getAdminStudents = async () => {
    const response = await api.get(
        "/admin/students"
    );

    return response.data;
};

export const getAdminTeachers = async () => {
    const response = await api.get(
        "/admin/teachers"
    );

    return response.data;
};

export const getAdminTimetable = async () => {
    const response = await api.get(
        "/admin/timetable"
    );

    return response.data;
};

export const getAdminAttendance = async () => {
    const response = await api.get(
        "/admin/attendance"
    );

    return response.data;
};

export const getAdminUsers = async () => {
    const response = await api.get(
        "/admin/users"
    );

    return response.data;
};
export const getAllAdmins = async () => {
    const response = await api.get(
        "/admin/admins"
    );

    return response.data;
};

export const createAdminAccount = async (
    username,
    password
) => {
    const response = await api.post(
        "/admin/admins",
        {
            username,
            password,
        }
    );

    return response.data;
};
