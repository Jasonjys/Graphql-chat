import Joi from 'joi'
import { UserInputError } from 'apollo-server-core'
import { PubSub } from 'apollo-server-express'
import { Message, Chat, User } from '../models'
import { objectId } from '../schemas'

const pubsub = new PubSub()

export default {
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
