import React, { useEffect, useState } from "react";

/** 로컬스토리지에서 액세스 토큰 꺼내는 헬퍼 (프로젝트에 맞게 수정 가능) */
function getAccessToken() {
  try {
    // 예: 로그인 시 localStorage.setItem("accessToken", token)
    return localStorage.getItem("accessToken");
    // 또는 저장 구조가 { accessToken, user } 라면 JSON.parse로 꺼내세요.
    // const data = JSON.parse(localStorage.getItem("auth"));
    // return data?.accessToken;
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
    deptId: "",               // 선택 안 하면 빈 문자열 → 서버 전송 시 제외
    role: "USER",             // 기본값
  });

  const [departments, setDepartments] = useState([]);  // [{id, name}]
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" }); // type: success|error|info

  // 부서 목록 불러오기 (드롭다운)
  useEffect(() => {
    const token = getAccessToken();
    // 부서 조회는 인증 필요 없다면 Authorization 제거해도 됨
    fetch("/api/v1/departments", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => {
        if (!r.ok) throw new Error(`부서 조회 실패: ${r.status}`);
        return r.json();
      })
      .then((data) => {
        // 컨트롤러에서 {id,name,parentId} 리스트를 반환한다고 가정
        setDepartments(data);
      })
      .catch((e) => {
        console.error(e);
        setMsg({ type: "info", text: "부서 목록을 불러오지 못했습니다. (부서 없이 생성 가능)" });
      });
  }, []);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    // 간단한 전처리/검증
    if (!form.email || !form.name || !form.tempPassword) {
      setMsg({ type: "error", text: "이메일/이름/임시비밀번호는 필수입니다." });
      return;
    }

    const token = getAccessToken();
    if (!token) {
      setMsg({ type: "error", text: "로그인이 필요합니다. (토큰 없음)" });
      return;
    }

    // deptId가 선택 안 됐으면 요청에서 제외
    const payload = {
      email: form.email.trim(),
      name: form.name.trim(),
      tempPassword: form.tempPassword,
      phone: form.phone.trim() || undefined,
      role: form.role,
      ...(form.deptId ? { deptId: Number(form.deptId) } : {}), // 선택 시만 포함
    };

    setLoading(true);
    try {
      const res = await fetch("/api/v1/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        setMsg({ type: "error", text: "인증이 만료되었거나 토큰이 유효하지 않습니다. 다시 로그인하세요." });
        return;
      }
      if (!res.ok) {
        // 서버가 {"code":"...","message":"..."} 형태로 주는 경우 처리
        let detail = "";
        try {
          const err = await res.json();
          detail = err?.message || JSON.stringify(err);
        } catch {
          detail = res.statusText;
        }
        setMsg({ type: "error", text: `유저 생성 실패: ${detail}` });
        return;
      }

      const data = await res.json(); // UserDto 반환 가정
      setMsg({ type: "success", text: `생성 완료: ${data.name} (${data.email})` });

      // 폼 리셋
      setForm({
        email: "",
        name: "",
        tempPassword: "",
        phone: "",
        deptId: "",
        role: "USER",
      });
    } catch (e) {
      console.error(e);
      setMsg({ type: "error", text: "네트워크 오류로 요청에 실패했습니다." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 520, margin: "24px auto", padding: 16, border: "1px solid #eee", borderRadius: 12 }}>
      <h2 style={{ marginBottom: 16 }}>사용자 생성 (관리자 전용)</h2>

      {msg.text && (
        <div
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            marginBottom: 12,
            background: msg.type === "success" ? "#ecfdf5" : msg.type === "error" ? "#fef2f2" : "#eef2ff",
            color: msg.type === "success" ? "#065f46" : msg.type === "error" ? "#991b1b" : "#3730a3",
            border: "1px solid rgba(0,0,0,0.08)",
          }}
        >
          {msg.text}
        </div>
      )}

      <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
        <label>
          이메일 *
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
            required
            placeholder="alice@corp.com"
            style={{ width: "100%", padding: 8 }}
          />
        </label>

        <label>
          이름 *
          <input
            name="name"
            value={form.name}
            onChange={onChange}
            required
            placeholder="이름"
            style={{ width: "100%", padding: 8 }}
          />
        </label>

        <label>
          임시 비밀번호 *
          <input
            name="tempPassword"
            value={form.tempPassword}
            onChange={onChange}
            required
            placeholder="Init!234"
            style={{ width: "100%", padding: 8 }}
          />
        </label>

        <label>
          전화번호
          <input
            name="phone"
            value={form.phone}
            onChange={onChange}
            placeholder="010-1234-5678"
            style={{ width: "100%", padding: 8 }}
          />
        </label>

        <label>
          부서
          <select name="deptId" value={form.deptId} onChange={onChange} style={{ width: "100%", padding: 8 }}>
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
          <select name="role" value={form.role} onChange={onChange} required style={{ width: "100%", padding: 8 }}>
            <option value="USER">USER</option>
            <option value="MANAGER">MANAGER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </label>

        <button type="submit" disabled={loading} style={{ padding: "10px 14px", borderRadius: 8 }}>
          {loading ? "생성 중..." : "유저 생성"}
        </button>
      </form>
    </div>
  );
}
