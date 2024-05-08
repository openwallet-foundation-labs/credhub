import { ApiProperty } from '@nestjs/swagger';
import { History } from '../entities/history.entity';

class Disclosed {
  key: string;
  value: string;
}

export class HistoryResponse extends History {
  /**
   * The values that were presented
   */
  @ApiProperty({ type: [Disclosed] })
  disclosed: Disclosed[];
}
