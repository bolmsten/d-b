import { registerEnumType } from 'type-graphql';

import { EvaluatorOperator } from '../models/ConditionEvaluator';
import { PageName } from '../models/Page';
import { ProposalStatus, ProposalEndStatus } from '../models/Proposal';
import { ReviewStatus } from '../models/Review';
import { SampleStatus } from '../models/Sample';
import { TechnicalReviewStatus } from '../models/TechnicalReview';
import { DataType, TemplateCategoryId } from '../models/Template';
import { UserRole } from '../models/User';

export const registerEnums = () => {
  registerEnumType(TemplateCategoryId, { name: 'TemplateCategoryId' });
  registerEnumType(ProposalStatus, { name: 'ProposalStatus' });
  registerEnumType(ProposalEndStatus, { name: 'ProposalEndStatus' });
  registerEnumType(ReviewStatus, { name: 'ReviewStatus' });
  registerEnumType(TechnicalReviewStatus, { name: 'TechnicalReviewStatus' });
  registerEnumType(PageName, { name: 'PageName' });
  registerEnumType(UserRole, { name: 'UserRole' });
  registerEnumType(EvaluatorOperator, { name: 'EvaluatorOperator' });
  registerEnumType(DataType, { name: 'DataType' });
  registerEnumType(SampleStatus, { name: 'SampleStatus' });
};
