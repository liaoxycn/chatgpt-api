import axios from "axios";

// For local streaming, the websockets are hosted without ssl - http://
let _HOST = "localhost:5000";
let url = `http://localhost:5000/api/v1/chat`;


const run = (user_input, history) => {

  let params = {
    "user_input": user_input || "你好",
    "max_new_tokens": 250,
    "history": history || {
      "internal": [],
      "visible": []
    },
    "mode": "instruct",
    "character": "Example",
    "instruction_template": "Vicuna-v1.1",
    "your_name": "You",
    "regenerate": false,
    "_continue": false,
    "stop_at_newline": false,
    "chat_generation_attempts": 1,
    "chat-instruct_command": "Continue the chat dialogue below. Write a single reply for the character \"<|character|>\".\n\n<|prompt|>",
    "preset": "None",
    "do_sample": true,
    "temperature": 0.7,
    "top_p": 0.1,
    "typical_p": 1,
    "epsilon_cutoff": 0,
    "eta_cutoff": 0,
    "tfs": 1,
    "top_a": 0,
    "repetition_penalty": 1.18,
    "repetition_penalty_range": 0,
    "top_k": 40,
    "min_length": 0,
    "no_repeat_ngram_size": 0,
    "num_beams": 1,
    "penalty_alpha": 0,
    "length_penalty": 1,
    "early_stopping": false,
    "mirostat_mode": 0,
    "mirostat_tau": 5,
    "mirostat_eta": 0.1,
    "seed": -1,
    "add_bos_token": true,
    "truncation_length": 2048,
    "ban_eos_token": false,
    "skip_special_tokens": true,
    "stopping_strings": []
  };

  return new Promise((resolve, reject) => {
    axios.post("http://127.0.0.1:5000/api/v1/chat", params, {
      proxy: null,
      headers: { "Content-Type": "application/json; charset=UTF-8" }
    }).then(r => {
      // console.log(r.data["results"][0]["history"]);
      let history = r.data["results"][0]["history"];
      let text = history["visible"][history["visible"].length - 1][1];
      // console.log(text);
      resolve({
        res: {
          text,
          text2: text.split("\n\nUSER")[0],
          text3: text.split("\n\nUSER")[1],
          history: history
        }
      });
    });
  });
};

run("做爱有哪些姿势", null).then(({ text, history }) => {
  console.log(text);
  run("人类为什么要做爱", history).then(({ text, history }) => {
    console.log(text);
  });
});

export default {
  run
};
