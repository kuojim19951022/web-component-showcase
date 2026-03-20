export class Visibility {
  #modalEl = null;
  #onOpen = null;
  #onClose = null;

  init(modalEl, { onOpen, onClose } = {}) {
    this.#modalEl = modalEl;
    this.#onOpen = onOpen;
    this.#onClose = onClose;
  }

  open() {
    if (!this.#modalEl) return;
    this.#modalEl.classList.add('active');
    document.body.style.overflow = 'hidden';
    this.#onOpen?.();
  }

  close() {
    if (!this.#modalEl) return;
    this.#modalEl.classList.remove('active');
    document.body.style.overflow = '';
    this.#onClose?.();
  }

  isOpen() {
    return this.#modalEl?.classList.contains('active') ?? false;
  }
}
