//when text is copied, remove ruby from copy
document.addEventListener("copy", function (e) {
  const selection = window.getSelection();
  if (!selection.rangeCount) return;

  const container = document.createElement("div");

  for (let i = 0; i < selection.rangeCount; i++) {
    container.appendChild(selection.getRangeAt(i).cloneContents());
  }

  //if no ruby, return
  if (!container.querySelector("ruby")) return;

  //remove ruby
  container.querySelectorAll("rt, rp").forEach(el => el.remove());

  e.preventDefault();
  e.clipboardData.setData("text/plain", container.textContent);
});