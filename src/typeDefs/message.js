import { gql } from 'apollo-server-express'

export default gql`
  extend type Query {
    chatMessages(chatId: ID!, cursor: String, limit: Int): MessageConnection! @auth
  }

  extend type Mutation {
    createChatMessage(chatId: ID!, body: String!): Message @auth
  }

  extend type Subscription {
    messageAdded: Message
  }

  type Message {
    id: ID!
    body: String!
    sender: User!
    chat: Chat!
    createdAt: String!
    updatededAt: String!
  }

  type MessageConnection {
    edges: [Message!]!
    pageInfo: PageInfo!
  }

  type PageInfo {
    hasNextPage: Boolean!
    endCursor: String!
  }
`
