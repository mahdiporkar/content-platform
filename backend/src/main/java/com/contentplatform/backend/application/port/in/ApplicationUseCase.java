package com.contentplatform.backend.application.port.in;

import com.contentplatform.backend.application.dto.ApplicationDto;
import com.contentplatform.backend.application.dto.CreateApplicationCommand;
import com.contentplatform.backend.application.dto.UpdateApplicationCommand;

import java.util.List;

public interface ApplicationUseCase {
    List<ApplicationDto> list();
    ApplicationDto getById(String id);
    ApplicationDto create(CreateApplicationCommand command);
    ApplicationDto update(UpdateApplicationCommand command);
    void delete(String id);
}
