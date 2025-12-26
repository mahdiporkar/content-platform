import { Injectable, NotImplementedException } from '@nestjs/common';
import { ChangeStatusRequestDto } from '../dto/requests/change-status-request.dto';
import { ContentStatus } from '../common/content-status.enum';
import { VideoResponseDto } from '../dto/responses/video-response.dto';
import { PageResponseDto } from '../dto/page-response.dto';

@Injectable()
export class AdminVideoService {
  upload(
    _file: Express.Multer.File,
    _title: string,
    _description: string | undefined,
    _applicationId: string,
    _status: ContentStatus,
  ): VideoResponseDto {
    throw new NotImplementedException('Video upload not implemented yet.');
  }

  changeStatus(_id: string, _request: ChangeStatusRequestDto): VideoResponseDto {
    throw new NotImplementedException('Video status change not implemented yet.');
  }

  list(_applicationId: string, _status: ContentStatus | undefined, _page: number, _size: number): PageResponseDto<VideoResponseDto> {
    throw new NotImplementedException('Video listing not implemented yet.');
  }
}