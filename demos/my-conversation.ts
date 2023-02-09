import dotenv from 'dotenv-safe'
import { oraPromise } from 'ora'

import { ChatGPTAPI } from '../src'

dotenv.config()

let wait = false
const chatWindowMap = {}

async function start(text) {
  const api = new ChatGPTAPI({
    apiKey: process.env.OPENAI_API_KEY,
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

/**
 * Demo CLI for testing conversation support.
 *
 * ```
 * npx tsx demos/demo-conversation.ts
 * ```
 */
async function main(chatId = 'chatId') {
  const api = new ChatGPTAPI({
    apiKey: process.env.OPENAI_API_KEY,
    debug: false
  })

  const prompt = 'Write a poem about cats.'

  let res = await oraPromise(api.sendMessage(prompt), {
    text: prompt
  })

  console.log('\n' + res.text + '\n')

  const prompt2 = 'Can you make it cuter and shorter?'

  res = await oraPromise(
    api.sendMessage(prompt2, {
      conversationId: res.conversationId,
      parentMessageId: res.id
    }),
    {
      text: prompt2
    }
  )
  console.log('\n' + res.text + '\n')

  const prompt3 = 'Now write it in French.'

  res = await oraPromise(
    api.sendMessage(prompt3, {
      conversationId: res.conversationId,
      parentMessageId: res.id
    }),
    {
      text: prompt3
    }
  )
  console.log('\n' + res.text + '\n')

  const prompt4 = 'What were we talking about again?'

  res = await oraPromise(
    api.sendMessage(prompt4, {
      conversationId: res.conversationId,
      parentMessageId: res.id
    }),
    {
      text: prompt4
    }
  )
  console.log('\n' + res.text + '\n')

  return {}
}

// main().catch((err) => {
//     console.error(err)
//     process.exit(1)
// })

export default {
  getChatWindow: async (chatId = 'chatId') => {
    chatId = chatId || 'chatId'
    let window = chatWindowMap[chatId]
    return {
      res: window?.res,
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
          wait = false
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
            wait = false
            resolve(window.res.text)
          } catch (e) {
            let text = await submit()
            resolve(text)
          }
        })
      }
    }
  }
}
