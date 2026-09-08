import api from "./api";

export const getStudents = async () => (await api.get("/students")).data;

export const getStudent = async (id) =>
  (await api.get(`/students/${id}`)).data;

export const addStudent = async (payload) =>
  (await api.post("/students", payload, {
    headers: { "Content-Type": "multipart/form-data" },
  })).data;

export const updateStudent = async (id, payload) =>
  (await api.put(`/students/${id}`, payload)).data;

export const deleteStudent = async (id) =>
  (await api.delete(`/students/${id}`)).data;
