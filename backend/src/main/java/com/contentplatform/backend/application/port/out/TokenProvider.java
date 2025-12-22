package com.contentplatform.backend.application.port.out;

import com.contentplatform.backend.domain.model.AdminUser;

public interface TokenProvider {
    String generate(AdminUser adminUser);
}
