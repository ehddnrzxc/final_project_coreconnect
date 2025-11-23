package com.goodee.coreconnect.account.util;

import jakarta.servlet.http.HttpServletRequest;
import java.util.ArrayList;
import java.util.List;

/**
 * IP 주소 추출 유틸리티
 */
public class IpAddressUtil {
    
    /**
     * IP 주소 쌍을 저장하는 클래스
     */
    public static class IpAddressPair {
        private final String ipv4;
        private final String ipv6;
        
        public IpAddressPair(String ipv4, String ipv6) {
            this.ipv4 = ipv4 != null ? ipv4 : "-";
            this.ipv6 = ipv6 != null ? ipv6 : "-";
        }
        
        public String getIpv4() {
            return ipv4;
        }
        
        public String getIpv6() {
            return ipv6;
        }
    }
    
    /**
     * IP 주소가 IPv4인지 확인
     */
    private static boolean isIPv4(String ip) {
        if (ip == null || ip.isEmpty()) {
            return false;
        }
        // IPv4는 점(.)으로 구분된 4개의 숫자
        return ip.contains(".") && !ip.contains(":");
    }
    
    /**
     * IP 주소가 IPv6인지 확인
     */
    private static boolean isIPv6(String ip) {
        if (ip == null || ip.isEmpty()) {
            return false;
        }
        // IPv6는 콜론(:)을 포함
        return ip.contains(":");
    }
    
    /**
     * IPv6 localhost를 IPv4 localhost로 변환
     */
    private static String normalizeLocalhost(String ip) {
        if (ip == null || ip.isEmpty()) {
            return ip;
        }
        
        // IPv6 localhost 변형들
        if (ip.equals("::1") || 
            ip.equals("0:0:0:0:0:0:0:1") ||
            ip.equals("[::1]") ||
            ip.equals("[0:0:0:0:0:0:0:1]")) {
            return "127.0.0.1";
        }
        
        return ip;
    }
    
    /**
     * IP 주소 리스트에서 IPv4와 IPv6를 분리
     */
    private static IpAddressPair extractIpPair(List<String> ipList) {
        String ipv4 = null;
        String ipv6 = null;
        
        for (String ip : ipList) {
            if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
                continue;
            }
            
            String trimmedIp = ip.trim();
            
            if (isIPv4(trimmedIp) && ipv4 == null) {
                ipv4 = trimmedIp;
            } else if (isIPv6(trimmedIp) && ipv6 == null) {
                ipv6 = trimmedIp;
                
                // IPv6 localhost인 경우 IPv4 localhost로도 매핑
                String normalized = normalizeLocalhost(trimmedIp);
                if (!normalized.equals(trimmedIp) && ipv4 == null) {
                    ipv4 = normalized;
                }
            }
            
            // 둘 다 찾았으면 중단
            if (ipv4 != null && ipv6 != null) {
                break;
            }
        }
        
        return new IpAddressPair(ipv4, ipv6);
    }
    
    /**
     * HTTP 요청에서 모든 IP 주소를 수집
     */
    private static List<String> collectAllIpAddresses(HttpServletRequest request) {
        List<String> ipList = new ArrayList<>();
        
        // 1. X-Forwarded-For 헤더 확인 (프록시/로드밸런서를 통한 경우)
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty() && !"unknown".equalsIgnoreCase(xForwardedFor)) {
            String[] ips = xForwardedFor.split(",");
            for (String ip : ips) {
                ipList.add(ip.trim());
            }
        }
        
        // 2. X-Real-IP 헤더 확인
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty() && !"unknown".equalsIgnoreCase(xRealIp)) {
            ipList.add(xRealIp.trim());
        }
        
        // 3. Proxy-Client-IP 헤더 확인
        String proxyClientIp = request.getHeader("Proxy-Client-IP");
        if (proxyClientIp != null && !proxyClientIp.isEmpty() && !"unknown".equalsIgnoreCase(proxyClientIp)) {
            ipList.add(proxyClientIp.trim());
        }
        
        // 4. WL-Proxy-Client-IP 헤더 확인 (WebLogic)
        String wlProxyClientIp = request.getHeader("WL-Proxy-Client-IP");
        if (wlProxyClientIp != null && !wlProxyClientIp.isEmpty() && !"unknown".equalsIgnoreCase(wlProxyClientIp)) {
            ipList.add(wlProxyClientIp.trim());
        }
        
        // 5. HTTP_CLIENT_IP 헤더 확인
        String httpClientIp = request.getHeader("HTTP_CLIENT_IP");
        if (httpClientIp != null && !httpClientIp.isEmpty() && !"unknown".equalsIgnoreCase(httpClientIp)) {
            ipList.add(httpClientIp.trim());
        }
        
        // 6. HTTP_X_FORWARDED_FOR 헤더 확인
        String httpXForwardedFor = request.getHeader("HTTP_X_FORWARDED_FOR");
        if (httpXForwardedFor != null && !httpXForwardedFor.isEmpty() && !"unknown".equalsIgnoreCase(httpXForwardedFor)) {
            String[] ips = httpXForwardedFor.split(",");
            for (String ip : ips) {
                ipList.add(ip.trim());
            }
        }
        
        // 7. 직접 연결인 경우 RemoteAddr 사용
        String remoteAddr = request.getRemoteAddr();
        if (remoteAddr != null && !remoteAddr.isEmpty()) {
            ipList.add(remoteAddr);
        }
        
        return ipList;
    }
    
    /**
     * HTTP 요청에서 클라이언트의 실제 IP 주소를 추출 (하위 호환성)
     * 프록시나 로드밸런서를 통한 요청도 고려
     * 
     * @param request HTTP 요청
     * @return IP 주소 (추출 실패 시 "unknown")
     */
    public static String getClientIpAddress(HttpServletRequest request) {
        if (request == null) {
            return "unknown";
        }
        
        List<String> ipList = collectAllIpAddresses(request);
        if (ipList.isEmpty()) {
            return "unknown";
        }
        
        // 첫 번째 IP 반환 (기존 동작 유지)
        return ipList.get(0);
    }
    
    /**
     * HTTP 요청에서 IPv4와 IPv6를 분리해서 추출
     * 
     * @param request HTTP 요청
     * @return IPv4와 IPv6를 포함한 IpAddressPair
     */
    public static IpAddressPair getClientIpAddressPair(HttpServletRequest request) {
        if (request == null) {
            return new IpAddressPair(null, null);
        }
        
        List<String> ipList = collectAllIpAddresses(request);
        if (ipList.isEmpty()) {
            return new IpAddressPair(null, null);
        }
        
        return extractIpPair(ipList);
    }
}

