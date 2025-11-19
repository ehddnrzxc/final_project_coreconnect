package com.goodee.coreconnect.account.util;

import jakarta.servlet.http.HttpServletRequest;

/**
 * IP 주소 추출 유틸리티
 */
public class IpAddressUtil {
    
    /**
     * HTTP 요청에서 클라이언트의 실제 IP 주소를 추출
     * 프록시나 로드밸런서를 통한 요청도 고려
     * 
     * @param request HTTP 요청
     * @return IP 주소 (추출 실패 시 "unknown")
     */
    public static String getClientIpAddress(HttpServletRequest request) {
        if (request == null) {
            return "unknown";
        }
        
        // 1. X-Forwarded-For 헤더 확인 (프록시/로드밸런서를 통한 경우)
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty() && !"unknown".equalsIgnoreCase(xForwardedFor)) {
            // 여러 IP가 있을 경우 첫 번째 IP 사용
            String[] ips = xForwardedFor.split(",");
            return ips[0].trim();
        }
        
        // 2. X-Real-IP 헤더 확인
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty() && !"unknown".equalsIgnoreCase(xRealIp)) {
            return xRealIp.trim();
        }
        
        // 3. Proxy-Client-IP 헤더 확인
        String proxyClientIp = request.getHeader("Proxy-Client-IP");
        if (proxyClientIp != null && !proxyClientIp.isEmpty() && !"unknown".equalsIgnoreCase(proxyClientIp)) {
            return proxyClientIp.trim();
        }
        
        // 4. WL-Proxy-Client-IP 헤더 확인 (WebLogic)
        String wlProxyClientIp = request.getHeader("WL-Proxy-Client-IP");
        if (wlProxyClientIp != null && !wlProxyClientIp.isEmpty() && !"unknown".equalsIgnoreCase(wlProxyClientIp)) {
            return wlProxyClientIp.trim();
        }
        
        // 5. HTTP_CLIENT_IP 헤더 확인
        String httpClientIp = request.getHeader("HTTP_CLIENT_IP");
        if (httpClientIp != null && !httpClientIp.isEmpty() && !"unknown".equalsIgnoreCase(httpClientIp)) {
            return httpClientIp.trim();
        }
        
        // 6. HTTP_X_FORWARDED_FOR 헤더 확인
        String httpXForwardedFor = request.getHeader("HTTP_X_FORWARDED_FOR");
        if (httpXForwardedFor != null && !httpXForwardedFor.isEmpty() && !"unknown".equalsIgnoreCase(httpXForwardedFor)) {
            String[] ips = httpXForwardedFor.split(",");
            return ips[0].trim();
        }
        
        // 7. 직접 연결인 경우 RemoteAddr 사용
        String remoteAddr = request.getRemoteAddr();
        if (remoteAddr != null && !remoteAddr.isEmpty()) {
            return remoteAddr;
        }
        
        return "unknown";
    }
}

