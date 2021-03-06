import {
  Query,
  Arg,
  Ctx,
  Resolver,
  Int,
  Field,
  ObjectType,
} from 'type-graphql';

import { ResolverContext } from '../../context';
import { InstrumentWithAvailabilityTime } from '../types/Instrument';
import { Instrument } from '../types/Instrument';

@ObjectType()
class InstrumentsQueryResult {
  @Field(() => Int)
  public totalCount: number;

  @Field(() => [Instrument])
  public instruments: Instrument[];
}

@Resolver()
export class InstrumentQuery {
  @Query(() => Instrument, { nullable: true })
  instrument(
    @Arg('instrumentId', () => Int) instrumentId: number,
    @Ctx() context: ResolverContext
  ) {
    return context.queries.instrument.get(context.user, instrumentId);
  }

  @Query(() => InstrumentsQueryResult, { nullable: true })
  instruments(@Ctx() context: ResolverContext) {
    return context.queries.instrument.getAll(context.user);
  }

  @Query(() => [InstrumentWithAvailabilityTime], { nullable: true })
  instrumentsBySep(
    @Arg('sepId', () => Int) sepId: number,
    @Arg('callId', () => Int) callId: number,
    @Ctx() context: ResolverContext
  ) {
    return context.queries.instrument.getInstrumentsBySepId(context.user, {
      sepId,
      callId,
    });
  }
}
