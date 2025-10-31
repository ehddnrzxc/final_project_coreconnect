package com.goodee.coreconnect.department.service;

import java.util.List;
import com.goodee.coreconnect.department.dto.response.OrganizationTreeDTO;

public interface OrganizationService {
    /** 전체 조직 트리 조회 */
    List<OrganizationTreeDTO> getOrganizationTree();
}
