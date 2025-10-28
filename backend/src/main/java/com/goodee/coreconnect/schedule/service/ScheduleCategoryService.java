package com.goodee.coreconnect.schedule.service;

import java.util.List;

import com.goodee.coreconnect.schedule.dto.request.RequestScheduleCategoryDTO;
import com.goodee.coreconnect.schedule.dto.response.ResponseScheduleCategoryDTO;

public interface ScheduleCategoryService {

  ResponseScheduleCategoryDTO createCategory(RequestScheduleCategoryDTO dto);

  ResponseScheduleCategoryDTO updateCategory(Integer id, RequestScheduleCategoryDTO dto);

  void deleteCategory(Integer id);

  List<ResponseScheduleCategoryDTO> getUserCategories(Integer userId);
  
}
