let tokenizer = null; //init tokenizer

let tokenizerPromise = null;
let queue = Promise.resolve(); //create task queue for promise

//add task to task queue
function enqueue(fn) {
  queue = queue.then(() => Promise.resolve(fn())).catch(console.error);
}

//build tokenizer
function getTokenizer() {
  if (tokenizerPromise) return tokenizerPromise; //if build already promised, wait

  //else build tokenizer
  tokenizerPromise = new Promise((resolve, reject) => {
    kuromoji
      .builder({ dicPath: chrome.runtime.getURL("dict/") })
      .build((err, t) => {
        if (err) reject(err); //if error, reject promise
        else resolve(t); //if success, let tasks access
      });
  });

  return tokenizerPromise; //return promise
}

//call this func for above function
async function initTokenizer() {
  tokenizer = await getTokenizer();
  return tokenizer;
}