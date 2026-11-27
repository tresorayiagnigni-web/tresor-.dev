
import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateBandRecordDto } from './create-band-record.dto.js';

export class UpdateBandRecordDto extends PartialType(
  OmitType(CreateBandRecordDto, ['bandId'] as const),
) {}
