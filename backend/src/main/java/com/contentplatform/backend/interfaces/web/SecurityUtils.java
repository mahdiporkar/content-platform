package com.contentplatform.backend.interfaces.web;

import com.contentplatform.backend.application.exception.ForbiddenException;
import com.contentplatform.backend.domain.value.ServicePermission;
import com.contentplatform.backend.domain.value.SystemPermission;
import com.contentplatform.backend.infrastructure.security.JwtAuthenticationToken;
import com.contentplatform.backend.infrastructure.security.JwtUser;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Collections;
import java.util.List;
import java.util.Set;

public final class SecurityUtils {
    private SecurityUtils() {
    }

    public static List<String> getAllowedApplicationIds() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication instanceof JwtAuthenticationToken jwtAuth) {
            JwtUser user = (JwtUser) jwtAuth.getPrincipal();
            return user.applicationIds();
        }
        return Collections.emptyList();
    }

    public static List<SystemPermission> getSystemPermissions() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication instanceof JwtAuthenticationToken jwtAuth) {
            JwtUser user = (JwtUser) jwtAuth.getPrincipal();
            return user.systemPermissions();
        }
        return Collections.emptyList();
    }

    public static List<ServicePermission> getServicePermissions() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication instanceof JwtAuthenticationToken jwtAuth) {
            JwtUser user = (JwtUser) jwtAuth.getPrincipal();
            return user.servicePermissions();
        }
        return Collections.emptyList();
    }

    public static void requireSystemPermission(SystemPermission permission) {
        List<SystemPermission> permissions = getSystemPermissions();
        if (!permissions.isEmpty() && !permissions.contains(permission)) {
            throw new ForbiddenException("System permission denied: " + permission.name());
        }
    }

    public static boolean hasSystemPermission(SystemPermission permission) {
        List<SystemPermission> permissions = getSystemPermissions();
        if (permissions.isEmpty()) {
            return true;
        }
        return permissions.contains(permission);
    }

    public static void requireServicePermission(ServicePermission permission) {
        List<ServicePermission> permissions = getServicePermissions();
        if (!permissions.isEmpty() && !permissions.contains(permission)) {
            throw new ForbiddenException("Service permission denied: " + permission.name());
        }
    }

    public static void requireApplicationAccess(String applicationId) {
        if (hasSystemPermission(SystemPermission.APPLICATIONS_MANAGE)) {
            return;
        }
        List<String> allowedApplicationIds = getAllowedApplicationIds();
        if (!allowedApplicationIds.isEmpty() && !allowedApplicationIds.contains(applicationId)) {
            throw new ForbiddenException("Application access denied");
        }
    }

    public static List<String> resolveAllowedApplicationIdsFor(String applicationId) {
        if (hasSystemPermission(SystemPermission.APPLICATIONS_MANAGE)) {
            return List.of(applicationId);
        }
        return getAllowedApplicationIds();
    }

    public static List<String> filterAccessibleApplicationIds(List<String> applicationIds) {
        List<String> allowedApplicationIds = getAllowedApplicationIds();
        if (allowedApplicationIds.isEmpty()) {
            return applicationIds;
        }
        Set<String> allowedSet = Set.copyOf(allowedApplicationIds);
        return applicationIds.stream()
            .filter(allowedSet::contains)
            .toList();
    }
}
