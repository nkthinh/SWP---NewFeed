import { User } from '@/types'

export interface Comment {
  id?: number
  postId?: number
  userId?: number
  content?: string
  createdAt?: Date
  updatedAt?: Date
  status?: boolean
  user: User
}
