package com.goodee.coreconnect.chat.dto.request;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class InviteUsersRequestDTO {
    // 초대할 사용자 ID 목록
    private List<Integer> userIds;
}
