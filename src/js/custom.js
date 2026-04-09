/**
 * 全站共用腳本（非 module，由各頁以 <script src> 引入）
 */

(function () {
  const SCROLL_THRESHOLD = 240;

  function toggleToTopBtn(btn) {
    if (!btn) return;
    const shouldShow = window.scrollY > SCROLL_THRESHOLD;
    btn.classList.toggle("is-hidden", !shouldShow);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("totop-btn");
    if (!btn) return;

    toggleToTopBtn(btn);
    btn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    window.addEventListener("scroll", () => toggleToTopBtn(btn), {
      passive: true,
    });
  });
})();
