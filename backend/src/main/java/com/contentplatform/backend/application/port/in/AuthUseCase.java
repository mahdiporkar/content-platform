package com.contentplatform.backend.application.port.in;

import com.contentplatform.backend.application.dto.AuthTokenDto;
import com.contentplatform.backend.application.dto.LoginCommand;

public interface AuthUseCase {
    AuthTokenDto login(LoginCommand command);
}
