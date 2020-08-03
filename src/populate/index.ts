import faker from 'faker';

import 'reflect-metadata';
import {
  adminDataSource,
  callDataSource,
  instrumentDatasource,
  proposalDataSource,
  questionaryDataSource,
  reviewDataSource,
  sepDataSource,
  templateDataSource,
  userDataSource,
} from '../datasources';
import database from '../datasources/postgres/database';
import {
  createConfigByType,
  DataType,
  TemplateCategoryId,
} from '../models/ProposalModel';
import { TechnicalReviewStatus } from '../models/TechnicalReview';
import { UserRole } from '../models/User';
import * as dummy from './dummy';
import { execute } from './executor';

const MAX_USERS = 1000;
const MAX_TEMPLATES = 15;
const MAX_CALLS = 11;
const MAX_INSTRUMENTS = 16;
const MAX_PROPOSALS = 500;
const MAX_SEPS = 10;
const MAX_REVIEWS = 600;

const createUniqueIntArray = (size: number, max: number) => {
  if (size > max) {
    throw Error('size must be smaller than max');
  }
  const shuffle = (array: number[]) => {
    array.sort(() => Math.random() - 0.5);
  };

  const array = Array.from(Array(max).keys());
  array.shift(); //excluding 0
  shuffle(array);

  return array.slice(0, size);
};

const createIntArray = (size: number, max: number) => {
  return new Array(size).fill(0).map(el => dummy.positiveNumber(max));
};

const createUsers = async () => {
  return execute(async () => {
    const user = await userDataSource.create(
      dummy.title(),
      faker.name.firstName(),
      faker.name.firstName(),
      faker.name.lastName(),
      faker.internet.userName(),
      '$2a$10$1svMW3/FwE5G1BpE7/CPW.aMyEymEBeWK4tSTtABbsoo/KaSQ.vwm',
      faker.name.firstName(),
      faker.random.uuid(),
      faker.random.uuid(),
      dummy.gender(),
      dummy.positiveNumber(20),
      faker.date.past(30).toLocaleDateString(),
      dummy.positiveNumber(20),
      faker.commerce.department(),
      faker.name.jobTitle(),
      faker.internet.email(),
      faker.phone.phoneNumber(),
      faker.phone.phoneNumber()
    );
    userDataSource.addUserRole({ userID: user.id, roleID: UserRole.USER });
    if (Math.random() > 0.8) {
      userDataSource.addUserRole({
        userID: user.id,
        roleID: UserRole.REVIEWER,
      });
    }
    if (Math.random() > 0.8) {
      userDataSource.addUserRole({
        userID: user.id,
        roleID: UserRole.SEP_REVIEWER,
      });
    }
    if (Math.random() > 0.8) {
      userDataSource.addUserRole({
        userID: user.id,
        roleID: UserRole.INSTRUMENT_SCIENTIST,
      });
    }
    if (Math.random() > 0.9) {
      userDataSource.addUserRole({
        userID: user.id,
        roleID: UserRole.SEP_CHAIR,
      });
    }
    if (Math.random() > 0.9) {
      userDataSource.addUserRole({
        userID: user.id,
        roleID: UserRole.SEP_SECRETARY,
      });
    }
    if (Math.random() > 0.95) {
      userDataSource.addUserRole({
        userID: user.id,
        roleID: UserRole.USER_OFFICER,
      });
    }

    return user;
  }, MAX_USERS);
};

const createCalls = async () => {
  const calls = await execute(() => {
    return callDataSource.create({
      cycleComment: faker.random.words(5),
      startCall: faker.date.past(1),
      startCycle: faker.date.past(1),
      startNotify: faker.date.past(1),
      startReview: faker.date.past(1),
      endNotify: faker.date.future(1),
      endCall: faker.date.future(1),
      endCycle: faker.date.future(1),
      endReview: faker.date.future(1),
      shortCode: `${dummy.word().substr(0, 15)}${dummy.positiveNumber(100)}`,
      surveyComment: faker.random.words(5),
      templateId: dummy.positiveNumber(MAX_TEMPLATES),
    });
  }, MAX_CALLS);
};

const createTemplates = async () => {
  const templates = await execute(() => {
    return templateDataSource.createTemplate({
      categoryId: TemplateCategoryId.PROPOSAL_QUESTIONARY,
      name: faker.random.word(),
      description: faker.random.words(3),
    });
  }, MAX_TEMPLATES);

  for (const template of templates) {
    await execute(() => {
      return templateDataSource.createTopic({
        sortOrder: 0,
        templateId: template.templateId,
      });
    }, dummy.positiveNumber(5));

    const steps = await templateDataSource.getTemplateSteps(
      template.templateId
    );

    for (const step of steps) {
      const questions = await execute(() => {
        const questionId = `text_input_${new Date().getTime()}`;

        return templateDataSource.createQuestion(
          TemplateCategoryId.PROPOSAL_QUESTIONARY,
          questionId,
          questionId,
          DataType.TEXT_INPUT,
          `${faker.random.words(5)}?`,
          JSON.stringify(createConfigByType(DataType.TEXT_INPUT, {}))
        );
      }, 10);

      for (const question of questions) {
        await templateDataSource.createQuestionTemplateRelation({
          questionId: question.proposalQuestionId,
          sortOrder: 0,
          templateId: template.templateId,
          topicId: step.topic.id,
        });
      }
    }
  }
};

