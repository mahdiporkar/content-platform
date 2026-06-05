package com.contentplatform.backend.application.port.in;

import com.contentplatform.backend.application.dto.ApplicationDto;
import com.contentplatform.backend.application.dto.CreateApplicationCommand;
import com.contentplatform.backend.application.dto.GalleryImageDto;
import com.contentplatform.backend.application.dto.UpdateApplicationCommand;
import com.contentplatform.backend.application.dto.PageRequest;
import com.contentplatform.backend.application.dto.PageResult;

import java.util.List;

public interface ApplicationUseCase {
    List<ApplicationDto> list();
    ApplicationDto getById(String id);
    ApplicationDto create(CreateApplicationCommand command);
    ApplicationDto update(UpdateApplicationCommand command);
    ApplicationDto rotateToken(String id);
    ApplicationDto revokeToken(String id);
    void delete(String id);
    PageResult<GalleryImageDto> listGallery(String applicationId, PageRequest pageRequest);
    GalleryImageDto getGalleryItem(String applicationId, int index);
}
