import express from 'express'
import path from 'path'
import cors from 'cors'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import {config} from './config.js'
import authRouter from './api/auth.js'
import dataRouter from './api/data.js'
import {__dirname} from './nodeUtils.js'

const app = express()

app.use(bodyParser())
app.use(cookieParser())
app.set('trust proxy', 1) // trust first proxy (e.g. heroku)

if (config.dev) {
  app.use(
    cors({
      origin: config.allowedDevCorsOrigin,
      credentials: true,
    })
  )
}

// api
app.use('/auth', authRouter)
app.use('/data', dataRouter)

// serve client app
if (!config.dev) {
  const root = path.join(__dirname, '../client/build')
  app.use(express.static(root))
  app.get('*', function (req, res) {
    res.sendFile('index.html', {root})
  })
}

app.listen(config.port, async () => {
  console.log(`Listening at http://localhost:${config.port}`)
})
