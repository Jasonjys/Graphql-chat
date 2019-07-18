import mongoose, { Schema } from 'mongoose'

const { ObjectId } = Schema.Types

const messageSchema = new Schema({
  body: String,
  chat: {
    type: ObjectId,
    ref: 'Chat'
  },
  sender: {
    type: ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
})

export default mongoose.model('Message', messageSchema)
