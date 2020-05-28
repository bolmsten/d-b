/* eslint-disable @typescript-eslint/no-unused-vars */
import { ApolloServer } from 'apollo-server-express';
import cookieParser from 'cookie-parser';
import express, { Request, Response, NextFunction } from 'express';
import 'reflect-metadata';
import jwt from 'express-jwt';
import { buildSchema } from 'type-graphql';

import baseContext from './src/buildContext';
import { ResolverContext } from './src/context';
import { Role } from './src/models/Role';
import { User } from './src/models/User';
import { registerEnums } from './src/resolvers/registerEnums';
import files from './src/routes/files';
import proposalDownload from './src/routes/pdf';
import { logger } from './src/utils/Logger';

interface Req extends Request {
  user?: {
    user?: User;
    roles?: Role[];
  };
}

interface MiddlewareError extends Error {
  code: string | number;
}

async function bootstrap() {
  const app = express();
  const secret = process.env.secret as string;

  // authentication middleware
  const authMiddleware = jwt({
    credentialsRequired: false,
    secret,
  });

  // TODO: See how this can be used in apollo server.
  // const extensions = async (info: RequestInfo) => {
  //   if (info.result.errors) {
  //     logger.logError('Failed GRAPHQL execution', {
  //       result: info.result,
  //       operationName: info.operationName,
  //       user: info.context.user,
  //     });
  //   }
  // };

  app.use(
    authMiddleware,
    (err: MiddlewareError, req: Request, res: Response, next: NextFunction) => {
      /**
       * TODO: Check if this is really useful. We have general error handling middleware on line 108.
       * Where that invalid_token code comes from???
       * What is the scenario where we can enter this block???
       */
      if (err.code === 'invalid_token') {
        return res.status(401).send('jwt expired');
      }

      return res.sendStatus(400);
    }
  );

  registerEnums();

  app.use(cookieParser());

  const schema = await buildSchema({
    resolvers: [
      __dirname + '/src/resolvers/**/*Query.{ts,js}',
      __dirname + '/src/resolvers/**/*Mutation.{ts,js}',
      __dirname + '/src/resolvers/**/*Resolver.{ts,js}',
    ],
    validate: false,
  });

  const apollo = new ApolloServer({
    schema,
    context: async ({ req }: { req: Req }) => {
      let user = null;
      const userId = req.user?.user?.id as number;

      if (req.user) {
        user = await baseContext.queries.user.getAgent(userId);
      }

      const context: ResolverContext = { ...baseContext, user };

      return context;
    },
  });

  apollo.applyMiddleware({ app, path: '/graphql' });

  app.use(files);

  app.use(proposalDownload);

  app.listen(process.env.PORT || 4000);

  app.use(
    (err: Error | string, req: Request, res: Response, next: NextFunction) => {
      logger.logException('Unhandled EXPRESS JS exception', err, { req, res });
      res.status(500).send('SERVER EXCEPTION');
    }
  );

  process.on('uncaughtException', error => {
    logger.logException('Unhandled NODE exception', error);
  });

  console.log('Running a GraphQL API server at localhost:4000/graphql');
}

bootstrap();
