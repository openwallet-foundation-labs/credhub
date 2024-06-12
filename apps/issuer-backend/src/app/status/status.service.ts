import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, LessThan, Not, Repository } from 'typeorm';
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
import { KeyService } from '@credhub/relying-party-shared';
import { v4 } from 'uuid';
import { SchedulerRegistry } from '@nestjs/schedule';

@Injectable()
export class StatusService {
  constructor(
    @InjectRepository(StatusList)
    private statusRepository: Repository<StatusList>,
    private configService: ConfigService,
    @Inject('KeyService') private keyService: KeyService,
    private dataSource: DataSource,
    private schedulerRegistry: SchedulerRegistry
  ) {
    // check every minute if the statuslist needs to be updated
    const interval = setInterval(this.updateListJob.bind(this), 1000 * 60);
    this.schedulerRegistry.addInterval('updateListJob', interval);
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
   * Updates the status list. This is done by checking if the list is expired and if so, updating the JWT.
   */
  private async updateListJob() {
    // get all lists that are expired
    const lists = await this.statusRepository.find({
      where: { exp: LessThan(new Date().getTime() / 1000) },
    });
    for (const list of lists) {
      // update the jwt
      const { jwt, exp } = await this.packList(list);
      list.jwt = jwt;
      list.exp = exp;
      // store the updated jwt
      await this.statusRepository.save(list);
    }
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
    const { jwt, exp } = await this.packList(entry);
    entry.jwt = jwt;
    entry.exp = exp;
    return this.statusRepository.save(entry);
  }

  /**
   * Returns a status list by its id. If the list is expired, it will be updated.
   * @param id identifier of the status list
   * @returns
   */
  async getOne(id: string) {
    const list = await this.statusRepository.findOneBy({ id });
    if (!list) {
      throw new NotFoundException();
    }
    //TODO: instead of updating it on demand, it would maybe make more sense to update it in a cronjob
    // in case the list is expired, we need to update the jwt
    if (!list.exp || list.exp < new Date().getTime() / 1000) {
      const { jwt, exp } = await this.packList(list);
      list.jwt = jwt;
      list.exp = exp;
      await this.statusRepository.save(list);
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

  /**
   * Encodes a list of numbers into a buffer.
   * @param list
   * @returns
   */
  private encodeList(list: number[]): Buffer {
    return Buffer.from(list.map((e) => e.toString(2)).join(''), 'binary');
  }

  /**
   * Decodes a buffer into a list of numbers.
   * @param list
   * @returns
   */
  private decodeList(list: Buffer): number[] {
    return list
      .toString('binary')
      .split('')
      .map((e) => parseInt(e, 2));
  }

  /**
   * Returns the status of a given index in the status list.
   * @param id
   * @param index
   * @returns
   */
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
    const listEntry = await this.statusRepository.findOneBy({
      id: statusListId,
    });
    if (!listEntry) {
      throw new NotFoundException();
    }
    const decodedList = this.decodeList(listEntry.list);
    const list = new List(decodedList, listEntry.bitsPerStatus);
    list.setStatus(index, status);
    listEntry.list = this.encodeList(list.statusList);
    //when dealing with TTL, we should not update the jwt here
    const { jwt, exp } = await this.packList(listEntry);
    listEntry.jwt = jwt;
    listEntry.exp = exp;
    await this.statusRepository.save(listEntry);
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
    const jwt = await this.keyService.signJWT(values.payload, values.header);
    return {
      jwt,
      exp: payload.exp as number,
    };
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
