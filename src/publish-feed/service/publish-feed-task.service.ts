import { PrismaService } from '@pulsefeed/common';
import { PublishFeedStatus } from '../model';
import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

export interface CreatePublishFeedTask {
  readonly feedId: string;
  readonly status: PublishFeedStatus;
}

export interface UpdatePublishFeedTask {
  readonly taskId: string;
  readonly status: PublishFeedStatus;
  readonly publishedArticles?: number;
  readonly finishedAt?: Date;
}

@Injectable()
export class PublishFeedTaskService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Create new publish feed task to db.
   * @param create create params.
   * @returns the id of the created task.
   */
  async addTask(create: CreatePublishFeedTask): Promise<string> {
    const task = await this.prismaService.publishFeedTask.create({
      data: {
        id: uuidv4(),
        feedId: create.feedId,
        status: create.status,
        startedAt: new Date(),
      },
    });
    return task.id;
  }

  /**
   * Update publish feed task in db.
   */
  async updateTask(update: UpdatePublishFeedTask) {
    await this.prismaService.publishFeedTask.update({
      where: {
        id: update.taskId,
      },
      data: {
        status: update.status,
        publishedArticles: update.publishedArticles,
        finishedAt: update.finishedAt,
      },
    });
  }
}
