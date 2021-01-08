import express from 'express'
import {requireAuth} from '../authUtils.js'

const router = express.Router()
router.use(requireAuth)

router.get('/', async (req, res) => {
  res.json({
    message: 'Welcome to AWS Cognito!',
  })
})

export default router
