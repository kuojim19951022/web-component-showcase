import { DataManager } from "./data-manager.js";
import { StateMachine } from "./state-machine.js";
import { Visibility } from "./visibility.js";

export class Controller {
  #dataManager = new DataManager();
  #stateMachine = new StateMachine();
  #visibility = new Visibility();
  #uiRenderer = null;

  #source = "api";
  #endpoint = "";
  #dataUrl = null;

  #keydownHandler = (e) => {
    if (e.key === "Escape" && this.isOpen()) this.close();
  };

  constructor({ source, endpoint, dataUrl, uiRenderer }) {
    this.#source = source || "api";
    this.#endpoint = endpoint || "";
    this.#dataUrl = dataUrl ?? null;
    this.#uiRenderer = uiRenderer;
  }

  async init() {
    if (!this.#uiRenderer) {
      throw new Error("[Controller] 缺少 uiRenderer");
    }

    // 資料來源設定（API 或靜態 JSON）
    this.#dataManager.configure({
      source: this.#source,
      endpoint: this.#endpoint,
    });

    // 只有靜態資料才需要預先 load
    if (this.#source === "static") {
      try {
        if (!this.#dataUrl) throw new Error("缺少靜態資料 dataUrl");
        await this.#dataManager.loadStaticData(this.#dataUrl);
      } catch (err) {
        console.error("[YoutubeModal] 靜態資料載入失敗:", err);
      }
    }

    // 初始化 Visibility
    const modalEl = this.#uiRenderer.getModalElement();
    if (!modalEl) {
      throw new Error(
        "[Controller] 無法取得 modal element，請確認 UI mount 已完成",
      );
    }
    this.#visibility.init(modalEl);

    // 狀態變化 -> 驅動 UI；
    this.#stateMachine.on("loading", () => this.#uiRenderer.showLoading());
    this.#stateMachine.on("loaded", (data) => this.#uiRenderer.showVideo(data));
    this.#stateMachine.on("error", (error) =>
      this.#uiRenderer.showError(error),
    );
    this.#stateMachine.on("idle", () =>
      this.#uiRenderer.destroyCurrentPlayer(),
    );

    // UI 事件 -> 驅動 Controller
    this.#uiRenderer.bindInteractions({
      onClose: () => this.close(),
      onRelatedSelect: (id) => this.open(id),
    });

    // Escape 全域關閉
    document.addEventListener("keydown", this.#keydownHandler);
  }

  async open(videoId) {
    if (!videoId) throw new Error("缺少影片 ID");
    if (this.#stateMachine.state === "loading") return;
    this.#visibility.open();
    this.#stateMachine.transitionTo("loading");
    try {
      const data = await this.#dataManager.resolve(videoId);
      this.#stateMachine.transitionTo("loaded", data);
    } catch (error) {
      this.#stateMachine.transitionTo("error", error);
    }
  }

  close() {
    this.#visibility.close();
    this.#stateMachine.reset();
  }

  isOpen() {
    return this.#visibility.isOpen();
  }

  destroy() {
    document.removeEventListener("keydown", this.#keydownHandler);
  }
}
