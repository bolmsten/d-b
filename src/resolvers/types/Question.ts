import { Field, ObjectType } from 'type-graphql';

import {
  Question as QuestionOrigin,
  TemplateCategoryId,
} from '../../models/Template';
import { DataType } from '../../models/Template';
import { FieldConfigType } from './FieldConfig';

@ObjectType()
export class Question implements Partial<QuestionOrigin> {
  @Field()
  public proposalQuestionId: string;

  @Field(() => TemplateCategoryId)
  public categoryId: TemplateCategoryId;

  @Field()
  public naturalKey: string;

  @Field(() => DataType)
  public dataType: DataType;

  @Field()
  public question: string;

  @Field(() => FieldConfigType)
  public config: typeof FieldConfigType;
}
