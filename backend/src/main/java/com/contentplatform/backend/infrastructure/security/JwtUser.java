package com.contentplatform.backend.infrastructure.security;

import com.contentplatform.backend.domain.value.ServicePermission;
import com.contentplatform.backend.domain.value.SystemPermission;

import java.util.List;

public record JwtUser(
    String subject,
    String email,
    List<String> applicationIds,
    List<SystemPermission> systemPermissions,
    List<ServicePermission> servicePermissions
) {
}
