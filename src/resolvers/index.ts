import { ResolverContext } from "../context";
import { isRejection, Rejection } from "../rejection";
import { Proposal, ProposalTemplate, ProposalAnswer } from "../models/Proposal";
import { User } from "../models/User";
import { Call } from "../models/Call";

interface ProposalArgs {
  id: string;
}

interface ProposalsArgs {
  first?: number;
  offset?: number;
  filter?: string;
}

interface CreateProposalArgs {}

interface CreateCallArgs {
  shortCode: string;
  startCall: string;
  endCall: string;
  startReview: string;
  endReview: string;
  startNotify: string;
  endNotify: string;
  cycleComment: string;
  surveyComment: string;
}

interface UpdateProposalArgs {
  id: string;
  title: string;
  abstract: string;
  answers: ProposalAnswer[];
  status: number;
  users: number[];
}

interface UpdateProposalFilesArgs {
  proposal_id: number;
  question_id: string;
  files: string[];
}

interface UpdateUserArgs {
  id: string;
  firstname: string;
  lastname: string;
  roles: number[];
}

interface ApproveProposalArgs {
  id: number;
}

interface UserArgs {
  id: string;
}

interface LoginArgs {
  username: string;
  password: string;
}

interface AddUserRoleArgs {
  userID: number;
  roleID: number;
}

interface UsersArgs {
  first?: number;
  offset?: number;
  filter?: string;
}

interface RolesArgs {}

interface CreateUserArgs {
  user_title: string;
  firstname: string;
  middlename: string;
  lastname: string;
  username: string;
  password: string;
  preferredname: string;
  orcid: string;
  gender: string;
  nationality: string;
  birthdate: string;
  organisation: string;
  department: string;
  organisation_address: string;
  position: string;
  email: string;
  telephone: string;
  telephone_alt: string;
}

enum PageName {
  HOMEPAGE = 1,
  HELPPAGE = 2
}

function resolveProposal(proposal: Proposal | null, context: ResolverContext) {
  if (proposal == null) {
    return null;
  }
  const { id, title, abstract, status, created, updated } = proposal;
  const agent = context.user;

  return {
    id,
    title,
    abstract,
    status,
    created,
    updated,
    users: () => context.queries.user.getProposers(agent, id),
    reviews: () => context.queries.review.reviewsForProposal(agent, id)
  };
}

function resolveProposals(
  proposals: { totalCount: number; proposals: Proposal[] } | null,
  context: ResolverContext
) {
  if (proposals == null) {
    return null;
  }

  return {
    totalCount: proposals.totalCount,
    proposals: proposals.proposals.map(proposal =>
      resolveProposal(proposal, context)
    )
  };
}

function createResponseWrapper<T>(key: string) {
  return async function(promise: Promise<T | Rejection>) {
    const result = await promise;
    if (isRejection(result)) {
      return {
        [key]: null,
        error: result.reason
      };
    } else {
      return {
        [key]: result,
        error: null
      };
    }
  };
}

const wrapFilesMutation = createResponseWrapper<string[]>("files");
const wrapProposalMutation = createResponseWrapper<Proposal>("proposal");
const wrapUserMutation = createResponseWrapper<User>("user");
const wrapProposalTemplate = createResponseWrapper<ProposalTemplate>(
  "template"
);
const wrapCallMutation = createResponseWrapper<Call>("call");

