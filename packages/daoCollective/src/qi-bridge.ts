/** DaoQiAgentBridge — 气桥接器
 * 帛书依据："万物负阴而抱阳，冲气以为和"（乙本·四十二章）
 * 设计原则：将 HunyuanBus（天地人冲四气传输层）与 DaoAgentMessenger（Agent 内部虚空通信）
 *           双向桥接，Agent 无需感知底层传输，仍通过 send/onMessage 使用 */

import { randomUUID } from 'node:crypto';
import { daoAgentMessenger } from '@daomind/agents';
import {
  HunyuanBus, DaoRouter, DaoSerializer, DaoSigner, DaoBackpressure,
  TianQiChannel, DiQiChannel, RenQiChannel,
} from '@modulux/qi';
import type { DaoMessage } from '@modulux/qi';

/** HunyuanBus 发出的 'message' 事件签名 */
type BusMessageHandler = (msg: DaoMessage, buf: Buffer, targets: readonly string[]) => void;

/**
 * 气代理桥接器
 *
 * - mount()       开始将 HunyuanBus 消息转发给 daoAgentMessenger
 * - unmount()     停止转发
 * - sendDown()    天气下行：根节点广播指令给所有 Agent
 * - sendDirect()  点对点：直接定向消息（不经 RenQi 端口限制）
 * - reportUp()    地气上行：Agent 向根节点上报指标
 * - openPort()    人气横向：开启两节点间 RenQiChannel 端口
 */
export class DaoQiAgentBridge {
  private readonly _router: DaoRouter;
  private readonly _bus: HunyuanBus;
  private readonly _tian: TianQiChannel;
  private readonly _di: DiQiChannel;
  private readonly _ren: RenQiChannel;

  private _busHandler?: BusMessageHandler;
  private _isMounted = false;

  constructor(secretKey = 'dao-bridge-secret') {
    this._router = new DaoRouter();
    // 预注册根节点与 Agent 系统路由
    this._router.addRoute('daoAgents', 'daoAgents');
    this._router.addRoute('daoCollective', 'daoCollective');

    this._bus = new HunyuanBus(
      new DaoSerializer(),
      this._router,
      new DaoSigner(),
      new DaoBackpressure({}),
      secretKey,
    );
    this._tian = new TianQiChannel(this._bus);
    this._di = new DiQiChannel(this._bus);
    this._ren = new RenQiChannel(this._bus);
  }

  // ──────────────────────────────────────────────
  // 生命周期
  // ──────────────────────────────────────────────

  /** 挂载：开始将 HunyuanBus 'message' 事件转发给 daoAgentMessenger（幂等）*/
  mount(): void {
    if (this._isMounted) return;
    this._busHandler = (msg: DaoMessage) => {
      const body = msg.body as Record<string, unknown>;
      const from   = String(body.from   ?? msg.header.source);
      const to     = String(body.to     ?? msg.header.target ?? '*');
      const action = String(body.action ?? msg.header.type);
      daoAgentMessenger.send(from, to, action, body.payload);
    };
    this._bus.on('message', this._busHandler);
    this._isMounted = true;
  }

  /** 卸载：停止转发（幂等）*/
  unmount(): void {
    if (!this._isMounted || !this._busHandler) return;
    this._bus.removeListener('message', this._busHandler);
    this._busHandler = undefined;
    this._isMounted = false;
  }

  // ──────────────────────────────────────────────
  // 发送接口
  // ──────────────────────────────────────────────

  /**
   * 天气下行 — 根节点向所有 Agent 广播指令
   * 直接构造 DaoMessage（不经 TianQiChannel.broadcast 的硬编码签名），
   * 通过 HunyuanBus 以无 target 广播语义发送。
   * @param messageType  消息类型标识
   * @param action       Agent 端将收到的 action
   * @param payload      可选载荷
   */
  async sendDown(messageType: string, action: string, payload?: unknown): Promise<void> {
    const message: DaoMessage = {
      header: {
        id: randomUUID(),
        type: messageType,
        source: 'daoCollective',
        // target 留空：广播给所有注册节点（DaoRouter 的 route() 支持此语义）
        priority: 1,
        ttl: 3,
        timestamp: Date.now(),
        encoding: 'json',
      },
      body: { type: messageType, from: 'daoCollective', to: '*', action, payload: payload ?? null },
    };
    await this._bus.send(message);
  }

  /**
   * 地气上行 — Agent 向根节点上报指标
   * @param agentId      上报的 Agent ID
   * @param messageType  指标类型
   * @param metrics      数值指标 key-value 对
   */
  async reportUp(
    agentId: string,
    messageType: string,
    metrics: Record<string, number>,
  ): Promise<void> {
    await this._di.report(agentId, messageType, metrics);
  }

  /**
   * 直接点对点 — 不经 RenQi 端口限制，直接通过 HunyuanBus 定向传输
   * 自动注册 target 路由（首次调用时）
   */
  async sendDirect(from: string, to: string, action: string, payload?: unknown): Promise<void> {
    // 自动注册 target 节点路由，确保 router 能路由到该目标
    this._router.addRoute(to, to);

    const message: DaoMessage = {
      header: {
        id: randomUUID(),
        type: action,
        source: from,
        target: to,
        priority: 1,
        ttl: 3,
        timestamp: Date.now(),
        encoding: 'json',
      },
      body: { type: action, from, to, action, payload: payload ?? null },
    };
    await this._bus.send(message);
  }

  /**
   * 人气横向 — 开启两节点间 RenQiChannel 端口
   * 注意：仅允许预定义的有效节点对（见 VALID_REN_QUI_PAIRS）
   * @returns true 若端口开启成功
   */
  openPort(nodeA: string, nodeB: string): boolean {
    return this._ren.open(nodeA, nodeB);
  }

  // ──────────────────────────────────────────────
  // 查询 / 访问器
  // ──────────────────────────────────────────────

  /** HunyuanBus 统计信息 */
  stats(): ReturnType<HunyuanBus['getStats']> {
    return this._bus.getStats();
  }

  get isMounted(): boolean { return this._isMounted; }
  get bus(): HunyuanBus { return this._bus; }
  get tian(): TianQiChannel { return this._tian; }
  get di(): DiQiChannel { return this._di; }
  get ren(): RenQiChannel { return this._ren; }
}
