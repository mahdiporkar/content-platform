package com.contentplatform.backend.application.port.in;

import com.contentplatform.backend.application.dto.ChangeStatusCommand;
import com.contentplatform.backend.application.dto.CreatePostCommand;
import com.contentplatform.backend.application.dto.PageRequest;
import com.contentplatform.backend.application.dto.PageResult;
import com.contentplatform.backend.application.dto.PostDto;
import com.contentplatform.backend.application.dto.UpdatePostCommand;
import com.contentplatform.backend.domain.value.ContentStatus;

import java.util.List;

public interface PostUseCase {
    PostDto create(CreatePostCommand command, List<String> allowedApplicationIds);
    PostDto update(UpdatePostCommand command, List<String> allowedApplicationIds);
    PostDto changeStatus(ChangeStatusCommand command, List<String> allowedApplicationIds);
    PostDto getBySlug(String applicationId, String slug);
    PageResult<PostDto> list(String applicationId, ContentStatus status, PageRequest pageRequest);
}
