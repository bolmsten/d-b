import { Sample, SampleStatus } from '../../models/Sample';
import { UpdateSampleStatusArgs } from '../../resolvers/mutations/UpdateSampleStatusMutation';
import { UpdateSampleTitleArgs } from '../../resolvers/mutations/UpdateSampleTitleMutation';
import { SamplesArgs } from '../../resolvers/queries/SamplesQuery';
import { SampleDataSource } from '../SampleDataSource';

export class SampleDataSourceMock implements SampleDataSource {
  samples: Sample[];
  public init() {
    this.samples = [
      new Sample(1, 'title', 1, 1, SampleStatus.SAFE, new Date()),
    ];
  }
  async getSample(sampleId: number): Promise<Sample> {
    return this.samples.find(sample => sample.id === sampleId)!;
  }

  async getSamples(args: SamplesArgs): Promise<Sample[]> {
    return this.samples;
  }
  async getSamplesByAnswerId(answerId: number): Promise<Sample[]> {
    return this.samples;
  }
  async getSamplesByCallId(callId: number): Promise<Sample[]> {
    return this.samples;
  }
  async create(
    questionaryId: number,
    title: string,
    creatorId: number
  ): Promise<Sample> {
    return new Sample(
      1,
      title,
      creatorId,
      questionaryId,
      SampleStatus.NONE,
      new Date()
    );
  }

  async delete(sampleId: number): Promise<Sample> {
    return this.samples.splice(
      this.samples.findIndex(sample => sample.id == sampleId),
      1
    )[0];
  }
  async updateSampleStatus(args: UpdateSampleStatusArgs): Promise<Sample> {
    const sample = await this.getSample(args.sampleId);
    sample.status = args.status;

    return sample;
  }
  async updateSampleTitle(args: UpdateSampleTitleArgs): Promise<Sample> {
    const sample = await this.getSample(args.sampleId);
    sample.title = args.title;

    return sample;
  }
}