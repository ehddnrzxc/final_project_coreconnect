package com.goodee.coreconnect.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.templateresolver.StringTemplateResolver;

@Configuration
public class ThymeleafConfig {
  
  @Bean
  public StringTemplateResolver stringTemplateResolver() {
    StringTemplateResolver stringTemplateResolver = new StringTemplateResolver();
    stringTemplateResolver.setTemplateMode("HTML");
    stringTemplateResolver.setCacheable(false);
    stringTemplateResolver.setOrder(1);
    return stringTemplateResolver;
  }
  
}
