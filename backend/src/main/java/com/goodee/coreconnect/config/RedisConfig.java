//package com.goodee.coreconnect.config;
//
//import org.springframework.beans.factory.annotation.Value;
//import org.springframework.context.annotation.Bean;
//import org.springframework.context.annotation.Configuration;
//import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
//import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
//import org.springframework.data.redis.core.StringRedisTemplate;
//import org.springframework.data.redis.listener.PatternTopic;
//import org.springframework.data.redis.listener.RedisMessageListenerContainer;
//
//@Configuration
//public class RedisConfig {
//
//    @Value("${spring.redis.host:127.0.0.1}")
//    private String redisHost;
//
//    @Value("${spring.redis.port:6379}")
//    private int redisPort;
//
//    @Value("${spring.redis.password:}")
//    private String redisPassword;
//
//    @Bean
//    public LettuceConnectionFactory redisConnectionFactory() {
//        RedisStandaloneConfiguration cfg = new RedisStandaloneConfiguration(redisHost, redisPort);
//        if (redisPassword != null && !redisPassword.isEmpty()) {
//            cfg.setPassword(redisPassword);
//        }
//        return new LettuceConnectionFactory(cfg);
//    }
//
//    @Bean
//    public StringRedisTemplate redisTemplate(LettuceConnectionFactory cf) {
//        return new StringRedisTemplate(cf);
//    }
//
//    @Bean
//    public RedisMessageListenerContainer redisListenerContainer(LettuceConnectionFactory cf) {
//        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
//        container.setConnectionFactory(cf);
//        return container;
//    }
//}