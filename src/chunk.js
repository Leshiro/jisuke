//process newly added text in chunks
let chunk = [];
let chunkTimer = null;

function addToChunk(el) {
  if (!el) return;

  //avoid duplicates
  if (!chunk.includes(el)) {
    chunk.push(el);
  }

  clearTimeout(chunkTimer);
  chunkTimer = setTimeout(processChunk, 10); //process all changes as soon as changes stop
}

function processChunk() {
  chunkTimer = null;

  const current = chunk;
  chunk = []; //reset immediately so new nodes can collect

  for (const el of current) {
    if (HasJP(el)) {
      VO.Watch(el);
    }
  }
}