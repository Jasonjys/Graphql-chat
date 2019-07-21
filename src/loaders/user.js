import { User } from '../models'

export const batchUsers = async (keys) => {
  const users = await User.where('_id').in(keys)

  return keys.map(key => users.find(user => user.id === key.toString()))
}
