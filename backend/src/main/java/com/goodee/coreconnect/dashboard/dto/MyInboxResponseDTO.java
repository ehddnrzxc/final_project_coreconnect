package com.goodee.coreconnect.dashboard.dto;

import java.util.List;

import com.goodee.coreconnect.approval.dto.response.DocumentSimpleResponseDTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter 
@Setter 
@NoArgsConstructor 
@AllArgsConstructor 
@Builder
public class MyInboxResponseDTO {

    // 합의
    private List<DocumentSimpleResponseDTO> consents;
    private long consentsTotal; 

    // 참조 or 열람
    private List<DocumentSimpleResponseDTO> references;
    private long referencesTotal; 
}
