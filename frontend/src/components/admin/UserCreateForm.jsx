import React, { useEffect, useState } from "react";
import http from "../../api/http"; // 공용 axios 인스턴스
import "./userCreateForm.css";

/** 로컬스토리지에서 액세스 토큰 꺼내는 헬퍼 (혹은 http.js에서 자동 주입 가능) */
function getAccessToken() {
  try {
    return localStorage.getItem("accessToken");
  } catch {
    return null;
  }
}

export default function UserCreateForm() {
  const [form, setForm] = useState({
    email: "",
    name: "",
    tempPassword: "",
    phone: "",
    deptId: "",
    role: "USER",
  });

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  /** 부서 목록 로드 */
  useEffect(() => {
    http
      .get("/departments")
      .then(({ data }) => setDepartments(data))
      .catch(() =>
        setMsg({
          type: "info",
          text: "부서 목록을 불러오지 못했습니다. (부서 없이 생성 가능)",
        })
      );
  }, []);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    if (!form.email || !form.name || !form.tempPassword) {
      setMsg({ type: "error", text: "이메일/이름/임시비밀번호는 필수입니다." });
      return;
    }

    const token = getAccessToken();
    if (!token) {
      setMsg({ type: "error", text: "로그인이 필요합니다. (토큰 없음)" });
      return;
    }

    const payload = {
      email: form.email.trim(),
      name: form.name.trim(),
      tempPassword: form.tempPassword,
      phone: form.phone.trim() || undefined,
      role: form.role,
      ...(form.deptId ? { deptId: Number(form.deptId) } : {}),
    };

    setLoading(true);
    try {
      const { data } = await http.post("/admin/users", payload);
      setMsg({ type: "success", text: `생성 완료: ${data.name} (${data.email})` });
      setForm({
        email: "",
        name: "",
        tempPassword: "",
        phone: "",
        deptId: "",
        role: "USER",
      });
    } catch (e) {
      if (e.response) {
        const { status, data } = e.response;
        if (status === 401) {
          setMsg({
            type: "error",
            text: "인증이 만료되었거나 토큰이 유효하지 않습니다. 다시 로그인하세요.",
          });
        } else {
          setMsg({
            type: "error",
            text: `유저 생성 실패: ${data?.message || "서버 오류"}`,
          });
        }
      } else {
        setMsg({
          type: "error",
          text: "네트워크 오류로 요청에 실패했습니다.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-form__wrapper">
      <h2 className="user-form__title">사용자 생성 (관리자 전용)</h2>

      {msg.text && (
        <div className={`msg msg--${msg.type}`}>{msg.text}</div>
      )}

      <form onSubmit={submit} className="user-form">
        <label>
          이메일 *
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
            required
            placeholder="이메일을 입력하세요."
          />
        </label>

        <label>
          이름 *
          <input
            name="name"
            value={form.name}
            onChange={onChange}
            required
            placeholder="이름을 입력하세요."
          />
        </label>

        <label>
          임시 비밀번호 *
          <input
            name="tempPassword"
            value={form.tempPassword}
            onChange={onChange}
            required
            placeholder="비밀번호를 입력하세요."
          />
        </label>

        <label>
          전화번호
          <input
            name="phone"
            value={form.phone}
            onChange={onChange}
            placeholder="전화번호를 입력하세요."
          />
        </label>

        <label>
          부서
          <select name="deptId" value={form.deptId} onChange={onChange}>
            <option value="">(선택 안 함)</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          권한(Role) *
          <select name="role" value={form.role} onChange={onChange} required>
            <option value="USER">USER</option>
            <option value="MANAGER">MANAGER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </label>

        <button type="submit" disabled={loading}>
          {loading ? "생성 중..." : "유저 생성"}
        </button>
      </form>
    </div>
  );
}
