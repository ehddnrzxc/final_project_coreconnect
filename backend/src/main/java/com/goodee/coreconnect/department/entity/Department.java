package com.goodee.coreconnect.department.entity;

import java.util.ArrayList;
import java.util.List;

import com.goodee.coreconnect.user.entity.User;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "department")
public class Department {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "dept_id")
    private Integer id;

    @Column(name = "dept_name", length = 50, nullable = false)
    private String deptName;

    @Column(name = "dept_order_no", nullable = false)
    private Integer deptOrderNo;

    /**
     * ✅ 양방향 연관관계 (User 엔티티는 이미 ManyToOne으로 연결되어 있음)
     * mappedBy = "department" → User 엔티티의 필드명과 동일해야 함
     */
    @OneToMany(mappedBy = "department", cascade = CascadeType.ALL, orphanRemoval = false)
    private List<User> users = new ArrayList<>();


    // ───────────────────────────────
    // ✅ 정적 팩토리 메서드
    // ───────────────────────────────
    public static Department createDepartment(String deptName, Integer deptOrderNo) {
        Department dept = new Department();
        dept.deptName = deptName;
        dept.deptOrderNo = deptOrderNo;
        return dept;
    }


    // ───────────────────────────────
    // ✅ 도메인 행위
    // ───────────────────────────────
    public void changeName(String newName) {
        this.deptName = newName;
    }

    public void changeOrder(int newOrder) {
        this.deptOrderNo = newOrder;
    }
}
