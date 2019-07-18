import Joi from 'joi'
import { User, Message } from '../models'
import { signUp, signIn, objectId } from '../schemas'
import { attemptSignIn, signOut } from '../auth'

export default {
  Query: {
    me: (parent, args, { req }, info) => {
      return User.findById(req.session.userId)
    },
    users: (parent, args, { req }, info) => {
      // TODO: auth, projection, paginatio, sanitization

      return User.find({})
    },
    user: async (parent, args, { req }, info) => {
      await Joi.validate(args, objectId)

      return User.findById(args.id)
    }
  },

  Mutation: {
    signUp: async (parent, args, { req }, info) => {
      await Joi.validate(args, signUp, { abortEarly: false })

      const user = await User.create(args)
      req.session.userId = user.id
      return user
    },
    signIn: async (parent, args, { req }, info) => {
      await Joi.validate(args, signIn, { abortEarly: false })

      const user = await attemptSignIn(args.email, args.password)
      req.session.userId = user.id
      return user
    },
    signOut: async (parent, args, { req, res }, info) => {
      return signOut(req, res)
    }
  },
  User: {
    chats: async (user, args, context, info) => {
      return (await user.populate('chats').execPopulate()).chats
    }
  },
  Chat: {
    messages: (chat, args, context, info) => {
      return Message.find({ chat: chat.id })
    },
    users: async (chat, args, context, info) => {
      return (await chat.populate('users').execPopulate()).users
    },
    lastMessage: async (chat, args, context, info) => {
      return (await chat.populate('lastMessage').execPopulate()).lastMessage
    }
  }
}