export default {
  async proposal(args: ProposalArgs, context: ResolverContext) {
    const proposal = await context.queries.proposal.get(
      context.user,
      parseInt(args.id)
    );

    return resolveProposal(proposal, context);
  },

  async proposals(args: ProposalsArgs, context: ResolverContext) {
    const proposals = await context.queries.proposal.getAll(
      context.user,
      args.filter,
      args.first,
      args.offset
    );

    return resolveProposals(proposals, context);
  },

  async proposalTemplate(args: CreateProposalArgs, context: ResolverContext) {
    return await wrapProposalTemplate(
      context.queries.proposal.getProposalTemplate(context.user)
    );
  },

  createProposal(args: CreateProposalArgs, context: ResolverContext) {
    return wrapProposalMutation(
      context.mutations.proposal.create(context.user)
    );
  },

  updateProposal(args: UpdateProposalArgs, context: ResolverContext) {
    const { id, title, abstract, answers, status, users } = args;
    return wrapProposalMutation(
      context.mutations.proposal.update(
        context.user,
        id,
        title,
        abstract,
        answers,
        status,
        users
      )
    );
  },

  updateProposalFiles(args: UpdateProposalFilesArgs, context: ResolverContext) {
    const { proposal_id, question_id, files } = args;
    return wrapFilesMutation(
      context.mutations.proposal.updateFiles(
        context.user,
        proposal_id,
        question_id,
        files
      )
    );
  },

  approveProposal(args: ApproveProposalArgs, context: ResolverContext) {
    return wrapProposalMutation(
      context.mutations.proposal.accept(context.user, args.id)
    );
  },

  rejectProposal(args: ApproveProposalArgs, context: ResolverContext) {
    return wrapProposalMutation(
      context.mutations.proposal.reject(context.user, args.id)
    );
  },

  submitProposal(args: ApproveProposalArgs, context: ResolverContext) {
    return wrapProposalMutation(
      context.mutations.proposal.submit(context.user, args.id)
    );
  },

  review(args: { id: number }, context: ResolverContext) {
    return context.queries.review.get(context.user, args.id);
  },

  addReview(
    args: { reviewID: number; comment: string; grade: number },
    context: ResolverContext
  ) {
    return context.mutations.review.submitReview(
      context.user,
      args.reviewID,
      args.comment,
      args.grade
    );
  },

  addUserForReview(
    args: { userID: number; proposalID: number },
    context: ResolverContext
  ) {
    return context.mutations.review.addUserForReview(
      context.user,
      args.userID,
      args.proposalID
    );
  },

  removeUserForReview(args: { reviewID: number }, context: ResolverContext) {
    return context.mutations.review.removeUserForReview(
      context.user,
      args.reviewID
    );
  },

  login(args: LoginArgs, context: ResolverContext) {
    return context.mutations.user.login(args.username, args.password);
  },

  token(args: { token: string }, context: ResolverContext) {
    return context.mutations.user.token(args.token);
  },

  user(args: UserArgs, context: ResolverContext) {
    return context.queries.user.get(context.user, parseInt(args.id));
  },

  users(args: UsersArgs, context: ResolverContext) {
    return context.queries.user.getAll(
      context.user,
      args.filter,
      args.first,
      args.offset
    );
  },

  roles(_args: RolesArgs, context: ResolverContext) {
    return context.queries.user.getRoles(context.user);
  },

  createUser(args: CreateUserArgs, context: ResolverContext) {
    return wrapUserMutation(
      context.mutations.user.create(
        args.user_title,
        args.firstname,
        args.middlename,
        args.lastname,
        args.username,
        args.password,
        args.preferredname,
        args.orcid,
        args.gender,
        args.nationality,
        args.birthdate,
        args.organisation,
        args.department,
        args.organisation_address,
        args.position,
        args.email,
        args.telephone,
        args.telephone_alt
      )
    );
  },

  updateUser(args: UpdateUserArgs, context: ResolverContext) {
    return wrapUserMutation(
      context.mutations.user.update(
        context.user,
        args.id,
        args.firstname,
        args.lastname,
        args.roles
      )
    );
  },

  async resetPasswordEmail(args: { email: string }, context: ResolverContext) {
    const result = await context.mutations.user.resetPasswordEmail(args.email);
    return !isRejection(result);
  },

  resetPassword(
    args: { token: string; password: string },
    context: ResolverContext
  ) {
    return context.mutations.user.resetPassword(args.token, args.password);
  },

  createCall(args: CreateCallArgs, context: ResolverContext) {
    return wrapCallMutation(
      context.mutations.call.create(
        context.user,
        args.shortCode,
        args.startCall,
        args.endCall,
        args.startReview,
        args.endReview,
        args.startNotify,
        args.endNotify,
        args.cycleComment,
        args.surveyComment
      )
    );
  },
  call(args: { id: number }, context: ResolverContext) {
    return context.queries.call.get(context.user, args.id);
  },
  calls(args: {}, context: ResolverContext) {
    return context.queries.call.getAll(context.user);
  },
  setPageContent(
    args: { id: PageName; text: string },
    context: ResolverContext
  ) {
    console.log(PageName[args.id], args.id);
    return context.mutations.admin.setPageText(
      context.user,
      parseInt(PageName[args.id]),
      args.text
    );
  },
  getPageContent(args: { id: PageName }, context: ResolverContext) {
    return context.queries.admin.getPageText(
      context.user,
      parseInt(PageName[args.id])
    );
  }
};
