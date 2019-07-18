import Joi from 'Joi'
import { startChat } from '../schemas'
import { UserInputError } from 'apollo-server-core'
import { User, Chat } from '../models'

export default {
  Mutation: {
    startChat: async (parent, args, { req }, info) => {
      const { userId } = req.session
      const { title, userIds } = args
      await Joi.validate(args, startChat(userId), { abortEarly: false })

      const idsFound = await User.where('_id').in(userIds).countDocuments()

      if (idsFound !== userIds.length) {
        throw new UserInputError('One or more user IDs are invalid')
      }

      userIds.push(userId)

      const chat = await Chat.create({ title, users: userIds })

      await User.updateMany({ _id: { '$in': userIds } }, {
        $push: { chats: chat }
      })

      return chat
    }
  }
}
