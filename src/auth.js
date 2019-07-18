import { AuthenticationError } from 'apollo-server-express'
import dotenv from 'dotenv'
import { User } from './models'

dotenv.config()

export const attemptSignIn = async (email, password) => {
  const user = await User.findOne({ email })
  const message = 'Incorrect Email or Password'

  if (!user) {
    throw new AuthenticationError(message)
  }

  // compare password
  if (!await user.matchesPassword(password)) {
    throw new AuthenticationError(message)
  }

  return user
}
const signedIn = req => req.session.userId

export const ensureSignedIn = req => {
  if (!signedIn(req)) {
    throw new AuthenticationError('You must be signed in.')
  }
}

export const signOut = (req, res) => {
  return (
    new Promise((resolve, reject) => {
      req.session.destroy(err => {
        if (err) reject(err)

        res.clearCookie(process.env.SESS_NAME)

        resolve(true)
      })
    })
  )
}

export const ensureSignedOut = req => {
  if (signedIn(req)) {
    throw new AuthenticationError('You are already signed in.')
  }
}
