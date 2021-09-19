// dadishu

var score = 0;

function setScore(v) {
  score = v;
  document.querySelector(".score").innerHTML = `Score: ${score}`;
}

function clear() {
  const holes = document.querySelectorAll(".hole");
  holes.forEach(hole => {
    if (hole.classList.contains("not-hit")) {
      hole.classList.remove("not-hit");
    }
    if (hole.classList.contains("hit")) {
      hole.classList.remove("hit");
    }
  });
  dishu();
}

function dishu() {
  wait = Math.floor(Math.random() * 1000 + 3000);
  setTimeout(() => {
    const idx = Math.floor(Math.random() * 4);
    const holes = document.querySelectorAll(".hole");
    holes[idx].classList.add("not-hit");
    setTimeout(clear, 1200);
  }, wait);
}

window.onload = function () {
  setScore(0);
  const holes = document.querySelectorAll(".hole");
  holes.forEach(hole => {
    hole.addEventListener("click", () => {
      if (hole.classList.contains("not-hit")) {
        hole.classList.remove("not-hit");
        hole.classList.add("hit");
        setScore(score + 100);
      }
    })
  });
  clear();
};