import { gql } from 'apollo-server-express'

export default gql`
  extend type Mutation {
    createChatMessage(chatId: ID!, body: String!): Message @auth
  }

  extend type Subscription {
    messageAdded(chatId: ID!): Message
  }

  type Message {
    id: ID!
    body: String!
    sender: User!
    chat: Chat!
    createdAt: String!
    updatededAt: String!
  }
`
