import React, { useEffect, useState } from "react";
import { getAdminUsers } from "../../user/api/userAPI";

function UserListPage() {
  const [users, setUsers] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await getAdminUsers();
        setUsers(data);
      } catch (e) {
        console.error(e);
        setErr("사용자 목록을 불러오지 못했습니다.");
      }
    })();
  }, []);

  if (err) return <div>{err}</div>;

  return (
    <section>
      <h2>사용자 목록</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th><th>이름</th><th>이메일</th><th>역할</th><th>상태</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>{u.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default UserListPage;