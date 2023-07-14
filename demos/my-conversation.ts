import * as console from 'console'
import KeyvRedis from '@keyv/redis'
import dotenv from 'dotenv-safe'
import proxy from 'https-proxy-agent'
import Keyv from 'keyv'
import nodeFetch from 'node-fetch'
import { oraPromise } from 'ora'

import { ChatGPTAPI, ChatGPTUnofficialProxyAPI } from '../src'

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
    // completionParams: {
    //   model: 'gpt-3.5-turbo'
    // },
    apiKey: process.env.OPENAI_API_KEY,
    messageStore,
    fetch: (url, options = {}) => {
      const defaultOptions = {
        agent: proxy('http://127.0.0.1:1080')
      }

      const mergedOptions = {
        ...defaultOptions,
        ...options
      }

      return nodeFetch(url, mergedOptions)
    },
    debug: false
  })
  // const api = new ChatGPTUnofficialProxyAPI({
  //   messageStore,
  //   accessToken: "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",
  //   apiReverseProxyUrl: 'https://freechat.xyhelper.cn/backend-api/conversation'
  // })

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
          return { text: 'chatGPT 正在思考中，请稍后提问', status: 1 }
        }
        wait = true

        const submit = async () => {
          console.log('#submit 首次chat')
          let { res, api } = await start(text)
          chatWindowMap[chatId] = { res, api }
          window = chatWindowMap[chatId]
          closeWait()
          return { text: res.text, status: 0 }
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
            resolve({ text: window.res.text, status: 0 })
          } catch (e) {
            try {
              console.error(e)
              let res = await submit()
              resolve(res)
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
