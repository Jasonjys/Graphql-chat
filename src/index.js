import {
  ApolloServer
} from 'apollo-server-express'
import http from 'http'
import session from 'express-session'
import connectRedis from 'connect-redis'
import express from 'express'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import DataLoader from 'dataloader'

import typeDefs from './typeDefs'
import resolvers from './resolvers'
import schemaDirectives from './directives'
import loaders from './loaders'

dotenv.config()

const {
  NODE_ENV,
  APP_PORT,
  DB_USERNAME,
  DB_PASSWORD,
  DB_HOST,
  DB_PORT,
  DB_NAME,
  SESS_NAME,
  SESS_SECRET,
  SESS_LIFETIME,
  REDIS_HOST,
  REDIS_PORT,
  REDIS_PASSWORD
} = process.env

const IN_DEV = NODE_ENV === 'development'

// connect to mongodb
mongoose.set('debug', true)
mongoose.connect(
  `mongodb://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`, {
    useNewUrlParser: true
  }
).then(() => {
  const app = express()
  app.disable('x-powered-by')

  // use Redis to store sessions
  const RedisStore = connectRedis(session)

  // connect to Redis
  const store = new RedisStore({
    host: REDIS_HOST,
    port: REDIS_PORT,
    pass: REDIS_PASSWORD
  })

  // use session and set session ID in cookie
  app.use(session({
    store,
    // session field name set to sid
    name: SESS_NAME,
    // secret used to sign the session ID cookie
    secret: SESS_SECRET,
    // forces the session to be saved back to the session store
    resave: true,
    rolling: true,
    saveUninitialized: false,
    cookie: {
      maxAge: +SESS_LIFETIME,
      sameSite: true,
      secure: !IN_DEV
    }
  }))

  // setup server with typeDefs and resolvers
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    schemaDirectives,
    playground: IN_DEV ? {
      settings: {
        'request.credentials': 'include'
      }
    } : false,
    // pass req and res to context so I can access them from in resolvers
    context: ({
      req,
      res,
      connection
    }) => {
      if (connection) {
        return {
          loaders: {
            user: new DataLoader(keys => loaders.user.batchUsers(keys))
          }
        }
      } else {
        return {
          req,
          res,
          loaders: {
            user: new DataLoader(keys => loaders.user.batchUsers(keys))
          }
        }
      }
    }
  })

  server.applyMiddleware({
    app,
    cors: false
  })

  const httpServer = http.createServer(app)
  server.installSubscriptionHandlers(httpServer)

  httpServer.listen({
      port: 4000
    }, () =>
    console.log(`🚀http://localhost:${APP_PORT}${server.graphqlPath}`)
  )
}).catch(e => {
  console.error(e)
})