import PostgresAdminDataSource from './postgres/AdminDataSource';
import PostgresCallDataSource from './postgres/CallDataSource';
import PostgresEventLogsDataSource from './postgres/EventLogsDataSource';
import PostgresFileDataSource from './postgres/FileDataSource';
import PostgresProposalDataSource from './postgres/ProposalDataSource';
import PostgresReviewDataSource from './postgres/ReviewDataSource';
import PostgresSEPDataSource from './postgres/SEPDataSource';
import PostgresTemplateDataSource from './postgres/TemplateDataSource';
import PostgresUserDataSource from './postgres/UserDataSource';

export const userDataSource = new PostgresUserDataSource();
export const proposalDataSource = new PostgresProposalDataSource();
export const reviewDataSource = new PostgresReviewDataSource();
export const callDataSource = new PostgresCallDataSource();
export const fileDataSource = new PostgresFileDataSource();
export const adminDataSource = new PostgresAdminDataSource();
export const templateDataSource = new PostgresTemplateDataSource();
export const eventLogsDataSource = new PostgresEventLogsDataSource();
export const sepDataSource = new PostgresSEPDataSource();