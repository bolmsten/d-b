import { TemplateDataSource } from '../datasources/TemplateDataSource';
import { Authorized } from '../decorators';
import {
  createConfig,
  DataType,
  ProposalTemplate,
  Topic,
} from '../models/ProposalModel';
import { Roles } from '../models/Role';
import { User } from '../models/User';
import { rejection, Rejection } from '../rejection';
import { CreateQuestionArgs } from '../resolvers/mutations/CreateQuestionMutation';
import { UpdateProposalTemplateMetadataArgs } from '../resolvers/mutations/UpdateProposalTemplateMetadataMutation';
import { UpdateQuestionArgs } from '../resolvers/mutations/UpdateQuestionMutation';
import { UpdateQuestionRelArgs } from '../resolvers/mutations/UpdateQuestionRelMutation';
import { UpdateTopicArgs } from '../resolvers/mutations/UpdateTopicMutation';
import {
  ConfigBase,
  EmbellishmentConfig,
  FieldConfigType,
  FileUploadConfig,
  SelectionFromOptionsConfig,
} from '../resolvers/types/FieldConfig';
import { Logger, logger } from '../utils/Logger';
import { UserAuthorization } from '../utils/UserAuthorization';
import { ProposalTemplateMetadata, Question } from './../models/ProposalModel';

export default class TemplateMutations {
  constructor(
    private dataSource: TemplateDataSource,
    private userAuth: UserAuthorization,
    private logger: Logger
  ) {}

  @Authorized([Roles.USER_OFFICER])
  async createTemplate(
    agent: User | null,
    name: string,
    description?: string
  ): Promise<ProposalTemplateMetadata | Rejection> {
    const result = await this.dataSource
      .createTemplate(name, description)
      .then(result => result);

    return result;
  }

  @Authorized([Roles.USER_OFFICER])
  async deleteTemplate(
    user: User | null,
    id: number
  ): Promise<ProposalTemplateMetadata | Rejection> {
    return this.dataSource
      .deleteTemplate(id)
      .then(template => template)
      .catch(err => {
        logger.logException('Could not delete proposal', err, { id, user });

        return rejection('INTERNAL_ERROR');
      });
  }

  async createTopic(
    user: User | null,
    templateId: number,
    sortOrder: number
  ): Promise<ProposalTemplate | Rejection> {
    if (!(await this.userAuth.isUserOfficer(user))) {
      return rejection('INSUFFICIENT_PERMISSIONS');
    }

    return this.dataSource
      .createTopic(templateId, sortOrder)
      .then(template => template)
      .catch(err => {
        logger.logException('Could not create topic', err, {
          user,
          sortOrder,
        });

        return rejection('INTERNAL_ERROR');
      });
  }
  @Authorized([Roles.USER_OFFICER])
  async updateTopic(
    agent: User | null,
    args: UpdateTopicArgs
  ): Promise<Topic | Rejection> {
    return this.dataSource
      .updateTopic(args.id, args)
      .then(topic => topic)
      .catch(err => {
        logger.logException('Could not update topic', err, {
          agent,
          args,
        });

        return rejection('INTERNAL_ERROR');
      });
  }
  @Authorized([Roles.USER_OFFICER])
  async deleteTopic(
    agent: User | null,
    topicId: number
  ): Promise<Topic | Rejection> {
    return this.dataSource
      .deleteTopic(topicId)
      .then(topic => topic)
      .catch(err => {
        logger.logException('Could not delete topic', err, { agent, topicId });

        return rejection('INTERNAL_ERROR');
      });
  }
  @Authorized([Roles.USER_OFFICER])
  async createQuestion(
    agent: User | null,
    args: CreateQuestionArgs
  ): Promise<Question | Rejection> {
    const { dataType } = args;
    const newFieldId = `${dataType.toLowerCase()}_${new Date().getTime()}`;

    return this.dataSource
      .createQuestion(
        newFieldId,
        newFieldId, // natural key defaults to id
        dataType,
        'New question',
        JSON.stringify(this.createBlankConfig(dataType))
      )
      .then(question => question)
      .catch(err => {
        logger.logException('Could not create template field', err, {
          agent,
          dataType,
        });

        return rejection('INTERNAL_ERROR');
      });
  }
  @Authorized([Roles.USER_OFFICER])
  async updateQuestion(
    agent: User | null,
    args: UpdateQuestionArgs
  ): Promise<Question | Rejection> {
    if (!(await this.userAuth.isUserOfficer(agent))) {
      return rejection('NOT_AUTHORIZED');
    }

    return this.dataSource
      .updateQuestion(args.id, args)
      .then(question => question)
      .catch(err => {
        logger.logException('Could not update question', err, {
          agent,
          args,
        });

        return rejection('INTERNAL_ERROR');
      });
  }
  @Authorized([Roles.USER_OFFICER])
  async updateQuestionRel(
    agent: User | null,
    args: UpdateQuestionRelArgs
  ): Promise<ProposalTemplate | Rejection> {
    return this.dataSource
      .updateQuestionRel(args.questionId, args.templateId, args)
      .then(template => template)
      .catch(err => {
        logger.logException('Could not update question rel', err, {
          agent,
          args,
        });

        return rejection('INTERNAL_ERROR');
      });
  }
  @Authorized([Roles.USER_OFFICER])
  async deleteQuestion(
    agent: User | null,
    questionId: string
  ): Promise<Question | Rejection> {
    return this.dataSource
      .deleteQuestion(questionId)
      .then(template => template)
      .catch(err => {
        logger.logException('Could not delete question', err, {
          agent,
          id: questionId,
        });

        return rejection('INTERNAL_ERROR');
      });
  }

