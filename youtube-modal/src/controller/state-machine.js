const VALID_TRANSITIONS = {
  idle: ['loading'],
  loading: ['loaded', 'error'],
  loaded: ['loading', 'idle'],
  error: ['loading', 'idle'],
};

export class StateMachine {
  #state = 'idle';
  #listeners = {};

  get state() {
    return this.#state;
  }

  on(event, handler) {
    if (!this.#listeners[event]) this.#listeners[event] = [];
    this.#listeners[event].push(handler);
    return () => {
      this.#listeners[event] = this.#listeners[event].filter((fn) => fn !== handler);
    };
  }

  #emit(event, payload) {
    (this.#listeners[event] || []).forEach((fn) => fn(payload));
  }

  transitionTo(state, payload) {
    if (!VALID_TRANSITIONS[this.#state]?.includes(state)) {
      console.warn(`[StateMachine] 無效轉換: ${this.#state} → ${state}`);
      return;
    }
    this.#state = state;
    this.#emit(state, payload);
    this.#emit('change', { state, payload });
  }

  reset() {
    this.#state = 'idle';
    this.#emit('idle', null);
    this.#emit('change', { state: 'idle', payload: null });
  }
}
