import http from "../../../api/http";


export async function fetchOrganizationTree() {
  const res = await http.get("/organ"); 
  return res.data.data;
}
