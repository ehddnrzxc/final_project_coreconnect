package com.goodee.coreconnect.department.dto.response;

/** 유저 입력 폼에서 쓰는 부서 선택 평탄화 응답용 DTO */
public record DepartmentFlatDTO(
    Integer id,
    String name,
    Integer parentId,
    Integer orderNo,
    Integer userCount
) {
    public static DepartmentFlatDTO createDepartmentFlatDTO(Integer id, String name, Integer parentId, Integer orderNo, Integer userCount) {
        return new DepartmentFlatDTO(id, name, parentId, orderNo, userCount);
    }
}