import { Injectable } from '@nestjs/common';
import { History } from './entities/history.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class HistoryService {
  constructor(
    @InjectRepository(History)
    private historyRepository: Repository<History>
  ) {}

  all(user: string) {
    return this.historyRepository.find({
      where: { user },
      order: { created_at: 'DESC' },
      // we only the id, relyingParty, created_at, and status fields to represent it as a list
      select: ['id', 'relyingParty', 'created_at', 'status'],
    });
  }

  getOne(id: string, user: string) {
    return this.historyRepository.findOne({ where: { id, user } });
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

  setStatus(id: string, status: 'accepted' | 'declined') {
    return this.historyRepository.update({ id }, { status });
  }

  delete(sub: string) {
    return this.historyRepository.delete({ user: sub });
  }
}
