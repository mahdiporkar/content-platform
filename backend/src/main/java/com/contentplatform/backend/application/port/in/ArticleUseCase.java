package com.contentplatform.backend.application.port.in;

import com.contentplatform.backend.application.dto.ArticleDto;
import com.contentplatform.backend.application.dto.ChangeStatusCommand;
import com.contentplatform.backend.application.dto.CreateArticleCommand;
import com.contentplatform.backend.application.dto.PageRequest;
import com.contentplatform.backend.application.dto.PageResult;
import com.contentplatform.backend.application.dto.UpdateArticleCommand;
import com.contentplatform.backend.domain.value.ContentStatus;

import java.util.List;

public interface ArticleUseCase {
    ArticleDto create(CreateArticleCommand command, List<String> allowedApplicationIds);
    ArticleDto update(UpdateArticleCommand command, List<String> allowedApplicationIds);
    ArticleDto changeStatus(ChangeStatusCommand command, List<String> allowedApplicationIds);
    ArticleDto getBySlug(String applicationId, String slug);
    PageResult<ArticleDto> list(String applicationId, ContentStatus status, PageRequest pageRequest);
}
