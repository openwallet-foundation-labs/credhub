import { Injectable } from '@nestjs/common';
import { History } from './entities/history.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompactSdJwtVc } from '@sphereon/ssi-types';
import { SDJwtVcInstance } from '@sd-jwt/sd-jwt-vc';
import { digest } from '@sd-jwt/crypto-nodejs';
import { HistoryResponse } from './dto/history-response.dto';

@Injectable()
export class HistoryService {
  instance: SDJwtVcInstance;

  constructor(
    @InjectRepository(History)
    private historyRepository: Repository<History>
  ) {
    this.instance = new SDJwtVcInstance({ hasher: digest });
  }

  all(user: string) {
    return this.historyRepository.find({
      where: { user },
      order: { created_at: 'DESC' },
      // we only the id, relyingParty, created_at, and status fields to represent it as a list
      select: [
        'id',
        'relyingParty',
        'relyingPartyLogo',
        'credentialType',
        'created_at',
        'status',
      ],
    });
  }

  getOne(id: string, user: string) {
    //TODO: decode the presentation to return the values that got presented
    return this.historyRepository
      .findOne({ where: { id, user } })
      .then(async (element: HistoryResponse) => {
        if (element.presentation) {
          const pres = await this.instance.decode(element.presentation);
          element.disclosed = pres.disclosures.map((d) => ({
            key: d.key,
            value: d.value as string,
          }));
        }
        element.user = undefined;
        element.presentation = undefined;
        return element;
      });
  }

  add(
    session: string,
    user: string,
    relyingParty: string,
    logo: string,
    url: string
  ) {
    const history = new History();
    history.id = session;
    history.user = user;
    history.relyingParty = relyingParty;
    history.relyingPartyLogo = logo;
    history.value = url;
    history.status = 'pending';
    return this.historyRepository.save(history);
  }

  async accept(id: string, presentation: CompactSdJwtVc) {
    const pres = await this.instance.decode(presentation);
    return this.historyRepository.update(
      { id },
      {
        presentation,
        status: 'accepted',
        credentialType: pres.jwt.payload.vct as string,
      }
    );
  }

  decline(id: string) {
    return this.historyRepository.update({ id }, { status: 'declined' });
  }

  delete(sub: string) {
    return this.historyRepository.delete({ user: sub });
  }
}