const createInstruments = async () => {
  const instruments = await execute(() => {
    return instrumentDatasource.create({
      name: `${dummy.word()}${dummy.positiveNumber(100)}`,
      description: faker.random.words(5),
      shortCode: `${dummy.word()}${dummy.positiveNumber(100)}`.substr(0, 19),
    });
  }, MAX_INSTRUMENTS);

  for (const instrument of instruments) {
    await instrumentDatasource.assignScientistsToInstrument(
      createUniqueIntArray(3, MAX_USERS),
      instrument.id
    );
    await instrumentDatasource.setAvailabilityTimeOnInstrument(
      dummy.positiveNumber(MAX_CALLS),
      instrument.id,
      dummy.positiveNumber(100)
    );
  }
};

const createProposals = async () => {
  await execute(async () => {
    const questionary = await questionaryDataSource.create(
      dummy.positiveNumber(MAX_USERS),
      dummy.positiveNumber(MAX_TEMPLATES)
    );
    const proposal = await proposalDataSource.create(
      dummy.positiveNumber(MAX_USERS),
      dummy.positiveNumber(MAX_CALLS),
      questionary.questionaryId!
    );
    await proposalDataSource.update({
      ...proposal,
      title: faker.random.words(3),
      abstract: faker.random.words(7),
    });
    await proposalDataSource.setProposalUsers(
      proposal.id,
      createUniqueIntArray(3, MAX_USERS)
    );
    const questionarySteps = await questionaryDataSource.getQuestionarySteps(
      questionary.questionaryId!
    );
    for (const step of questionarySteps) {
      for (const question of step.fields) {
        await questionaryDataSource.updateAnswer(
          questionary.questionaryId!,
          question.question.proposalQuestionId,
          JSON.stringify({ value: faker.random.words(5) })
        );
      }
      await questionaryDataSource.updateTopicCompletenes(
        questionary.questionaryId!,
        step.topic.id,
        true
      );
    }

    instrumentDatasource.assignProposalsToInstrument(
      [proposal.id],
      dummy.positiveNumber(MAX_INSTRUMENTS)
    );
  }, MAX_PROPOSALS);
};

const createReviews = async () => {
  await execute(() => {
    return reviewDataSource.setTechnicalReview({
      proposalID: dummy.positiveNumber(MAX_PROPOSALS),
      comment: faker.random.words(50),
      publicComment: faker.random.words(25),
      status:
        Math.random() > 0.5
          ? TechnicalReviewStatus.FEASIBLE
          : TechnicalReviewStatus.UNFEASIBLE,
      timeAllocation: dummy.positiveNumber(10),
    });
  }, MAX_REVIEWS);
};

const createSeps = async () => {
  await execute(async () => {
    const sep = await sepDataSource.create(
      dummy.word(),
      faker.random.words(5),
      dummy.positiveNumber(5),
      true
    );
    await sepDataSource.addSEPMembersRole({
      SEPID: sep.id,
      roleID: UserRole.INSTRUMENT_SCIENTIST,
      userIDs: [dummy.positiveNumber(MAX_USERS)],
    });
    await sepDataSource.addSEPMembersRole({
      SEPID: sep.id,
      roleID: UserRole.SEP_CHAIR,
      userIDs: [dummy.positiveNumber(MAX_USERS)],
    });
    await sepDataSource.addSEPMembersRole({
      SEPID: sep.id,
      roleID: UserRole.SEP_SECRETARY,
      userIDs: [dummy.positiveNumber(MAX_USERS)],
    });
    await sepDataSource.addSEPMembersRole({
      SEPID: sep.id,
      roleID: UserRole.USER,
      userIDs: [dummy.positiveNumber(MAX_USERS)],
    });
    const proposalIds = createUniqueIntArray(5, MAX_PROPOSALS);
    for (const proposalId of proposalIds) {
      const tmpUserId = dummy.positiveNumber(MAX_USERS);
      await sepDataSource.assignProposal(proposalId, sep.id);
      await sepDataSource.assignMemberToSEPProposal(
        proposalId,
        sep.id,
        tmpUserId
      );
      await reviewDataSource.addUserForReview({
        proposalID: proposalId,
        sepID: sep.id,
        userID: tmpUserId,
      });
    }
  }, MAX_SEPS);
};

async function run() {
  console.log('Starting...');
  await adminDataSource.resetDB();
  await createUsers();
  await createTemplates();
  await createCalls();
  await createInstruments();
  await createProposals();
  await createSeps();
  await createReviews();
}

run().then(() => {
  console.log('Finished!');
});