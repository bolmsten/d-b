import { eventBus } from '../events';
import { ApplicationEvent } from '../events/applicationEvents';
import { Event } from '../events/event.enum';
import { UserWithRole } from '../models/User';
import { Rejection, isRejection } from '../rejection';

const EventBusDecorator = (eventType: Event) => {
  return (
    target: object,
    name: string,
    descriptor: {
      value?: (agent: UserWithRole, args: any) => Promise<Rejection | any>;
    }
  ) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function(...args) {
      let [loggedInUser] = args;

      const result = await originalMethod?.apply(this, args);

      // NOTE: Get the name of the object or class like: 'SEP', 'USER', 'Proposal' and lowercase it.
      const resultKey = (result.constructor.name as string).toLowerCase();

      // NOTE: This needs to be checked because there are mutations where we don't have loggedIn user. Example: ResetPasswordEmailMutation.
      if (!loggedInUser) {
        loggedInUser = result.user;
      }

      const event = {
        type: eventType,
        [resultKey]: result,
        key: resultKey,
        loggedInUserId: loggedInUser ? loggedInUser.id : null,
        isRejection: isRejection(result),
      } as ApplicationEvent;

      // NOTE: Do not log the event in testing environment.
      if (process.env.NODE_ENV !== 'test') {
        eventBus.publish(event);
      }

      return result;
    };
  };
};

export default EventBusDecorator;
