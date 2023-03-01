import KeyvRedis from '@keyv/redis'
import dotenv from 'dotenv-safe'
import Keyv from 'keyv'
import { oraPromise } from 'ora'

import { ChatGPTAPI } from '../src'

dotenv.config()

let wait = false
const chatWindowMap = {}

const closeWait = () => {
  wait = false
}
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
const store = new KeyvRedis(redisUrl)
const messageStore = new Keyv({ store, namespace: 'chatgpt-demo' })

async function start(text) {
  const api = new ChatGPTAPI({
    apiKey: process.env.OPENAI_API_KEY,
    messageStore,
    debug: false
  })

  let res = await oraPromise(api.sendMessage(text), {
    text: text
  })
  return {
    api: api,
    res: res
  }
}

export default {
  getChatWindow: async (chatId = 'chatId') => {
    chatId = chatId || 'chatId'
    let window = chatWindowMap[chatId]
    return {
      res: window?.res,
      close: () => {
        closeWait()
      },
      send: async (text = '') => {
        if (!text.trim()) return

        if (wait) {
          return 'chatGPT 正在思考中，请稍后提问'
        }
        wait = true

        const submit = async () => {
          let { res, api } = await start(text)
          chatWindowMap[chatId] = { res, api }
          window = chatWindowMap[chatId]
          closeWait()
          return res.text
        }
        //first submit
        if (!window) {
          return await submit()
        }

        return new Promise(async (resolve, reject) => {
          try {
            window.res = await oraPromise(
              window.api.sendMessage(text, {
                conversationId: window.res.conversationId,
                parentMessageId: window.res.id
              }),
              {
                text: text
              }
            )
            closeWait()
            resolve(window.res.text)
          } catch (e) {
            try {
              let text = await submit()
              resolve(text)
            } catch (e) {
              resolve('请求次数过多，请稍后再试')
              closeWait()
            }
          }
        })
      }
    }
  }
}
