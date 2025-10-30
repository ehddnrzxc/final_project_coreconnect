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

    @OneToMany(mappedBy = "department", cascade = CascadeType.ALL, orphanRemoval = false)
    private List<User> users = new ArrayList<>();
    
    /** 계층 구조(자기참조 관계) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Department parent; 

    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL)
    private List<Department> children = new ArrayList<>();



    // 정적 팩토리 메서드
    public static Department createDepartment(String deptName, Integer deptOrderNo) {
        Department dept = new Department();
        dept.deptName = deptName;
        dept.deptOrderNo = deptOrderNo;
        return dept;
    }



    //----- 도메인 메서드 -----
    
    public void changeName(String newName) {
        this.deptName = newName;
    }

    public void changeOrder(int newOrder) {
        this.deptOrderNo = newOrder;
    }
    
    public void changeParent(Department newParent) {
      this.parent = newParent;
    }
}
