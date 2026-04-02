const $toTopBtn = document.getElementById("totop-btn");

function toggleToTopBtn() {
  if (!$toTopBtn) return;
  const shouldShow = window.scrollY > 240;
  $toTopBtn.classList.toggle("is-hidden", !shouldShow);
}

document.addEventListener("DOMContentLoaded", () => {
  toggleToTopBtn();

  if ($toTopBtn) {
    $toTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
});

window.addEventListener("scroll", toggleToTopBtn, { passive: true });