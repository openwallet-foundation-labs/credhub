import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Not, Repository } from 'typeorm';
import { StatusList } from './entities/status-list.entity';
import { CreateListDto } from './dto/create-list.dto';
import {
  StatusList as List,
  StatusListEntry,
  StatusListJWTHeaderParameters,
  createHeaderAndPayload,
} from '@sd-jwt/jwt-status-list';
import { JwtPayload } from '@sd-jwt/types';
import { ConfigService } from '@nestjs/config';
import { KeyService } from '@my-wallet/relying-party-shared';
import { v4 } from 'uuid';

@Injectable()
export class StatusService {
  constructor(
    @InjectRepository(StatusList)
    private statusRepository: Repository<StatusList>,
    private configService: ConfigService,
    @Inject('KeyService') private keyService: KeyService,
    private dataSource: DataSource
  ) {
    // this.statusRepository.delete({});
  }

  private generateShuffledArray(n: number): number[] {
    const array = Array.from({ length: n }, (_, index) => index);

    // Mischen des Arrays mit dem Fisher-Yates Shuffle
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  /**
   * Creates a new status list. The list is filled with zeros and the positions are shuffled. It will also store the JWT representation of the list to improve performance.
   * @param createListDto
   * @returns
   */
  async create(createListDto: CreateListDto) {
    const listElements: number[] = new Array(createListDto.size).fill(0);
    const positions = this.generateShuffledArray(createListDto.size);
    const entry = this.statusRepository.create({
      id: v4(),
      list: this.encodeList(listElements),
      bitsPerStatus: createListDto.bitsPerStatus,
      positions: JSON.stringify(positions),
    });
    entry.jwt = await this.packList(entry);
    return this.statusRepository.save(entry);
  }

  async getOne(id: string) {
    const list = await this.statusRepository.findOneBy({ id });
    if (!list) {
      throw new NotFoundException();
    }
    return list.jwt;
  }

  /**
   * Returns the first empty slot in the status list. If there is none, a new list is created.
   * @returns
   */
  async getEmptySlot(): Promise<StatusListEntry> {
    // find a list that has open position. If there is none, create a new one.
    const list = await this.statusRepository
      .findOneByOrFail({ positions: Not(IsNull()) })
      .catch(() => this.create({ size: 100, bitsPerStatus: 1 }));
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const positionList = JSON.parse(list.positions) as number[];
      const position = positionList.shift();
      list.positions = JSON.stringify(positionList);

      await queryRunner.manager.save(list);

      await queryRunner.commitTransaction();

      return {
        uri: `${this.configService.get('ISSUER_BASE_URL')}/status/${list.id}`,
        idx: position,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private encodeList(list: number[]): Buffer {
    return Buffer.from(list.map((e) => e.toString(2)).join(''), 'binary');
  }

  private decodeList(list: Buffer): number[] {
    return list
      .toString('binary')
      .split('')
      .map((e) => parseInt(e, 2));
  }

  getStatus(id: string, index: string) {
    return this.statusRepository.findOneBy({ id }).then((list) => {
      if (!list) {
        throw new NotFoundException();
      }
      const decodedList = this.decodeList(list.list);
      const statusList = new List(decodedList, list.bitsPerStatus);
      return statusList.getStatus(parseInt(index));
    });
  }

  /**
   * Set the status of a given index in the status list. Also updates the JWT so the change is reflected in the JWT asap. When using TTL, this should not be done but needs to be done by a cronjob. Same for expired lists.
   * @param statusListId
   * @param index
   * @param status
   */
  async setStatus(statusListId: string, index: number, status: number) {
    const list = await this.statusRepository.findOneBy({ id: statusListId });
    if (!list) {
      throw new NotFoundException();
    }
    const decodedList = this.decodeList(list.list);
    const statusList = new List(decodedList, list.bitsPerStatus);
    statusList.setStatus(index, status);
    list.list = this.encodeList(statusList.getStatusList());
    //when dealing with TTL, we should not update the jwt here
    list.jwt = await this.packList(list);
    await this.statusRepository.save(list);
  }

  /**
   * Pack the status list into a JWT.
   * @param statusList
   */
  private async packList(list: StatusList) {
    const lifetime = 60 * 60 * 24;
    const iss = this.configService.get('ISSUER_BASE_URL');
    const decodedList = this.decodeList(list.list);
    const statusList = new List(decodedList, list.bitsPerStatus);
    const payload: JwtPayload = {
      iss,
      sub: `${iss}/status/${list.id}`,
      iat: new Date().getTime() / 1000,
      exp: new Date().getTime() / 1000 + lifetime,
      // ttl: lifetime,
    };
    const header: StatusListJWTHeaderParameters = {
      alg: 'ES256',
      typ: 'statuslist+jwt',
      kid: await this.keyService.getKid(),
    };
    const values = createHeaderAndPayload(statusList, payload, header);
    return await this.keyService.signJWT(values.payload, values.header);
  }

  /**
   * Deletes a status list.
   * @param id
   * @returns
   */
  deleteList(id: string) {
    return this.statusRepository.delete({ id });
  }
}
