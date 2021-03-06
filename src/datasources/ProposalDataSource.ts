/* eslint-disable @typescript-eslint/camelcase */
import { Proposal } from '../models/Proposal';
import { ProposalsFilter } from './../resolvers/queries/ProposalsQuery';

export interface ProposalDataSource {
  // Read
  get(id: number): Promise<Proposal | null>;
  checkActiveCall(callId: number): Promise<boolean>;
  getProposals(
    filter?: ProposalsFilter,
    first?: number,
    offset?: number
  ): Promise<{ totalCount: number; proposals: Proposal[] }>;
  getUserProposals(id: number): Promise<Proposal[]>;

  // Write
  create(
    proposer_id: number,
    call_id: number,
    questionary_id: number
  ): Promise<Proposal>;
  update(proposal: Proposal): Promise<Proposal>;
  setProposalUsers(id: number, users: number[]): Promise<void>;
  submitProposal(id: number): Promise<Proposal>;
  deleteProposal(id: number): Promise<Proposal>;
}
