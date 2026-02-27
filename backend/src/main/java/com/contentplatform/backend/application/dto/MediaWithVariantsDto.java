package com.contentplatform.backend.application.dto;

import java.util.List;

public record MediaWithVariantsDto(
    MediaAssetDto media,
    List<MediaVariantDto> variants
) {
}
