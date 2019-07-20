import Joi from 'joi'
import { UserInputError } from 'apollo-server-core'
import { PubSub } from 'apollo-server-express'
import { Message, Chat, User } from '../models'
import { objectId } from '../schemas'

const pubsub = new PubSub()

export default {
  Query: {
    chatMessages: async (parent, { chatId, cursor, limit = 100 }, { req }, info) => {
      await Joi.validate({ id: chatId }, objectId)

      const baseOption = { chat: chatId }
      const cursorOptions = cursor ? { ...baseOption, createdAt: { $lt: cursor } } : baseOption
      const messages = await Message.find(cursorOptions).sort({ createdAt: -1 }).limit(limit + 1)

      const hasNextPage = messages.length > limit
      const edges = hasNextPage ? messages.slice(0, -1) : messages

      return {
        edges,
        pageInfo: {
          hasNextPage,
          endCursor: messages[messages.length - 1].createdAt
        }
      }
    }
  },
  Mutation: {
    createChatMessage: async (parent, args, { req }, info) => {
      const { userId } = req.session
      const { body, chatId } = args
      await Joi.validate({ id: chatId }, objectId)

      const chat = await Chat.findById(chatId)

      if (!chat) {
        throw new UserInputError('chat ID invalid')
      }

      const message = await Message.create({ body, chat, sender: userId })

      await Chat.update({ lastMessage: message })

      pubsub.publish('messageAdded', { messageAdded: message, chatId })

      return message
    }
  },

  Subscription: {
    messageAdded: {
      subscribe: () => pubsub.asyncIterator('messageAdded')
    }
  },

  Message: {
    sender: (message, args, { req }, info) => {
      return User.findById(message.sender)
    }
  }
}