  async deleteQuestionRel(
    agent: User | null,
    templateId: number,
    questionId: string
  ): Promise<ProposalTemplate | Rejection> {
    return this.dataSource
      .deleteQuestionRel(templateId, questionId)
      .then(template => template)
      .catch(err => {
        logger.logException('Could not delete question rel', err, {
          agent,
          id: questionId,
          templateId,
        });

        return rejection('INTERNAL_ERROR');
      });
  }
  @Authorized([Roles.USER_OFFICER])
  async updateTopicOrder(
    agent: User | null,
    topicOrder: number[]
  ): Promise<number[] | Rejection> {
    return this.dataSource
      .updateTopicOrder(topicOrder)
      .then(order => order)
      .catch(err => {
        logger.logException('Could not update topic order', err, {
          agent,
          topicOrder,
        });

        return rejection('INTERNAL_ERROR');
      });
  }

  @Authorized([Roles.USER_OFFICER])
  async updateFieldTopicRel(
    agent: User | null,
    values: {
      templateId: number;
      topicId: number;
      fieldIds: string[];
    }
  ): Promise<string[] | Rejection> {
    let isSuccess = true;
    let index = 1;
    for (const field of values.fieldIds) {
      const updatedField = await this.dataSource.updateQuestionRel(
        field,
        values.templateId,
        {
          topicId: values.topicId,
          sortOrder: index,
        }
      );
      isSuccess = isSuccess && updatedField != null;
      index++;
    }
    if (isSuccess === false) {
      return rejection('INTERNAL_ERROR');
    }

    return values.fieldIds;
  }

  private createBlankConfig(dataType: DataType): typeof FieldConfigType {
    switch (dataType) {
      case DataType.FILE_UPLOAD:
        return createConfig<FileUploadConfig>(new FileUploadConfig());
      case DataType.EMBELLISHMENT:
        return createConfig<EmbellishmentConfig>(new EmbellishmentConfig(), {
          plain: 'New embellishment',
          html: '<p>New embellishment</p>',
        });
      case DataType.SELECTION_FROM_OPTIONS:
        return createConfig<SelectionFromOptionsConfig>(
          new SelectionFromOptionsConfig()
        );
      default:
        return new ConfigBase();
    }
  }
  @Authorized([Roles.USER_OFFICER])
  updateProposalTemplateMetadata(
    user: User | null,
    args: UpdateProposalTemplateMetadataArgs
  ) {
    return this.dataSource
      .updateTemplateMetadata(args)
      .then(data => data)
      .catch(err => {
        logger.logException('Could not update topic order', err, {
          user,
        });

        return rejection('INTERNAL_ERROR');
      });
  }
}
