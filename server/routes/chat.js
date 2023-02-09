import express from "express";

import chat from "../../demos/my-conversation";

const router = express.Router();


// 用户注册
router.get('/send', async (req, res, next) => {
    console.log(`req.query.chatId=${req.query.chatId}`)
    console.log(`req.query.text=${req.query.text}`)
    if (!req.query.text.trim()) {
        res.send("report")
    } else {
        let window = await chat.getChatWindow(req.query.chatId);
        let text = await window.send(req.query.text);
        console.log("chatGPT： "+text)

        res.send(text)
    }
});


export default router
