import http from "../../../api/http";

export const fetchDepartmentsFlat = () =>
  http.get("/departments/flat").then((res) => res.data);

export const fetchDepartmentTree = () =>
  http.get("/departments/tree").then((res) => res.data);

export const createDepartment = (payload) => http.post("/departments", payload);

export const updateDepartment = (id, payload) =>
  http.put(`/departments/${id}`, payload);

export const moveDepartment = (id, parentId) =>
  http.put(`/departments/${id}/move`, { parentId });

export const deleteDepartment = (id) => http.delete(`/departments/${id}`);
