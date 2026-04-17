/** DaoUniverseQi — 道宇宙混元气总线 × 宇宙服务网格
 * 帛书依据："万物负阴而抱阳，中气以为和"（德经·四十二章）
 *           "为学日益，为道日损"（德经·四十八章）
 * [注] 帛书（马王堆乙本）作"中气"（居间调和）；通行本（王弼）作"冲气"（激荡冲突）。
 *      DaoUniverseQi 对应宇宙生成论"三"的层次——中气作为阴阳居间调和之力，化生万物。
 *
 * 架构：DaoUniverseNexus → DaoUniverseQi
 *       独立 HunyuanBus（不污染任何全局单例），
 *       内置天/地/人/中气 四通道（'chong' 标识符维持 API 兼容，含义为中气调和），
 *       节点注册与 DaoRouter 路由同步，
 *       snapshot() 暴露消息总线运行时指标。
 *
 *   DaoUniverse
 *      └── DaoUniverseMonitor
 *              └── DaoUniverseNexus
 *                      └── DaoUniverseQi ← 混元气总线 × 服务网格路由融合
 */

import {
  HunyuanBus,
  TianQiChannel,
  DiQiChannel,
  RenQiChannel,
  ChongQiRegulator,
  daoCreateChongQiRegulator,
  DaoSerializer,
  DaoRouter,
  DaoSigner,
  DaoBackpressure,
} from '@modulux/qi';
import type { DaoMessage, QiChannelType, DaoMessagePriority, DaoEncoding } from '@modulux/qi';
import type { DaoUniverseNexus } from './universe-nexus';

/** 混元气总线运行时快照 */
export interface QiSnapshot {
  readonly timestamp:       number;
  /** HunyuanBus 已成功发出的消息总数 */
  readonly totalEmitted:    number;
  /** 被丢弃（无路由 / 背压 / 签名失败）的消息总数 */
  readonly totalDropped:    number;
  /** 各通道的消息计数（tian / di / ren / chong） */
  readonly channelsStats:   Record<string, number>;
  /** 当前已注册的节点数量 */
  readonly registeredNodes: number;
}

export class DaoUniverseQi {
  private readonly _bus:    HunyuanBus;
  private readonly _tian:   TianQiChannel;
  private readonly _di:     DiQiChannel;
  private readonly _ren:    RenQiChannel;
  private readonly _chong:  ChongQiRegulator;

  /** DaoRouter 实例（独立创建，供 addNode/removeNode 操作） */
  private readonly _router: DaoRouter;

  /** 消息 ID 自增计数（避免依赖 crypto.randomUUID） */
  private _msgSeq = 0;

  /** 已注册节点 ID 集合（用于 snapshot.registeredNodes 计数） */
  private readonly _nodes = new Set<string>();

  constructor(private readonly _nexus: DaoUniverseNexus) {
    const serializer   = new DaoSerializer();
    this._router       = new DaoRouter();
    const signer       = new DaoSigner();
    const backpressure = new DaoBackpressure({});

    this._bus   = new HunyuanBus(serializer, this._router, signer, backpressure, 'root-secret');
    this._tian  = new TianQiChannel(this._bus);
    this._di    = new DiQiChannel(this._bus);
    this._ren   = new RenQiChannel(this._bus);
    this._chong = daoCreateChongQiRegulator();
  }

  // ── 节点管理 ─────────────────────────────────────────────────────────────

  /**
   * addNode — 将节点注册到 DaoRouter
   *
   * @param nodeId  节点唯一 ID
   * @param target  路由目标（默认等于 nodeId，即节点订阅自己的消息）
   *
   * 注：target 为 undefined 时 HunyuanBus.send() 广播到所有已注册节点，
   *     因此任意 addRoute() 调用均使该节点参与广播接收。
   */
  addNode(nodeId: string, target?: string): void {
    this._router.addRoute(target ?? nodeId, nodeId);
    this._nodes.add(nodeId);
  }

  /**
   * removeNode — 从 DaoRouter 移除节点
   *
   * 若节点不存在，幂等（不抛出）。
   */
  removeNode(nodeId: string, target?: string): void {
    this._router.removeRoute(target ?? nodeId, nodeId);
    this._nodes.delete(nodeId);
  }

  // ── 消息通道 ─────────────────────────────────────────────────────────────

  /**
   * broadcast — 广播下行消息给所有已注册节点（全局指令 / 配置变更 / 元数据更新）
   *
   * 消息发往所有已注册节点（target = undefined → 广播语义）。
   * 直接通过 HunyuanBus.send() 发送，不附加签名，保证路由可达。
   */
  async broadcast(messageType: string, body: Record<string, unknown>): Promise<void> {
    const msgBody = ('type' in body ? body : { type: messageType, ...body }) as Record<string, unknown>;
    const msg: DaoMessage = {
      header: {
        id:        `dao-qi-${++this._msgSeq}`,
        type:      messageType,
        source:    'daoCollective',
        target:    undefined as unknown as string,
        priority:  1 as DaoMessagePriority,
        ttl:       3,
        timestamp: Date.now(),
        encoding:  'json' as DaoEncoding,
      },
      body: msgBody,
    };
    await this._bus.send(msg);
  }

  /**
   * report — 通过地气通道上报度量数据（叶节点 → 根节点）
   *
   * @param sourceId     上报源节点 ID
   * @param messageType  消息类型
   * @param metrics      数值指标键值对
   */
  report(
    sourceId: string,
    messageType: string,
    metrics: Record<string, number>,
  ): Promise<void> {
    return this._di.report(sourceId, messageType, metrics);
  }

  /**
   * subscribe — 订阅指定气通道（tian / di / ren / chong）
   *
   * @returns 取消订阅函数（调用后立即停止接收）
   */
  subscribe(
    channelType: QiChannelType,
    handler: (msg: DaoMessage) => void,
  ): () => void {
    return this._bus.subscribe(channelType, handler);
  }

  /**
   * probe — 探测目标节点的往返延迟（ms）
   */
  probe(target: string): Promise<number> {
    return this._bus.probe(target);
  }

  // ── 快照 ─────────────────────────────────────────────────────────────────

  /**
   * snapshot — 返回混元气总线的运行时指标快照
   */
  snapshot(): QiSnapshot {
    const stats = this._bus.getStats();
    return {
      timestamp:       Date.now(),
      totalEmitted:    stats.totalEmitted,
      totalDropped:    stats.totalDropped,
      channelsStats:   { ...stats.channelsStats },
      registeredNodes: this._nodes.size,
    };
  }

  // ── Getters ───────────────────────────────────────────────────────────────

  /** 上层 DaoUniverseNexus */
  get nexus(): DaoUniverseNexus {
    return this._nexus;
  }

  /** 底层 HunyuanBus（混元气总线） */
  get bus(): HunyuanBus {
    return this._bus;
  }

  /** 天气通道（下行广播，全局指令） */
  get tian(): TianQiChannel {
    return this._tian;
  }

  /** 地气通道（上行上报，度量数据） */
  get di(): DiQiChannel {
    return this._di;
  }

  /** 人气通道（横向协作，同级通信） */
  get ren(): RenQiChannel {
    return this._ren;
  }

  /** 中气调节器（阴阳居间调和，守中清静）— API兼容名chong */
  get chong(): ChongQiRegulator {
    return this._chong;
  }
}
