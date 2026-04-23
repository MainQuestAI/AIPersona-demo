import { clearAuthSession, getActiveTeamId } from './auth-session';

function redirectToLogin(): void {
  if (typeof window === 'undefined') {
    return;
  }
  const redirect = `${window.location.pathname}${window.location.search}`;
  window.location.assign(`/login?redirect=${encodeURIComponent(redirect)}`);
}

export type StudyBundleStudy = {
  id: string;
  business_question?: string | null;
  study_type?: string | null;
  brand?: string | null;
  category?: string | null;
  target_groups?: string[] | null;
  status?: string | null;
};

export type PlanPlanSnapshot = {
  id: string;
  draft_status?: string | null;
  current_draft_version_id?: string | null;
  latest_approved_version_id?: string | null;
  current_execution_version_id?: string | null;
};

export type PlanVersionSummary = {
  id: string;
  version_no?: number | null;
  approval_status?: string | null;
  status?: string | null;
  approval_required?: boolean | null;
  generated_by?: string | null;
  estimated_cost?: string | null;
  stimulus_count?: number | null;
  twin_count?: number | null;
  stimulus_ids?: string[] | null;
  twin_version_ids?: string[] | null;
  created_at?: string | null;
};

export type RunStepSummary = {
  step_type?: string | null;
  status?: string | null;
  started_at?: string | null;
  ended_at?: string | null;
};

export type RunSummary = {
  id: string;
  study_plan_version_id?: string | null;
  status?: string | null;
  workflow_id?: string | null;
  workflow_run_id?: string | null;
  step_count?: number | null;
  approval_status?: string | null;
  steps?: RunStepSummary[] | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type ArtifactSummary = {
  id: string;
  artifact_type: string;
  format: string;
  status: string;
  manifest: Record<string, unknown>;
  created_at: string;
};

export type CostSummary = {
  estimated_cost?: string | null;
  actual_cost?: string | null;
  total_prompt_tokens?: number | null;
  total_completion_tokens?: number | null;
  usage_by_model?: Array<{
    model: string;
    prompt_tokens: number;
    completion_tokens: number;
    cost: number;
  }> | null;
};

export type ConsumerTwinRecord = {
  id: string;
  business_purpose?: string | null;
  status?: string | null;
  owner?: string | null;
  target_audience_label?: string | null;
  latest_version_id?: string | null;
  latest_version_no?: number | null;
  persona_profile_snapshot_json?: Record<string, unknown> | null;
  source_lineage?: Record<string, unknown> | null;
};

export type TargetAudienceRecord = {
  id: string;
  label: string;
  category?: string | null;
  description?: string | null;
};

export type PersonaProfileRecord = {
  id: string;
  label: string;
  target_audience_id?: string | null;
  target_audience_label?: string | null;
  profile_json?: Record<string, unknown> | null;
};

export type TwinVersionRecord = {
  id: string;
  consumer_twin_id?: string | null;
  version_no?: number | null;
  persona_profile_snapshot_json?: Record<string, unknown> | null;
  source_lineage?: Record<string, unknown> | null;
  target_audience_label?: string | null;
  business_purpose?: string | null;
};

export type StimulusRecord = {
  id: string;
  name: string;
  stimulus_type?: string | null;
  asset_manifest_id?: string | null;
  asset_name?: string | null;
  description?: string | null;
  stimulus_json?: Record<string, unknown> | null;
  status?: string | null;
};

export type StudyListItem = StudyBundleStudy & {
  current_execution_version_id?: string | null;
  latest_plan_version_no?: number | null;
  current_run_status?: string | null;
};

export type StudyDetailProjection = WorkbenchProjection & {
  planning: {
    plan_id: string;
    draft_status?: string | null;
    current_execution_version_id?: string | null;
    latest_plan_version?: PlanVersionSummary | null;
    versions: PlanVersionSummary[];
    approval_history: Array<Record<string, unknown>>;
  };
  execution: {
    current_run: RunSummary | null;
    recent_runs: RunSummary[];
    cost_summary: CostSummary;
  };
  insights: {
    qual: Record<string, unknown>;
    quant: Record<string, unknown>;
    recommendation: Record<string, unknown>;
    replay: Record<string, unknown>;
    confidence: Record<string, unknown>;
  };
  assets: {
    twins: ConsumerTwinRecord[];
    stimuli: StimulusRecord[];
  };
  cost_summary?: CostSummary;
  twins?: ConsumerTwinRecord[];
  stimuli?: StimulusRecord[];
};

export type DashboardSnapshot = {
  studies: StudyListItem[];
  twins: ConsumerTwinRecord[];
  stimuli: StimulusRecord[];
  jobs: IngestionJob[];
};

export type SeedAssetPack = {
  target_audiences: Array<{ id: string; label: string }>;
  twin_versions: Array<{
    id: string;
    name: string;
    version_no: number;
    target_audience_label?: string;
    brand_name?: string;
    persona_tier?: string;
    default_demo?: boolean;
  }>;
  stimuli: Array<{ id: string; name: string; stimulus_type: string }>;
};

export type AssetImportResponse = {
  asset: {
    id: string;
    asset_kind: string;
    source_format: string;
    name: string;
  };
  job: {
    id: string;
    status: string;
  };
  dataset_mapping?: {
    id: string;
    mapping_status: string;
  };
  stimulus?: StimulusRecord;
};

export type IngestionJob = {
  id: string;
  asset_manifest_id: string;
  status: string;
  job_type?: string | null;
};

export type DatasetMapping = {
  id: string;
  asset_manifest_id: string;
  mapping_status: string;
};

export type BenchmarkPack = {
  id: string;
  name?: string | null;
};

export type CalibrationRun = {
  id: string;
  status?: string | null;
};

export type ConfidenceSnapshot = {
  id: string;
  label?: string | null;
};

export type DriftAlert = {
  id: string;
  label?: string | null;
};

export type StudyMemoryRecord = {
  id: string;
  study_id: string;
  memory_type: 'theme' | 'preference' | 'insight' | 'brand_positioning' | 'segment_finding';
  key: string;
  value: string;
  confidence?: number | null;
  extracted_at: string;
  study_question?: string | null;
};

export type ApprovalGateSummary = {
  id: string;
  scope_type?: string | null;
  approval_type?: string | null;
  status?: string | null;
  approved_by?: string | null;
  decision_comment?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type WorkbenchProjection = {
  study: StudyBundleStudy;
  plan: PlanPlanSnapshot;
  latest_plan_version: PlanVersionSummary | null;
  current_run: RunSummary | null;
  recent_runs: RunSummary[];
  artifacts?: ArtifactSummary[];
  approval_gates?: ApprovalGateSummary[];
  twins?: ConsumerTwinRecord[];
  stimuli?: StimulusRecord[];
  cost_summary?: CostSummary;
  summary: {
    total_plan_versions: number;
    total_runs: number;
    approved_plan_versions: number;
  };
};

export type StudyBundleResponse = {
  study: StudyBundleStudy;
  study_plan: PlanPlanSnapshot;
  study_plan_version: PlanVersionSummary;
};

const DEFAULT_ACTOR = 'boss';
const REQUEST_TIMEOUT_MS = 8_000;
const OFFLINE_BRAND = 'MirrorWorld Demo';
const OFFLINE_DEFAULT_QUESTION = '针对孕期女性与 0-3 岁宝宝妈妈，哪款新品饮品概念最能建立“营养可信赖、日常无负担”的品牌认知，并值得进入下一轮真实消费者验证？';
const OFFLINE_TARGET_GROUPS = ['Pregnant Women', 'New Mom'];
const OFFLINE_CATEGORY = 'Maternal beverage';
const OFFLINE_STUDY_TYPE = 'concept_screening';
const OFFLINE_STUDY_IDS = {
  midrun: 'demo-study-midrun',
  completed: 'demo-study-completed',
  rerun: 'demo-study-rerun',
} as const;

type OfflineRuntimeState = {
  studies: Record<string, StudyDetailProjection>;
  twins: ConsumerTwinRecord[];
  twinVersions: TwinVersionRecord[];
  targetAudiences: TargetAudienceRecord[];
  personaProfiles: PersonaProfileRecord[];
  stimuli: StimulusRecord[];
  ingestionJobs: IngestionJob[];
  datasetMappings: DatasetMapping[];
  benchmarkPacks: BenchmarkPack[];
  calibrationRuns: CalibrationRun[];
  confidenceSnapshots: ConfidenceSnapshot[];
  driftAlerts: DriftAlert[];
  memories: Record<string, StudyMemoryRecord[]>;
  agentMessages: Record<string, AgentMessage[]>;
};

let offlineCounter = 1;

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function nextOfflineId(prefix: string): string {
  const value = String(offlineCounter).padStart(3, '0');
  offlineCounter += 1;
  return `${prefix}-${value}`;
}

type OfflinePersonaBlueprint = {
  key: string;
  brandName: string;
  brandCategory: string;
  label: string;
  summary: string;
  count: number;
  coreCount: number;
  ageMin: number;
  ageMax: number;
  cityKeys: string[];
  occupations: string[];
  selfIdentity: string;
  focus: string;
  primaryNeed: string;
  secondaryNeed: string;
  unmetNeed: string;
  archetype: 'maternal' | 'medical' | 'beverage' | 'lifestyle' | 'plant';
  defaultDemo?: boolean;
};

const OFFLINE_CITY_META: Record<string, { city: string; tier: string; region: string }> = {
  shanghai: { city: '上海', tier: '一线', region: '华东' },
  beijing: { city: '北京', tier: '一线', region: '华北' },
  shenzhen: { city: '深圳', tier: '一线', region: '华南' },
  guangzhou: { city: '广州', tier: '一线', region: '华南' },
  hangzhou: { city: '杭州', tier: '新一线', region: '华东' },
  chengdu: { city: '成都', tier: '新一线', region: '西南' },
  nanjing: { city: '南京', tier: '新一线', region: '华东' },
  wuhan: { city: '武汉', tier: '新一线', region: '华中' },
  suzhou: { city: '苏州', tier: '新一线', region: '华东' },
  xiamen: { city: '厦门', tier: '新一线', region: '华东' },
  qingdao: { city: '青岛', tier: '新一线', region: '华东' },
  changsha: { city: '长沙', tier: '新一线', region: '华中' },
  kunming: { city: '昆明', tier: '二线', region: '西南' },
  hefei: { city: '合肥', tier: '二线', region: '华东' },
  zhengzhou: { city: '郑州', tier: '二线', region: '华中' },
  foshan: { city: '佛山', tier: '二线', region: '华南' },
  nantong: { city: '南通', tier: '三线', region: '华东' },
  luoyang: { city: '洛阳', tier: '三线', region: '华中' },
  yantai: { city: '烟台', tier: '三线', region: '华东' },
  weifang: { city: '潍坊', tier: '三线', region: '华东' },
};

const OFFLINE_SURNAMES = ['林', '周', '陈', '许', '沈', '梁', '顾', '韩', '江', '何', '宋', '彭', '罗', '苏', '温', '潘'];
const OFFLINE_GIVEN_NAMES = ['若溪', '以宁', '思琪', '念安', '清妍', '知夏', '子衿', '悦心', '安禾', '语桐', '佳澄', '沐晴', '书妍', '景川', '泽远', '承宇'];

const OFFLINE_ARCHETYPE_DEFAULTS: Record<OfflinePersonaBlueprint['archetype'], {
  channels: string[];
  sources: string[];
  frequencies: string[];
  loyalties: string[];
  digital: string[];
  apps: string[];
  ai: string[];
  family: string[];
  peer: string[];
  kol: string[];
  readiness: string[];
}> = {
  maternal: {
    channels: ['天猫国际/京东', '母婴店/山姆', '小红书种草后下单'],
    sources: ['小红书 + 丁香妈妈', '妈妈群 + 儿科医生', '抖音测评 + 电商评论'],
    frequencies: ['月度集中囤货', '按阶段补货', '大促节点囤货'],
    loyalties: ['中高，需要持续验证', '高，认准后不轻易换', '中，遇到更强配方会切换'],
    digital: ['高', '中高'],
    apps: ['小红书/天猫/丁香妈妈', '抖音/京东/妈妈网', '微信社群/山姆/美团'],
    ai: ['愿意参考，但更信权威背书', '把 AI 当效率工具，不会完全采信'],
    family: ['伴侣与长辈共同参与', '妈妈群和儿科建议都会参考', '自己拍板，但会听医生意见'],
    peer: ['真实妈妈口碑是关键决策锚点', '身边同龄妈妈的实际反馈很重要'],
    kol: ['关注医生号和育儿博主', '会看成分党测评号与母婴 KOL'],
    readiness: ['概念筛选', '命名测试', '沟通素材测试'],
  },
  medical: {
    channels: ['医院药房/电商旗舰店', '医生建议后到线下渠道购买', '社群推荐后补货'],
    sources: ['医生建议 + 病友群', '康复社群 + 电商问诊', '营养师建议 + 家庭讨论'],
    frequencies: ['按疗程补货', '按恢复阶段购买', '遇到复诊节点集中采购'],
    loyalties: ['高，只换医生明确建议的方案', '中高，前提是恢复效果稳定'],
    digital: ['中高', '中'],
    apps: ['微信/京东健康/医院小程序', '抖音搜索/病友群/美团买药'],
    ai: ['会拿 AI 做信息梳理，但最终听医生', '只把 AI 当检索，不会直接决定'],
    family: ['家属一起决策，照护者压力大', '医生意见优先，家庭只负责执行'],
    peer: ['病友经验能明显影响选择', '同类恢复案例会被反复比较'],
    kol: ['关注康复科普账号和营养师', '更信专业机构而不是普通博主'],
    readiness: ['照护旅程访谈', '话术清晰度测试', '渠道沟通测试'],
  },
  beverage: {
    channels: ['便利店/即时零售', '电商囤货 + 线下补买', '自动贩卖机/商超'],
    sources: ['抖音 + 小红书', '朋友推荐 + 货架直觉', '运动博主 + 电商评论'],
    frequencies: ['高频即买即喝', '每周补货', '运动或加班时集中购买'],
    loyalties: ['中，更多看场景和口感', '中低，谁更顺手就买谁', '中高，认准补水效率'],
    digital: ['高', '中高'],
    apps: ['抖音/美团/小红书', 'Keep/淘宝/京东到家', '微信/饿了么/哔哩哔哩'],
    ai: ['愿意拿 AI 做训练和健康建议参考', '对 AI 中性，更多看真实体验'],
    family: ['基本自己决定', '伴侣会影响囤货选择'],
    peer: ['同事和朋友的真实反馈很关键', '健身搭子和队友推荐影响大'],
    kol: ['看运动、效率、职场类博主', '对明星代言不敏感，更信真实测评'],
    readiness: ['概念筛选', '场景测试', '货架文案测试'],
  },
  lifestyle: {
    channels: ['Ole’/精品超市', '酒店/机场/便利店', '电商 + 线下商超'],
    sources: ['生活方式博主 + 小红书', '朋友推荐 + 线下体验', '酒店/餐饮场景感知'],
    frequencies: ['按场景购买', '周度补货', '差旅时高频购买'],
    loyalties: ['中高，认同品牌气质', '高，对稳定体验要求高'],
    digital: ['高', '中高'],
    apps: ['小红书/飞书/美团', '微信/携程/淘宝', '小红书/大众点评/盒马'],
    ai: ['愿意让 AI 帮忙做选择建议', '认为 AI 适合做效率辅助'],
    family: ['主要自己决定', '伴侣会影响家庭采购'],
    peer: ['同层级朋友的消费习惯会影响选择', '圈层认同感会强化品牌偏好'],
    kol: ['关注生活方式和酒店旅行博主', '会受高质量品牌内容影响'],
    readiness: ['包装测试', '高端场景测试', '传播素材测试'],
  },
  plant: {
    channels: ['盒马/山姆/天猫', '精品超市 + 电商', '办公室周边便利店'],
    sources: ['小红书 + 健身博主', '播客 + 生活方式 KOL', '营养科普号 + 配料表'],
    frequencies: ['每周补货', '早餐场景高频复购', '看到新口味会尝试'],
    loyalties: ['中高，认同植物基理念', '中，看口感和负担感是否平衡'],
    digital: ['高', '中高'],
    apps: ['小红书/Keep/盒马', '支付宝/淘宝/播客', '微信读书/山姆/美团'],
    ai: ['会让 AI 规划饮食和运动', '愿意参考 AI，但最终看自己身体反馈'],
    family: ['主要自己决定', '伴侣接受度会影响复购'],
    peer: ['健身和轻食圈层会明显影响选择', '朋友试喝评价很重要'],
    kol: ['关注营养学和可持续生活博主', '喜欢真实减脂、早餐类内容'],
    readiness: ['早餐场景测试', '概念筛选', '价格带测试'],
  },
};

function blueprint(payload: OfflinePersonaBlueprint): OfflinePersonaBlueprint {
  return payload;
}

const OFFLINE_PERSONA_BLUEPRINTS: OfflinePersonaBlueprint[] = [
  blueprint({ key: 'aptamil-formula-newmom', brandName: '爱他美', brandCategory: '婴幼儿配方', label: '精研配方新手妈妈', summary: '首娃 0-12 个月阶段，会把配方、来源和口碑逐项比对。', count: 4, coreCount: 1, ageMin: 27, ageMax: 33, cityKeys: ['shanghai', 'hangzhou', 'beijing', 'shenzhen'], occupations: ['品牌经理', '财务主管', '律师', '产品经理'], selfIdentity: '有方法论的新手妈妈', focus: '把每一次入口选择都做成理性决策', primaryNeed: '确认配方和来源足够可靠', secondaryNeed: '兼顾吸收表现和日常喂养效率', unmetNeed: '很难快速判断哪些卖点是真差异而不是营销词', archetype: 'maternal', defaultDemo: true }),
  blueprint({ key: 'aptamil-pregnant-care', brandName: '爱他美', brandCategory: '婴幼儿配方', label: '孕晚期精养妈妈', summary: '孕晚期开始提前研究喂养方案，偏好科学、稳妥和可持续的品牌。', count: 4, coreCount: 1, ageMin: 28, ageMax: 35, cityKeys: ['beijing', 'shanghai', 'suzhou', 'xiamen'], occupations: ['咨询顾问', '人力经理', '设计总监', '高校行政'], selfIdentity: '提前做功课的规划型妈妈', focus: '尽早降低新生儿喂养不确定性', primaryNeed: '提前建立喂养方案的心理安全感', secondaryNeed: '减少产后临时做决策的压力', unmetNeed: '缺少既专业又不制造焦虑的品牌表达', archetype: 'maternal' }),
  blueprint({ key: 'aptamil-career-mom', brandName: '爱他美', brandCategory: '婴幼儿配方', label: '成分党职场妈妈', summary: '返岗后时间紧，但依然愿意为高确信度配方支付溢价。', count: 4, coreCount: 1, ageMin: 30, ageMax: 36, cityKeys: ['shenzhen', 'guangzhou', 'hangzhou', 'chengdu'], occupations: ['互联网运营总监', '投行助理总监', '甲方市场经理', '数据分析师'], selfIdentity: '效率优先但不愿牺牲标准的妈妈', focus: '缩短判断时间，但不降低决策质量', primaryNeed: '快速锁定值得长期复购的品牌', secondaryNeed: '品牌表达既专业又不显得过度说教', unmetNeed: '职场返岗后缺少低判断成本的高信任选择', archetype: 'maternal' }),
  blueprint({ key: 'aptamil-second-baby', brandName: '爱他美', brandCategory: '婴幼儿配方', label: '二胎效率妈妈', summary: '有育儿经验，对营销更挑剔，更看执行效率与稳定口碑。', count: 4, coreCount: 1, ageMin: 32, ageMax: 38, cityKeys: ['nanjing', 'wuhan', 'qingdao', 'changsha'], occupations: ['会计主管', '教培创业者', '采购经理', '保险顾问'], selfIdentity: '经验老到、讨厌被忽悠的妈妈', focus: '用成熟经验帮自己节省精力', primaryNeed: '稳定、省事、不反复踩坑', secondaryNeed: '一旦确认有效，希望全家执行一致', unmetNeed: '大多数配方卖点听起来都太像', archetype: 'maternal' }),
  blueprint({ key: 'aptamil-overseas-educated', brandName: '爱他美', brandCategory: '婴幼儿配方', label: '高知海归妈妈', summary: '关注国际来源、科研背书和长期成长叙事。', count: 4, coreCount: 1, ageMin: 29, ageMax: 35, cityKeys: ['shanghai', 'beijing', 'shenzhen', 'hangzhou'], occupations: ['高校教师', '科技公司策略经理', '医药注册经理', '用户研究负责人'], selfIdentity: '用证据和世界经验做育儿决策', focus: '国际标准和长期成长逻辑', primaryNeed: '确认品牌叙事和配方逻辑一致', secondaryNeed: '对来源、科研和监管有清晰说明', unmetNeed: '很少有品牌能把专业性讲得足够克制', archetype: 'maternal' }),
  blueprint({ key: 'aptamil-township-safe', brandName: '爱他美', brandCategory: '婴幼儿配方', label: '下沉市场稳妥妈妈', summary: '价格敏感但并非只看低价，更在意买得放心、全家都认可。', count: 4, coreCount: 0, ageMin: 27, ageMax: 34, cityKeys: ['nantong', 'luoyang', 'weifang', 'yantai'], occupations: ['事业单位职员', '县城店主', '中学老师', '银行柜员'], selfIdentity: '务实但愿意为孩子升级消费的妈妈', focus: '买贵一点没关系，但不能买错', primaryNeed: '确认品牌靠谱且不需要反复解释', secondaryNeed: '线下也容易买到，补货方便', unmetNeed: '很多高端品牌看起来离自己太远', archetype: 'maternal' }),
  blueprint({ key: 'nutrilon-rational-formula', brandName: '诺优能', brandCategory: '婴幼儿配方', label: '理性比配方妈妈', summary: '会把配方、价格、来源做成表格比较，偏好有逻辑的说法。', count: 4, coreCount: 1, ageMin: 27, ageMax: 34, cityKeys: ['shanghai', 'suzhou', 'hefei', 'beijing'], occupations: ['审计经理', '供应链经理', '投后经理', '财务分析师'], selfIdentity: '把育儿消费当成理性采购项目的妈妈', focus: '同价位下要看得见的配方优势', primaryNeed: '在可接受价格带内找到更优逻辑', secondaryNeed: '品牌要说得明白，不要绕概念', unmetNeed: '跨境、国行和不同系列的信息很难横向比较', archetype: 'maternal', defaultDemo: true }),
  blueprint({ key: 'nutrilon-mixed-feeding', brandName: '诺优能', brandCategory: '婴幼儿配方', label: '混合喂养过渡妈妈', summary: '正在经历母乳、奶粉、辅食之间的过渡期，关注适配与稳定。', count: 4, coreCount: 1, ageMin: 26, ageMax: 33, cityKeys: ['chengdu', 'wuhan', 'zhengzhou', 'qingdao'], occupations: ['保险运营', '互联网客服主管', '培训老师', '公关专员'], selfIdentity: '边试边学、但很怕踩坑的妈妈', focus: '换阶段时尽量平稳，不要折腾孩子', primaryNeed: '确认阶段切换时的稳定性和适应性', secondaryNeed: '得到足够清晰的喂养建议', unmetNeed: '品牌很少真正理解过渡期的焦虑', archetype: 'maternal' }),
  blueprint({ key: 'nutrilon-cross-border', brandName: '诺优能', brandCategory: '婴幼儿配方', label: '跨境转国行妈妈', summary: '曾经依赖海淘或代购，现在希望回归稳定、合规、可持续购买。', count: 4, coreCount: 1, ageMin: 28, ageMax: 35, cityKeys: ['beijing', 'shenzhen', 'guangzhou', 'xiamen'], occupations: ['跨境电商运营', '广告策略经理', '采购主管', '医生'], selfIdentity: '对来源和合规有敏感度的精明妈妈', focus: '稳定供应和放心购买比猎奇更重要', primaryNeed: '找到能替代海淘确定感的国行方案', secondaryNeed: '对来源差异有透明说明', unmetNeed: '担心换渠道后品质感知下降', archetype: 'maternal' }),
  blueprint({ key: 'nutrilon-township-family', brandName: '诺优能', brandCategory: '婴幼儿配方', label: '小镇家庭决策妈妈', summary: '家庭共同决策更明显，需要兼顾老人意见、预算和品牌面子。', count: 4, coreCount: 0, ageMin: 27, ageMax: 35, cityKeys: ['nantong', 'yantai', 'luoyang', 'foshan'], occupations: ['护士', '事业单位科员', '县城门店老板', '中学老师'], selfIdentity: '在家庭拉扯中寻求平衡的妈妈', focus: '让全家都接受且不折腾', primaryNeed: '老人听得懂、自己也认可的品牌逻辑', secondaryNeed: '价格别超出长期承受范围', unmetNeed: '很多国际品牌讲法太高冷', archetype: 'maternal' }),
  blueprint({ key: 'nutricia-post-surgery', brandName: '纽迪希亚', brandCategory: '医学营养', label: '术后恢复照护者', summary: '负责家人术后恢复营养，追求恢复效果和执行便利性。', count: 3, coreCount: 1, ageMin: 34, ageMax: 45, cityKeys: ['beijing', 'shanghai', 'wuhan'], occupations: ['项目经理', '行政总监', '自由职业者'], selfIdentity: '希望把复杂恢复过程管理清楚的照护者', focus: '恢复效率和执行可持续性', primaryNeed: '让家人愿意持续喝并看到改善', secondaryNeed: '医生和自己都能接受的方案', unmetNeed: '很难在专业和口感接受度之间平衡', archetype: 'medical' }),
  blueprint({ key: 'nutricia-senior-manager', brandName: '纽迪希亚', brandCategory: '医学营养', label: '银发营养管理者', summary: '为父母长期营养补充做决策，关注依从性、吞咽负担和家庭预算。', count: 3, coreCount: 1, ageMin: 36, ageMax: 48, cityKeys: ['nanjing', 'hangzhou', 'chengdu'], occupations: ['HRD', '药企销售经理', '国企干部'], selfIdentity: '用系统化方式照顾父母健康的家庭中坚', focus: '长期可执行比短期激进更重要', primaryNeed: '建立稳定、家庭愿意坚持的营养方案', secondaryNeed: '对功能收益和适用边界有清晰认知', unmetNeed: '很多产品听起来专业，但家人未必愿意配合', archetype: 'medical' }),
  blueprint({ key: 'nutricia-oncology-caregiver', brandName: '纽迪希亚', brandCategory: '医学营养', label: '肿瘤康复陪护家属', summary: '处于高压恢复周期，信息搜寻强度高，对口味与情绪接受度都很敏感。', count: 3, coreCount: 0, ageMin: 31, ageMax: 43, cityKeys: ['guangzhou', 'changsha', 'zhengzhou'], occupations: ['地产运营', '会展策划', '教师'], selfIdentity: '在强压力下尽力把每个细节做好的人', focus: '少走弯路、别给病人增加额外负担', primaryNeed: '既专业又不让人心理排斥', secondaryNeed: '家属购买与使用步骤足够清晰', unmetNeed: '很多沟通太专业、太硬，不利于执行', archetype: 'medical' }),
  blueprint({ key: 'nutricia-swallowing-support', brandName: '纽迪希亚', brandCategory: '医学营养', label: '吞咽困难照护决策者', summary: '照护老人或慢病患者，对形态、顺滑度和风险提示非常敏感。', count: 3, coreCount: 0, ageMin: 35, ageMax: 50, cityKeys: ['shanghai', 'qingdao', 'foshan'], occupations: ['社区医院护士长', '家政管理者', '康复中心运营'], selfIdentity: '习惯把照护流程拆解得很细的人', focus: '把风险降到最低', primaryNeed: '确保产品形态真的适合特殊人群', secondaryNeed: '让家属使用时不犯错', unmetNeed: '包装与说明经常不够直观', archetype: 'medical' }),
  blueprint({ key: 'mizone-commuter', brandName: '脉动', brandCategory: '功能饮料', label: '通勤提神白领', summary: '高频通勤和长时间开会，需要稳定、顺口、随手可得的补水方案。', count: 4, coreCount: 1, ageMin: 24, ageMax: 31, cityKeys: ['shanghai', 'beijing', 'shenzhen', 'hangzhou'], occupations: ['品牌专员', '产品运营', '咨询顾问', '广告策划'], selfIdentity: '把效率和状态保持看得很重的职场人', focus: '补得快、喝着没负担、不会显得很刻意', primaryNeed: '午后和会前快速恢复状态', secondaryNeed: '放在工位上也不尴尬', unmetNeed: '功能饮料经常不是太甜就是太猛', archetype: 'beverage', defaultDemo: true }),
  blueprint({ key: 'mizone-campus-sports', brandName: '脉动', brandCategory: '功能饮料', label: '校园运动青年', summary: '课间、球场、社团活动之间切换，追求性价比和即时恢复感。', count: 4, coreCount: 1, ageMin: 19, ageMax: 24, cityKeys: ['wuhan', 'chengdu', 'changsha', 'qingdao'], occupations: ['大学生', '研究生', '体育社团干部', '校园新媒体学生'], selfIdentity: '精力旺盛、愿意为活动状态买单的年轻人', focus: '补水要快，口味也要好接受', primaryNeed: '运动后及时补充和提气', secondaryNeed: '价格别太高，校园里容易买到', unmetNeed: '很多运动饮料看起来像专业选手专用，离日常太远', archetype: 'beverage' }),
  blueprint({ key: 'mizone-fitness', brandName: '脉动', brandCategory: '功能饮料', label: '健身减脂人群', summary: '对糖感、热量和电解质平衡敏感，希望功能感明确但不负担。', count: 4, coreCount: 1, ageMin: 23, ageMax: 33, cityKeys: ['shenzhen', 'guangzhou', 'hangzhou', 'xiamen'], occupations: ['健身教练', '自媒体博主', '互联网设计师', '律师'], selfIdentity: '追求体型管理和效率恢复的自律人群', focus: '补充要服务训练目标，而不是破坏计划', primaryNeed: '在训练前后稳定补充且不增加罪恶感', secondaryNeed: '品牌表达别太土，适合社交分享', unmetNeed: '功能和轻负担常常很难兼得', archetype: 'beverage' }),
  blueprint({ key: 'mizone-rider-driver', brandName: '脉动', brandCategory: '功能饮料', label: '外卖骑手与司机', summary: '长时间在路上，高温、出汗和即时补给需求明显。', count: 3, coreCount: 0, ageMin: 24, ageMax: 38, cityKeys: ['guangzhou', 'wuhan', 'zhengzhou'], occupations: ['外卖骑手', '网约车司机', '同城配送员'], selfIdentity: '靠体力和节奏吃饭的高压劳动者', focus: '补给必须够快、够稳、够划算', primaryNeed: '高温和长工时下快速恢复状态', secondaryNeed: '路上容易买到，价格不能离谱', unmetNeed: '很多饮料喝完更口渴或者太甜', archetype: 'beverage' }),
  blueprint({ key: 'mizone-night-shift', brandName: '脉动', brandCategory: '功能饮料', label: '熬夜打工人', summary: '深夜加班和赶工时需要提神，但排斥过强刺激和身体负担。', count: 4, coreCount: 1, ageMin: 24, ageMax: 34, cityKeys: ['beijing', 'shanghai', 'chengdu', 'hangzhou'], occupations: ['程序员', '审片师', '投流运营', '游戏策划'], selfIdentity: '知道自己不健康但想把伤害降到最低的人', focus: '能撑住状态，但别透支太狠', primaryNeed: '加班时获得温和但有效的续航感', secondaryNeed: '避免喝完心慌或第二天更累', unmetNeed: '传统功能饮料太像硬顶，不像长期方案', archetype: 'beverage' }),
  blueprint({ key: 'mizone-outdoor-weekend', brandName: '脉动', brandCategory: '功能饮料', label: '周末户外爱好者', summary: '徒步、骑行、露营等场景下，追求好带、好喝、有参与感的补给。', count: 3, coreCount: 0, ageMin: 25, ageMax: 36, cityKeys: ['xiamen', 'qingdao', 'kunming'], occupations: ['户外俱乐部主理人', '摄影师', '产品经理'], selfIdentity: '把周末体验质量看得很重的人', focus: '补给要融入户外氛围，而不是破坏体验', primaryNeed: '在运动和社交之间保持舒适状态', secondaryNeed: '包装和口味有记忆点，愿意带出去', unmetNeed: '很多功能饮料缺少生活方式感', archetype: 'beverage' }),
  blueprint({ key: 'evian-parenting', brandName: '依云', brandCategory: '高端饮用水', label: '高端亲子生活妈妈', summary: '在亲子、出游和家庭接待场景里，会把水的品牌视作生活方式的一部分。', count: 4, coreCount: 1, ageMin: 30, ageMax: 38, cityKeys: ['shanghai', 'beijing', 'shenzhen', 'hangzhou'], occupations: ['买手店主理人', '品牌咨询顾问', '私募合伙人助理', '艺术教育机构负责人'], selfIdentity: '在生活细节上维持审美与体面感的妈妈', focus: '日常消费也要体现家庭生活方式标准', primaryNeed: '在亲子和家庭场景里保持天然、干净、拿得出手', secondaryNeed: '品牌最好自带国际感和体面感', unmetNeed: '很多高端水只停留在价格，没有真正的生活方式表达', archetype: 'lifestyle', defaultDemo: true }),
  blueprint({ key: 'evian-urban-professional', brandName: '依云', brandCategory: '高端饮用水', label: '都市精致白领', summary: '工作节奏快，但对办公桌面、会议和健身后的品牌选择有审美标准。', count: 4, coreCount: 1, ageMin: 25, ageMax: 34, cityKeys: ['shanghai', 'guangzhou', 'shenzhen', 'chengdu'], occupations: ['公关经理', '时尚编辑', '产品经理', '投行分析师'], selfIdentity: '希望效率与精致感并存的都市人', focus: '日常也不要用看起来很随便的东西', primaryNeed: '在办公室和差旅中维持稳定、体面的补水选择', secondaryNeed: '品牌不能过于夸张，最好天然克制', unmetNeed: '很多瓶装水没有情绪价值', archetype: 'lifestyle' }),
  blueprint({ key: 'evian-hotel-travel', brandName: '依云', brandCategory: '高端饮用水', label: '酒店差旅人士', summary: '常住酒店和机场，对品牌的一致体验、国际识别和低决策成本敏感。', count: 3, coreCount: 1, ageMin: 28, ageMax: 42, cityKeys: ['beijing', 'shanghai', 'guangzhou'], occupations: ['区域销售总监', '咨询顾问', '航空公司培训经理'], selfIdentity: '在移动中追求稳定体验的差旅人', focus: '少做决定，但每次都靠谱', primaryNeed: '差旅环境下获得熟悉、稳定、国际化的选择', secondaryNeed: '不想在酒店和机场随便喝', unmetNeed: '很多替代品缺少熟悉的品质感', archetype: 'lifestyle' }),
  blueprint({ key: 'evian-event-host', brandName: '依云', brandCategory: '高端饮用水', label: '婚礼派对采购人', summary: '对包装、桌面呈现和宾客感知敏感，重视品牌是否提升整体氛围。', count: 3, coreCount: 0, ageMin: 27, ageMax: 38, cityKeys: ['shanghai', 'xiamen', 'chengdu'], occupations: ['婚礼策划师', '活动主理人', '精品民宿店长'], selfIdentity: '习惯把细节做成体验的一部分', focus: '每个物件都应该服务整体质感', primaryNeed: '让饮用水也成为氛围的一部分', secondaryNeed: '采购和落地执行都省心', unmetNeed: '大多数水没有视觉记忆点', archetype: 'lifestyle' }),
  blueprint({ key: 'alpro-breakfast-white-collar', brandName: 'Alpro', brandCategory: '植物基', label: '轻负担早餐白领', summary: '早餐讲求快、轻、顺口，对植物基接受度高，关注状态和饱腹感。', count: 3, coreCount: 1, ageMin: 24, ageMax: 32, cityKeys: ['shanghai', 'hangzhou', 'guangzhou'], occupations: ['咨询分析师', '品牌策划', '交互设计师'], selfIdentity: '用早餐管理状态的都市白领', focus: '一天开始得轻一点，后面才稳', primaryNeed: '快速完成一顿不油不撑的早餐', secondaryNeed: '品牌要有现代感，不像功能性代餐', unmetNeed: '很多植物基产品口感和饱腹感难兼顾', archetype: 'plant' }),
  blueprint({ key: 'alpro-lactose-free', brandName: 'Alpro', brandCategory: '植物基', label: '乳糖不耐白领', summary: '把植物基视为解决方案而不是潮流，关注身体反馈和长期稳定性。', count: 3, coreCount: 1, ageMin: 25, ageMax: 35, cityKeys: ['shenzhen', 'beijing', 'wuhan'], occupations: ['程序员', '律师', '品牌运营'], selfIdentity: '不想再为了喝奶类产品冒险试错的人', focus: '身体舒服最重要', primaryNeed: '找到顺口、稳定、不折腾肠胃的替代方案', secondaryNeed: '不要被说教式地教育“为什么要植物基”', unmetNeed: '替代品常常牺牲口感或太像小众产品', archetype: 'plant' }),
  blueprint({ key: 'alpro-fitness-control', brandName: 'Alpro', brandCategory: '植物基', label: '健身控糖女性', summary: '在意早餐结构、卡路里和蛋白组合，喜欢兼顾社交分享与自律感。', count: 3, coreCount: 1, ageMin: 24, ageMax: 33, cityKeys: ['shanghai', 'shenzhen', 'xiamen'], occupations: ['瑜伽教练', '用户增长经理', '自媒体内容创作者'], selfIdentity: '把体型管理和生活方式放在一起经营的人', focus: '看得见的轻盈感和长期坚持', primaryNeed: '早餐补给不要破坏全天控糖计划', secondaryNeed: '包装、口味和拍照友好度都要在线', unmetNeed: '很多健康产品一喝就像在受苦', archetype: 'plant' }),
  blueprint({ key: 'alpro-sustainable-young', brandName: 'Alpro', brandCategory: '植物基', label: '环保生活方式青年', summary: '把植物基和可持续当作身份表达的一部分，希望品牌价值观真实可信。', count: 3, coreCount: 0, ageMin: 23, ageMax: 31, cityKeys: ['hangzhou', 'chengdu', 'kunming'], occupations: ['可持续项目专员', '独立策展人', '播客主理人'], selfIdentity: '想让消费和价值观对齐的年轻人', focus: '买的不只是产品，也是自己认同的生活方式', primaryNeed: '品牌能把可持续讲得真实、不空洞', secondaryNeed: '口味和日常便利性仍然要成立', unmetNeed: '价值观品牌很容易流于姿态', archetype: 'plant' }),
];

function offlineAudienceId(key: string): string {
  return `offline-audience-${key}`;
}

function buildOfflinePersonaName(seed: number): string {
  const surname = OFFLINE_SURNAMES[seed % OFFLINE_SURNAMES.length] ?? '林';
  const given = OFFLINE_GIVEN_NAMES[
    ((seed * 3) + Math.floor(seed / OFFLINE_SURNAMES.length) + 1) % OFFLINE_GIVEN_NAMES.length
  ] ?? '若溪';
  return `${surname}${given}`;
}

function buildOfflineGeneratedProfile(
  blueprint: OfflinePersonaBlueprint,
  personaIndex: number,
  globalIndex: number,
): Record<string, unknown> {
  const cityKey = blueprint.cityKeys[personaIndex % blueprint.cityKeys.length] ?? 'shanghai';
  const cityMeta = OFFLINE_CITY_META[cityKey] ?? OFFLINE_CITY_META.shanghai;
  const defaults = OFFLINE_ARCHETYPE_DEFAULTS[blueprint.archetype];
  const name = buildOfflinePersonaName(globalIndex);
  const age = blueprint.ageMin + ((personaIndex * 2 + globalIndex) % (blueprint.ageMax - blueprint.ageMin + 1));
  const personaTier = personaIndex < blueprint.coreCount ? 'core' : 'scaled';
  return {
    name,
    brand_name: blueprint.brandName,
    brand_category: blueprint.brandCategory,
    audience_label: blueprint.label,
    age_range: `${blueprint.ageMin}-${blueprint.ageMax} 岁`,
    persona_tier: personaTier,
    built_from: `Offline Danone Seed Pack · ${blueprint.brandName} ${blueprint.label}`,
    research_readiness: defaults.readiness,
    version_notes: `${blueprint.brandName} ${blueprint.label}离线回退画像，用于资产库和研究演示。`,
    system_prompt: `你是${name}，${age}岁，生活在${cityMeta.city}，职业是${blueprint.occupations[personaIndex % blueprint.occupations.length] ?? '白领'}，属于${blueprint.label}。你最关心的是${blueprint.primaryNeed}，做决定时会围绕${blueprint.focus}展开判断。请始终用第一人称和真实消费者口吻回答。`,
    demographics: {
      gender: blueprint.archetype === 'medical' && personaIndex % 3 === 2 ? '男' : '女',
      age,
      income: blueprint.archetype === 'medical' ? '家庭月入 2-4 万' : blueprint.archetype === 'lifestyle' ? '月入 2.5-4 万' : '月入 1.5-3 万',
      education: blueprint.archetype === 'beverage' ? '本科/大专' : '本科/硕士',
      occupation: blueprint.occupations[personaIndex % blueprint.occupations.length] ?? '白领',
    },
    geographic: {
      city: cityMeta.city,
      tier: cityMeta.tier,
      region: cityMeta.region,
      residence: `${cityMeta.city}核心居住区`,
    },
    behavioral: {
      shopping_channel: defaults.channels[globalIndex % defaults.channels.length] ?? '电商 + 线下商超',
      info_source: defaults.sources[(globalIndex + 1) % defaults.sources.length] ?? '真实评价 + 社群讨论',
      purchase_frequency: defaults.frequencies[(globalIndex + 2) % defaults.frequencies.length] ?? '按需购买',
      brand_loyalty: defaults.loyalties[(globalIndex + 3) % defaults.loyalties.length] ?? '中',
    },
    psychological: {
      core_value: blueprint.focus,
      anxiety_level: blueprint.archetype === 'medical' ? '高' : blueprint.archetype === 'maternal' ? '中高' : '中',
      decision_style: '先缩小选项，再做深比较',
      self_identity: blueprint.selfIdentity,
    },
    needs: {
      primary: blueprint.primaryNeed,
      secondary: blueprint.secondaryNeed,
      unmet: blueprint.unmetNeed,
    },
    tech_acceptance: {
      digital_literacy: defaults.digital[globalIndex % defaults.digital.length] ?? '中高',
      app_usage: defaults.apps[(globalIndex + 1) % defaults.apps.length] ?? '微信/淘宝',
      ai_attitude: defaults.ai[(globalIndex + 2) % defaults.ai.length] ?? '把 AI 当效率工具',
    },
    social_relations: {
      family_influence: defaults.family[globalIndex % defaults.family.length] ?? '主要自己决定',
      peer_influence: defaults.peer[(globalIndex + 1) % defaults.peer.length] ?? '真实口碑影响明显',
      kol_influence: defaults.kol[(globalIndex + 2) % defaults.kol.length] ?? '更信真实测评',
    },
  };
}

function createOfflineTwins(): ConsumerTwinRecord[] {
  const twins: ConsumerTwinRecord[] = [];
  let globalIndex = 0;
  for (const personaBlueprint of OFFLINE_PERSONA_BLUEPRINTS) {
    for (let personaIndex = 0; personaIndex < personaBlueprint.count; personaIndex += 1) {
      globalIndex += 1;
      const profile = buildOfflineGeneratedProfile(personaBlueprint, personaIndex, globalIndex);
      const latestVersionId = `offline-twin-version-${personaBlueprint.key}-${personaIndex + 1}`;
      twins.push({
        id: `offline-consumer-twin-${personaBlueprint.key}-${personaIndex + 1}`,
        business_purpose: `代表${personaBlueprint.brandName}的${personaBlueprint.label}，用于评估品牌概念、沟通素材与研究假设。`,
        status: 'ready',
        owner: 'Danone',
        target_audience_label: personaBlueprint.label,
        latest_version_id: latestVersionId,
        latest_version_no: 1,
        persona_profile_snapshot_json: profile,
        source_lineage: {
          source: 'offline-danone-seed-pack',
          brand_name: personaBlueprint.brandName,
          persona_tier: personaIndex < personaBlueprint.coreCount ? 'core' : 'scaled',
          default_demo: Boolean(personaBlueprint.defaultDemo && personaIndex === 0),
          inputs: [`${personaBlueprint.brandName} brand seed`, personaBlueprint.summary],
        },
      });
    }
  }
  return twins;
}

function createOfflineTwinVersions(twins: ConsumerTwinRecord[]): TwinVersionRecord[] {
  return twins.map((twin) => ({
    id: String(twin.latest_version_id),
    consumer_twin_id: twin.id,
    version_no: twin.latest_version_no ?? 1,
    persona_profile_snapshot_json: twin.persona_profile_snapshot_json ?? {},
    source_lineage: twin.source_lineage ?? {},
    target_audience_label: twin.target_audience_label ?? '',
    business_purpose: twin.business_purpose ?? '',
  }));
}

function createOfflineTargetAudiences(): TargetAudienceRecord[] {
  return OFFLINE_PERSONA_BLUEPRINTS.map((personaBlueprint) => ({
    id: offlineAudienceId(personaBlueprint.key),
    label: personaBlueprint.label,
    category: personaBlueprint.brandCategory,
    description: `${personaBlueprint.brandName}：${personaBlueprint.summary}`,
  }));
}

function createOfflineStimuli(): StimulusRecord[] {
  return [
    {
      id: 'stimulus-qingquan-plus',
      name: '清泉+',
      stimulus_type: 'concept',
      asset_manifest_id: 'asset-qingquan-plus',
      asset_name: '清泉+ 概念卡',
      description: '强调天然轻营养与日常饮用轻负担的母婴饮品概念。',
      stimulus_json: {
        promise: '清润好吸收，适合每天喝',
      },
      status: 'ready',
    },
    {
      id: 'stimulus-chuyuan',
      name: '初元优养',
      stimulus_type: 'concept',
      asset_manifest_id: 'asset-chuyuan',
      asset_name: '初元优养 概念卡',
      description: '突出营养补给与功能可信度，但表达偏专业化。',
      stimulus_json: {
        promise: '高营养、高安心感的孕产期补给方案',
      },
      status: 'ready',
    },
    {
      id: 'stimulus-anchun',
      name: '安纯',
      stimulus_type: 'concept',
      asset_manifest_id: 'asset-anchun',
      asset_name: '安纯 概念卡',
      description: '主打纯净温和，但差异化记忆点相对较弱。',
      stimulus_json: {
        promise: '纯净简单、放心入口',
      },
      status: 'ready',
    },
  ];
}

function createOfflinePersonaProfiles(twins: ConsumerTwinRecord[]): PersonaProfileRecord[] {
  return twins.map((twin) => {
    const brandName = String(twin.persona_profile_snapshot_json?.brand_name ?? '');
    const targetAudience = OFFLINE_PERSONA_BLUEPRINTS.find((personaBlueprint) => (
      personaBlueprint.label === twin.target_audience_label && personaBlueprint.brandName === brandName
    ));
    return {
      id: String(twin.latest_version_id).replace('offline-twin-version', 'offline-persona-profile'),
      label: `${brandName}·${String(twin.persona_profile_snapshot_json?.name ?? twin.target_audience_label ?? twin.id)}`,
      target_audience_id: offlineAudienceId(targetAudience?.key ?? 'unknown'),
      target_audience_label: twin.target_audience_label ?? '',
      profile_json: twin.persona_profile_snapshot_json ?? {},
    };
  });
}

function buildOfflineArtifacts(mode: 'draft' | 'midrun' | 'completed' | 'rerun'): ArtifactSummary[] {
  if (mode === 'draft') {
    return [];
  }

  const qualArtifact: ArtifactSummary = {
    id: `artifact-${mode}-qual`,
    artifact_type: 'qual_transcript',
    format: 'json',
    status: 'ready',
    created_at: '2026-04-13T09:05:00+08:00',
    manifest: {
      themes: {
        themes: ['情绪安全感', '日常饮用适配度'],
        overall_insight: '清泉+ 更容易建立“轻营养、低负担”的第一印象。',
        per_stimulus: [
          {
            stimulus_name: '清泉+',
            themes: ['情绪安全感', '日常饮用适配度'],
            summary: '被理解为更适合长期饮用的稳妥选项。',
          },
          {
            stimulus_name: '初元优养',
            themes: ['强化营养感', '医疗化门槛', '信任分化'],
            summary: '"优养"会让人联想到功能更完整的营养补充，但专业感让部分人群产生距离。',
          },
          {
            stimulus_name: '安纯',
            themes: ['低风险安全感', '缺乏记忆点', '功能表达不足'],
            summary: '名称本身不让人反感，但也缺乏主动选择的理由。',
          },
        ],
      },
      interviews: [
        { audience: '孕期女性' },
        { audience: '新手妈妈' },
      ],
    },
  };

  if (mode === 'midrun') {
    return [qualArtifact];
  }

  const quantArtifact: ArtifactSummary = {
    id: `artifact-${mode}-quant`,
    artifact_type: 'quant_ranking',
    format: 'json',
    status: 'ready',
    created_at: '2026-04-13T09:18:00+08:00',
    manifest: {
      ranking: [
        {
          stimulus_name: '清泉+',
          score: 74,
          confidence: 'high',
          confidence_label: '82 / 高',
          rationale: '综合吸引力最高，表达更轻盈。',
        },
        {
          stimulus_name: '初元优养',
          score: 61,
          confidence: 'medium',
          confidence_label: '71 / 中',
          rationale: '营养感较强，但专业感偏重。',
        },
        {
          stimulus_name: '安纯',
          score: 54,
          confidence: 'medium',
          confidence_label: '66 / 中',
          rationale: '安心感明确，但记忆点不足。',
        },
      ],
    },
  };

  const recommendationArtifact: ArtifactSummary = {
    id: `artifact-${mode}-recommendation`,
    artifact_type: 'recommendation',
    format: 'json',
    status: 'ready',
    created_at: '2026-04-13T09:26:00+08:00',
    manifest: {
      winner: '清泉+',
      confidence_label: '82 / 高',
      next_action: mode === 'rerun' ? '补充真实用户样本后再做一次验证' : '进入真实消费者验证',
      supporting_text:
        mode === 'rerun'
          ? '当前排序虽有方向，但新增样本可能改变“安纯”的表现，需要补数后再决策。'
          : '清泉+ 在两个核心人群里都更容易建立“可信赖、无负担”的认知。',
      segment_differences: [
        {
          segment: '孕期女性',
          preference: '清泉+',
          reason: '更符合天然、轻负担的期待',
        },
      ],
    },
  };

  if (mode === 'rerun') {
    return [qualArtifact, quantArtifact, recommendationArtifact];
  }

  return [
    qualArtifact,
    quantArtifact,
    recommendationArtifact,
    {
      id: `artifact-${mode}-report`,
      artifact_type: 'report',
      format: 'pdf',
      status: 'ready',
      created_at: '2026-04-13T09:30:00+08:00',
      manifest: {
        title: 'MirrorWorld 离线演示报告',
      },
    },
  ];
}

function buildOfflineRun(
  studyId: string,
  versionId: string,
  status: string | null,
  updatedAt: string,
): RunSummary | null {
  if (!status) {
    return null;
  }

  const stepsByStatus: Record<string, RunStepSummary[]> = {
    running: [
      { step_type: 'twin_preparation', status: 'succeeded' },
      { step_type: 'qual_execution', status: 'running' },
    ],
    awaiting_midrun_approval: [
      { step_type: 'twin_preparation', status: 'succeeded' },
      { step_type: 'qual_execution', status: 'succeeded' },
      { step_type: 'midrun_review', status: 'running' },
    ],
    succeeded: [
      { step_type: 'twin_preparation', status: 'succeeded' },
      { step_type: 'qual_execution', status: 'succeeded' },
      { step_type: 'midrun_review', status: 'succeeded' },
      { step_type: 'quant_execution', status: 'succeeded' },
      { step_type: 'recommendation', status: 'succeeded' },
    ],
    failed: [
      { step_type: 'twin_preparation', status: 'succeeded' },
      { step_type: 'qual_execution', status: 'succeeded' },
      { step_type: 'quant_execution', status: 'succeeded' },
      { step_type: 'recommendation', status: 'failed' },
    ],
  };

  const steps = stepsByStatus[status] ?? [];
  return {
    id: `run-${studyId}`,
    study_plan_version_id: versionId,
    status,
    workflow_id: `workflow-${studyId}`,
    workflow_run_id: `runtime-${studyId}`,
    step_count: steps.length,
    approval_status: status === 'awaiting_midrun_approval' ? 'requested' : 'approved',
    steps,
    created_at: '2026-04-13T08:50:00+08:00',
    updated_at: updatedAt,
  };
}

function syncOfflineProjection(projection: StudyDetailProjection): StudyDetailProjection {
  projection.planning = {
    plan_id: projection.plan.id,
    draft_status: projection.plan.draft_status,
    current_execution_version_id: projection.plan.current_execution_version_id,
    latest_plan_version: projection.latest_plan_version,
    versions: projection.latest_plan_version ? [projection.latest_plan_version] : [],
    approval_history: projection.planning?.approval_history ?? [],
  };
  projection.execution = {
    current_run: projection.current_run,
    recent_runs: projection.recent_runs,
    cost_summary: projection.cost_summary ?? {},
  };
  projection.assets = {
    twins: projection.twins ?? [],
    stimuli: projection.stimuli ?? [],
  };
  projection.summary = {
    total_plan_versions: projection.latest_plan_version ? 1 : 0,
    total_runs: projection.recent_runs.length,
    approved_plan_versions: projection.latest_plan_version?.approval_status === 'approved' ? 1 : 0,
  };
  return projection;
}

function buildOfflineProjection(config: {
  id: string;
  businessQuestion: string;
  status: string;
  runStatus: string | null;
  createdAt: string;
  updatedAt: string;
  mode: 'draft' | 'midrun' | 'completed' | 'rerun';
  twinIds?: string[];
  stimulusIds?: string[];
  approvalStatus?: string;
  generatedBy?: string;
  availableTwins?: ConsumerTwinRecord[];
  availableStimuli?: StimulusRecord[];
}): StudyDetailProjection {
  const twins = (config.availableTwins ?? createOfflineTwins()).filter((twin) => (
    config.twinIds?.includes(String(twin.latest_version_id)) ?? true
  ));
  const stimuli = (config.availableStimuli ?? createOfflineStimuli()).filter((stimulus) => (
    config.stimulusIds?.includes(stimulus.id) ?? true
  ));
  const targetGroups = [...new Set(
    twins
      .map((twin) => twin.target_audience_label)
      .filter((item): item is string => Boolean(item)),
  )];
  const versionId = `plan-version-${config.id}`;
  const plan: PlanPlanSnapshot = {
    id: `plan-${config.id}`,
    draft_status: config.approvalStatus ?? (config.mode === 'draft' ? 'draft' : 'approved'),
    current_draft_version_id: versionId,
    latest_approved_version_id: config.mode === 'draft' ? null : versionId,
    current_execution_version_id: config.mode === 'draft' ? null : versionId,
  };
  const latestPlanVersion: PlanVersionSummary = {
    id: versionId,
    version_no: 1,
    approval_status: config.approvalStatus ?? (config.mode === 'draft' ? 'draft' : 'approved'),
    status: config.mode === 'draft' ? 'draft' : 'active',
    approval_required: true,
    generated_by: config.generatedBy ?? DEFAULT_ACTOR,
    estimated_cost: config.mode === 'draft' ? '58.00' : '88.50',
    stimulus_count: stimuli.length,
    twin_count: twins.length,
    stimulus_ids: stimuli.map((stimulus) => stimulus.id),
    twin_version_ids: twins.map((twin) => String(twin.latest_version_id)),
    created_at: config.createdAt,
  };
  const currentRun = buildOfflineRun(config.id, versionId, config.runStatus, config.updatedAt);
  const recentRuns = currentRun ? [currentRun] : [];
  const approvalGates: ApprovalGateSummary[] = [
    {
      id: `approval-${config.id}`,
      scope_type: 'study_plan_version',
      approval_type: 'plan',
      status: latestPlanVersion.approval_status === 'approved' ? 'approved' : 'pending',
      approved_by: latestPlanVersion.approval_status === 'approved' ? DEFAULT_ACTOR : null,
      decision_comment: latestPlanVersion.approval_status === 'approved' ? 'Offline demo approved' : null,
      created_at: config.createdAt,
      updated_at: config.updatedAt,
    },
  ];

  return syncOfflineProjection({
    study: {
      id: config.id,
      business_question: config.businessQuestion,
      study_type: OFFLINE_STUDY_TYPE,
      brand: OFFLINE_BRAND,
      category: OFFLINE_CATEGORY,
      target_groups: targetGroups.length > 0 ? targetGroups : OFFLINE_TARGET_GROUPS,
      status: config.status,
    },
    plan,
    latest_plan_version: latestPlanVersion,
    current_run: currentRun,
    recent_runs: recentRuns,
    artifacts: buildOfflineArtifacts(config.mode),
    approval_gates: approvalGates,
    twins,
    stimuli,
    cost_summary: {
      estimated_cost: latestPlanVersion.estimated_cost ?? null,
      actual_cost: config.mode === 'completed' ? '23.10' : null,
      total_prompt_tokens: config.mode === 'completed' ? 3210 : 0,
      total_completion_tokens: config.mode === 'completed' ? 1888 : 0,
      usage_by_model: [],
    },
    summary: {
      total_plan_versions: 1,
      total_runs: recentRuns.length,
      approved_plan_versions: latestPlanVersion.approval_status === 'approved' ? 1 : 0,
    },
    planning: {
      plan_id: plan.id,
      draft_status: plan.draft_status,
      current_execution_version_id: plan.current_execution_version_id,
      latest_plan_version: latestPlanVersion,
      versions: [latestPlanVersion],
      approval_history: [],
    },
    execution: {
      current_run: currentRun,
      recent_runs: recentRuns,
      cost_summary: {
        estimated_cost: latestPlanVersion.estimated_cost ?? null,
        actual_cost: config.mode === 'completed' ? '23.10' : null,
        total_prompt_tokens: config.mode === 'completed' ? 3210 : 0,
        total_completion_tokens: config.mode === 'completed' ? 1888 : 0,
        usage_by_model: [],
      },
    },
    insights: {
      qual: {},
      quant: {},
      recommendation: {},
      replay: {},
      confidence: {},
    },
    assets: {
      twins,
      stimuli,
    },
  });
}

function buildOfflineMemories(studyId: string, studyQuestion: string): StudyMemoryRecord[] {
  return [
    {
      id: `memory-${studyId}-1`,
      study_id: studyId,
      memory_type: 'theme',
      key: 'emotion',
      value: '孕期与新手妈妈都优先选择“看起来更轻负担”的表达。',
      confidence: 0.84,
      extracted_at: '2026-04-13T09:20:00+08:00',
      study_question: studyQuestion,
    },
    {
      id: `memory-${studyId}-2`,
      study_id: studyId,
      memory_type: 'insight',
      key: 'winner',
      value: '清泉+ 更容易在第一眼建立“可信赖又不厚重”的印象。',
      confidence: 0.8,
      extracted_at: '2026-04-13T09:24:00+08:00',
      study_question: studyQuestion,
    },
  ];
}

function createOfflineRuntimeState(): OfflineRuntimeState {
  const twins = createOfflineTwins();
  const twinVersions = createOfflineTwinVersions(twins);
  const targetAudiences = createOfflineTargetAudiences();
  const stimuli = createOfflineStimuli();
  const personaProfiles = createOfflinePersonaProfiles(twins);
  const defaultTwinIds = ['精研配方新手妈妈', '孕晚期精养妈妈']
    .flatMap((audienceLabel) => {
      const match = twins.find((twin) => (
        twin.target_audience_label === audienceLabel
        && twin.persona_profile_snapshot_json?.persona_tier === 'core'
      ));
      return match?.latest_version_id ? [String(match.latest_version_id)] : [];
    });
  const studies = {
    [OFFLINE_STUDY_IDS.midrun]: buildOfflineProjection({
      id: OFFLINE_STUDY_IDS.midrun,
      businessQuestion: '当前计划是否足以支持孕期饮品概念的下一阶段验证？',
      status: 'running',
      runStatus: 'awaiting_midrun_approval',
      createdAt: '2026-04-13T08:30:00+08:00',
      updatedAt: '2026-04-13T09:12:00+08:00',
      mode: 'midrun',
      twinIds: defaultTwinIds,
      availableTwins: twins,
      availableStimuli: stimuli,
    }),
    [OFFLINE_STUDY_IDS.completed]: buildOfflineProjection({
      id: OFFLINE_STUDY_IDS.completed,
      businessQuestion: OFFLINE_DEFAULT_QUESTION,
      status: 'completed',
      runStatus: 'succeeded',
      createdAt: '2026-04-12T16:00:00+08:00',
      updatedAt: '2026-04-12T18:30:00+08:00',
      mode: 'completed',
      twinIds: defaultTwinIds,
      availableTwins: twins,
      availableStimuli: stimuli,
    }),
    [OFFLINE_STUDY_IDS.rerun]: buildOfflineProjection({
      id: OFFLINE_STUDY_IDS.rerun,
      businessQuestion: '现有证据是否支持继续推进“安纯”概念？',
      status: 'rerun_suggested',
      runStatus: 'failed',
      createdAt: '2026-04-11T14:00:00+08:00',
      updatedAt: '2026-04-11T16:40:00+08:00',
      mode: 'rerun',
      twinIds: defaultTwinIds,
      availableTwins: twins,
      availableStimuli: stimuli,
    }),
  } satisfies Record<string, StudyDetailProjection>;

  return {
    studies,
    twins,
    twinVersions,
    targetAudiences,
    personaProfiles,
    stimuli,
    ingestionJobs: [
      {
        id: 'ingestion-job-demo-001',
        asset_manifest_id: 'asset-qingquan-plus',
        status: 'completed',
        job_type: 'seed_import',
      },
    ],
    datasetMappings: [
      {
        id: 'dataset-mapping-demo-001',
        asset_manifest_id: 'asset-qingquan-plus',
        mapping_status: 'completed',
      },
    ],
    benchmarkPacks: [
      { id: 'benchmark-pack-demo-001', name: 'Maternal Beverage Benchmark v4' },
    ],
    calibrationRuns: [
      { id: 'calibration-run-demo-001', status: 'completed' },
    ],
    confidenceSnapshots: [
      { id: 'confidence-demo-001', label: '清泉+ / 82 分 / 高信心' },
    ],
    driftAlerts: [
      { id: 'drift-demo-001', label: '本周无显著漂移' },
    ],
    memories: Object.fromEntries(
      Object.values(studies).map((study) => [
        study.study.id,
        buildOfflineMemories(
          study.study.id,
          String(study.study.business_question ?? OFFLINE_DEFAULT_QUESTION),
        ),
      ]),
    ),
    agentMessages: {},
  };
}

const offlineRuntime = createOfflineRuntimeState();

function listOfflineStudies(): StudyListItem[] {
  return Object.values(offlineRuntime.studies)
    .sort((left, right) => {
      const leftKey = left.current_run?.updated_at ?? left.latest_plan_version?.created_at ?? '';
      const rightKey = right.current_run?.updated_at ?? right.latest_plan_version?.created_at ?? '';
      return leftKey < rightKey ? 1 : -1;
    })
    .map((projection) => ({
      id: projection.study.id,
      business_question: projection.study.business_question,
      study_type: projection.study.study_type,
      brand: projection.study.brand,
      category: projection.study.category,
      target_groups: projection.study.target_groups,
      status: projection.study.status,
      current_execution_version_id: projection.plan.current_execution_version_id,
      latest_plan_version_no: projection.latest_plan_version?.version_no,
      current_run_status: projection.current_run?.status,
    }));
}

export function getOfflineDashboardSnapshot(): DashboardSnapshot {
  return {
    studies: listOfflineStudies(),
    twins: cloneValue(offlineRuntime.twins),
    stimuli: cloneValue(offlineRuntime.stimuli),
    jobs: cloneValue(offlineRuntime.ingestionJobs),
  };
}

export function getOfflineStudiesSnapshot(): StudyListItem[] {
  return listOfflineStudies();
}

function buildSeedAssetPack(): SeedAssetPack {
  return {
    target_audiences: offlineRuntime.targetAudiences.map((audience) => ({
      id: audience.id,
      label: audience.label,
    })),
    twin_versions: offlineRuntime.twinVersions.map((version) => ({
      id: version.id,
      name: String(version.persona_profile_snapshot_json?.name ?? version.target_audience_label ?? version.id),
      version_no: version.version_no ?? 1,
      target_audience_label: version.target_audience_label ?? undefined,
      brand_name: typeof version.persona_profile_snapshot_json?.brand_name === 'string'
        ? version.persona_profile_snapshot_json.brand_name
        : undefined,
      persona_tier: typeof version.persona_profile_snapshot_json?.persona_tier === 'string'
        ? version.persona_profile_snapshot_json.persona_tier
        : undefined,
      default_demo: Boolean(version.source_lineage?.default_demo),
    })),
    stimuli: offlineRuntime.stimuli.map((stimulus) => ({
      id: stimulus.id,
      name: stimulus.name,
      stimulus_type: stimulus.stimulus_type ?? 'concept',
    })),
  };
}

function ensureOfflineProjection(studyId: string): StudyDetailProjection {
  if (!offlineRuntime.studies[studyId]) {
    offlineRuntime.studies[studyId] = buildOfflineProjection({
      id: studyId,
      businessQuestion: '离线演示研究',
      status: 'planning',
      runStatus: null,
      createdAt: '2026-04-13T10:00:00+08:00',
      updatedAt: '2026-04-13T10:00:00+08:00',
      mode: 'draft',
    });
    offlineRuntime.memories[studyId] = buildOfflineMemories(studyId, '离线演示研究');
  }
  return offlineRuntime.studies[studyId];
}

function parseJsonBody(init: RequestInit): Record<string, unknown> {
  if (typeof init.body !== 'string') {
    return {};
  }
  try {
    return JSON.parse(init.body) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

function queueOfflineAgentMessage(
  studyId: string,
  content: string,
  messageType: AgentMessage['message_type'] = 'text',
  metadata: Record<string, unknown> = {},
): AgentMessage {
  const message: AgentMessage = {
    id: nextOfflineId('agent-message'),
    study_id: studyId,
    role: 'agent',
    content,
    message_type: messageType,
    metadata_json: metadata,
    created_at: new Date().toISOString(),
  };
  const queue = offlineRuntime.agentMessages[studyId] ?? [];
  queue.push(message);
  offlineRuntime.agentMessages[studyId] = queue;
  return message;
}

function createOfflineStudyBundle(payload: Record<string, unknown>): StudyBundleResponse {
  const id = nextOfflineId('study');
  const twinVersionIds = toStringArray(payload.twin_version_ids);
  const stimulusIds = toStringArray(payload.stimulus_ids);
  const projection = buildOfflineProjection({
    id,
    businessQuestion: String(payload.business_question ?? OFFLINE_DEFAULT_QUESTION),
    status: 'planning',
    runStatus: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    mode: 'draft',
    twinIds: twinVersionIds.length > 0 ? twinVersionIds : undefined,
    stimulusIds: stimulusIds.length > 0 ? stimulusIds : undefined,
    approvalStatus: 'draft',
    generatedBy: String(payload.generated_by ?? DEFAULT_ACTOR),
    availableTwins: offlineRuntime.twins,
    availableStimuli: offlineRuntime.stimuli,
  });
  if (typeof payload.brand === 'string') {
    projection.study.brand = payload.brand;
  }
  offlineRuntime.studies[id] = projection;
  offlineRuntime.memories[id] = buildOfflineMemories(id, String(projection.study.business_question ?? OFFLINE_DEFAULT_QUESTION));
  offlineRuntime.agentMessages[id] = [];

  return {
    study: cloneValue(projection.study),
    study_plan: cloneValue(projection.plan),
    study_plan_version: cloneValue(projection.latest_plan_version as PlanVersionSummary),
  };
}

function createOfflinePersona(text: string, audienceLabel: string): GeneratePersonaResult {
  const targetAudience = offlineRuntime.targetAudiences.find((item) => item.label === audienceLabel)
    ?? {
      id: nextOfflineId('audience'),
      label: audienceLabel,
      category: '自定义',
      description: '用户在离线演示模式下临时创建的目标人群。',
    };
  if (!offlineRuntime.targetAudiences.find((item) => item.id === targetAudience.id)) {
    offlineRuntime.targetAudiences.push(targetAudience);
  }

  const consumerTwinId = nextOfflineId('consumer-twin');
  const twinVersionId = nextOfflineId('twin-version');
  const personaProfileId = nextOfflineId('persona-profile');
  const name = `${audienceLabel} Persona ${offlineRuntime.twins.length + 1}`;
  const profile = {
    name,
    brand_name: '自定义品牌',
    brand_category: 'User Generated',
    audience_label: audienceLabel,
    age_range: '25-35 岁',
    persona_tier: 'generated',
    built_from: 'Offline Demo Generation',
    research_readiness: ['概念筛选', '命名测试'],
    version_notes: `基于离线输入文本为 ${audienceLabel} 自动生成。`,
    system_prompt: `你是${name}，属于${audienceLabel}。请根据输入内容用第一人称回答，像真实消费者一样表达。`,
    demographics: {
      gender: '未知',
      age: 30,
      income: '中等收入',
      education: '本科',
      occupation: '线上演示生成',
    },
    geographic: {
      city: '线上演示',
      tier: '虚拟场景',
      region: '线上',
      residence: '离线演示环境',
    },
    behavioral: {
      shopping_channel: '电商 + 线下商超',
      info_source: '输入文本摘要',
      purchase_frequency: '按需购买',
      brand_loyalty: '中',
    },
    psychological: {
      core_value: text.slice(0, 24) || '对可信赖、无负担表达更敏感',
      anxiety_level: '中',
      decision_style: '先看安全感，再看功能收益',
      self_identity: '离线生成 Persona',
    },
    needs: {
      primary: '可信赖的产品表达',
      secondary: '降低判断成本',
      unmet: '缺少更具体的证据说明',
    },
    tech_acceptance: {
      digital_literacy: '中高',
      app_usage: '微信/电商平台',
      ai_attitude: '愿意尝试，但需要人工确认',
    },
    social_relations: {
      family_influence: '家庭与社群都会参考',
      peer_influence: '真实口碑会显著影响选择',
      kol_influence: '会看博主和真实测评',
    },
  };

  const twin: ConsumerTwinRecord = {
    id: consumerTwinId,
    business_purpose: `根据输入文本为 ${audienceLabel} 自动生成的离线演示 Persona。`,
    status: 'ready',
    owner: DEFAULT_ACTOR,
    target_audience_label: audienceLabel,
    latest_version_id: twinVersionId,
    latest_version_no: 1,
    persona_profile_snapshot_json: profile,
    source_lineage: {
      source: 'offline-demo-generation',
      text_preview: text.slice(0, 80),
    },
  };

  offlineRuntime.twins.unshift(twin);
  offlineRuntime.twinVersions.unshift({
    id: twinVersionId,
    consumer_twin_id: consumerTwinId,
    version_no: 1,
    persona_profile_snapshot_json: profile,
    source_lineage: twin.source_lineage ?? {},
    target_audience_label: audienceLabel,
    business_purpose: twin.business_purpose,
  });
  offlineRuntime.personaProfiles.unshift({
    id: personaProfileId,
    label: name,
    target_audience_id: targetAudience.id,
    target_audience_label: audienceLabel,
    profile_json: profile,
  });

  return {
    target_audience_id: targetAudience.id,
    persona_profile_id: personaProfileId,
    consumer_twin_id: consumerTwinId,
    twin_version_id: twinVersionId,
    name,
    audience_label: audienceLabel,
    profile,
  };
}

function resolveOfflineRequest<T>(path: string, init: RequestInit): T | undefined {
  const method = (init.method ?? 'GET').toUpperCase();
  const [pathname, queryString = ''] = path.split('?');
  const studyDetailMatch = pathname.match(/^\/studies\/([^/]+)\/detail$/);
  if (method === 'GET' && pathname === '/studies') {
    return cloneValue(listOfflineStudies()) as T;
  }
  if (method === 'GET' && studyDetailMatch) {
    const studyId = decodeURIComponent(studyDetailMatch[1] ?? '');
    return cloneValue(ensureOfflineProjection(studyId)) as T;
  }
  if (method === 'POST' && pathname === '/bootstrap/seed-assets') {
    return cloneValue(buildSeedAssetPack()) as T;
  }
  if (method === 'GET' && pathname === '/consumer-twins') {
    return cloneValue(offlineRuntime.twins) as T;
  }
  if (method === 'GET' && pathname === '/target-audiences') {
    return cloneValue(offlineRuntime.targetAudiences) as T;
  }
  if (method === 'GET' && pathname === '/persona-profiles') {
    return cloneValue(offlineRuntime.personaProfiles) as T;
  }
  if (method === 'GET' && pathname === '/twin-versions') {
    return cloneValue(offlineRuntime.twinVersions) as T;
  }
  if (method === 'GET' && pathname === '/stimuli') {
    return cloneValue(offlineRuntime.stimuli) as T;
  }
  if (method === 'POST' && pathname === '/assets/import') {
    const payload = parseJsonBody(init);
    const assetId = nextOfflineId('asset');
    const jobId = nextOfflineId('ingestion-job');
    const mappingId = nextOfflineId('dataset-mapping');
    const stimulus: StimulusRecord = {
      id: nextOfflineId('stimulus'),
      name: String(payload.name ?? '新刺激物'),
      stimulus_type: String((payload.metadata as Record<string, unknown> | undefined)?.stimulus_type ?? 'concept'),
      asset_manifest_id: assetId,
      asset_name: String(payload.name ?? '新刺激物'),
      description: String((payload.metadata as Record<string, unknown> | undefined)?.description ?? '离线演示导入资产'),
      status: 'ready',
    };
    offlineRuntime.stimuli.unshift(stimulus);
    offlineRuntime.ingestionJobs.unshift({
      id: jobId,
      asset_manifest_id: assetId,
      status: 'completed',
      job_type: 'manual_import',
    });
    offlineRuntime.datasetMappings.unshift({
      id: mappingId,
      asset_manifest_id: assetId,
      mapping_status: 'completed',
    });
    return {
      asset: {
        id: assetId,
        asset_kind: String(payload.asset_kind ?? 'stimulus_asset'),
        source_format: String(payload.source_format ?? 'json'),
        name: String(payload.name ?? '新刺激物'),
      },
      job: {
        id: jobId,
        status: 'completed',
      },
      dataset_mapping: {
        id: mappingId,
        mapping_status: 'completed',
      },
      stimulus,
    } as T;
  }
  if (method === 'GET' && pathname === '/ingestion/jobs') {
    return cloneValue(offlineRuntime.ingestionJobs) as T;
  }
  if (method === 'GET' && pathname === '/datasets/mappings') {
    return cloneValue(offlineRuntime.datasetMappings) as T;
  }
  if (method === 'GET' && pathname === '/benchmark-packs') {
    return cloneValue(offlineRuntime.benchmarkPacks) as T;
  }
  if (method === 'GET' && pathname === '/calibration-runs') {
    return cloneValue(offlineRuntime.calibrationRuns) as T;
  }
  if (method === 'GET' && pathname === '/confidence-snapshots') {
    return cloneValue(offlineRuntime.confidenceSnapshots) as T;
  }
  if (method === 'GET' && pathname === '/drift-alerts') {
    return cloneValue(offlineRuntime.driftAlerts) as T;
  }
  if (method === 'GET' && pathname === '/memories') {
    return cloneValue(Object.values(offlineRuntime.memories).flat()) as T;
  }
  const studyMemoriesMatch = pathname.match(/^\/studies\/([^/]+)\/memories$/);
  if (method === 'GET' && studyMemoriesMatch) {
    const studyId = decodeURIComponent(studyMemoriesMatch[1] ?? '');
    return cloneValue(offlineRuntime.memories[studyId] ?? []) as T;
  }
  if (method === 'POST' && pathname === '/studies') {
    return createOfflineStudyBundle(parseJsonBody(init)) as T;
  }
  const podcastMatch = pathname.match(/^\/studies\/([^/]+)\/podcast$/);
  if (method === 'POST' && podcastMatch) {
    const studyId = decodeURIComponent(podcastMatch[1] ?? '');
    return {
      study_id: studyId,
      script: '欢迎收听 MirrorWorld 离线演示播报。本轮研究显示，清泉+ 在目标人群中更容易建立轻营养与无负担的感知。',
      duration_estimate: '02:30',
      format: 'podcast_script',
    } as T;
  }
  const submitMatch = pathname.match(/^\/studies\/([^/]+)\/plan-versions\/([^/]+)\/submit$/);
  if (method === 'POST' && submitMatch) {
    const studyId = decodeURIComponent(submitMatch[1] ?? '');
    const projection = ensureOfflineProjection(studyId);
    if (projection.latest_plan_version) {
      projection.latest_plan_version.approval_status = 'pending_approval';
    }
    projection.plan.draft_status = 'pending_approval';
    syncOfflineProjection(projection);
    return { status: 'requested' } as T;
  }
  const approveMatch = pathname.match(/^\/studies\/([^/]+)\/plan-versions\/([^/]+)\/approve$/);
  if (method === 'POST' && approveMatch) {
    const studyId = decodeURIComponent(approveMatch[1] ?? '');
    const versionId = decodeURIComponent(approveMatch[2] ?? '');
    const projection = ensureOfflineProjection(studyId);
    if (projection.latest_plan_version && projection.latest_plan_version.id === versionId) {
      projection.latest_plan_version.approval_status = 'approved';
      projection.plan.latest_approved_version_id = versionId;
      projection.plan.current_execution_version_id = versionId;
      projection.plan.draft_status = 'approved';
      syncOfflineProjection(projection);
      return cloneValue(projection.latest_plan_version) as T;
    }
  }
  const startRunMatch = pathname.match(/^\/studies\/([^/]+)\/runs$/);
  if (method === 'POST' && startRunMatch) {
    const studyId = decodeURIComponent(startRunMatch[1] ?? '');
    const payload = parseJsonBody(init);
    const projection = ensureOfflineProjection(studyId);
    const versionId = String(payload.study_plan_version_id ?? projection.latest_plan_version?.id ?? '');
    const run = buildOfflineRun(studyId, versionId, 'running', new Date().toISOString());
    projection.current_run = run;
    projection.recent_runs = run ? [run] : [];
    projection.study.status = 'running';
    projection.plan.current_execution_version_id = versionId;
    syncOfflineProjection(projection);
    queueOfflineAgentMessage(studyId, '离线演示模式：研究已启动，正在生成定性访谈与定量排序结果。', 'progress');
    return cloneValue(run as RunSummary) as T;
  }
  const resumeMatch = pathname.match(/^\/studies\/([^/]+)\/runs\/([^/]+)\/resume$/);
  if (method === 'POST' && resumeMatch) {
    const studyId = decodeURIComponent(resumeMatch[1] ?? '');
    const projection = ensureOfflineProjection(studyId);
    const status = projection.current_run?.status === 'awaiting_midrun_approval' ? 'running' : 'awaiting_midrun_approval';
    const versionId = projection.current_run?.study_plan_version_id ?? projection.latest_plan_version?.id ?? '';
    const run = buildOfflineRun(studyId, versionId, status, new Date().toISOString());
    projection.current_run = run;
    projection.recent_runs = run ? [run] : [];
    projection.study.status = status === 'running' ? 'running' : projection.study.status;
    syncOfflineProjection(projection);
    return cloneValue(run as RunSummary) as T;
  }
  const studyChatMatch = pathname.match(/^\/studies\/([^/]+)\/chat$/);
  if (method === 'POST' && studyChatMatch) {
    const payload = parseJsonBody(init);
    return {
      reply: `离线演示模式已收到你的问题：“${String(payload.message ?? '')}”。建议先查看右侧结果面板，再决定是否进入真实消费者验证。`,
    } as T;
  }
  const agentMessagesMatch = pathname.match(/^\/studies\/([^/]+)\/agent\/messages$/);
  if (method === 'GET' && agentMessagesMatch) {
    const studyId = decodeURIComponent(agentMessagesMatch[1] ?? '');
    const params = new URLSearchParams(queryString);
    const afterId = params.get('after');
    const queue = offlineRuntime.agentMessages[studyId] ?? [];
    if (!afterId) {
      return { messages: cloneValue(queue) } as T;
    }
    const index = queue.findIndex((message) => message.id === afterId);
    return { messages: cloneValue(index >= 0 ? queue.slice(index + 1) : queue) } as T;
  }
  const agentReplyMatch = pathname.match(/^\/studies\/([^/]+)\/agent\/reply$/);
  if (method === 'POST' && agentReplyMatch) {
    const studyId = decodeURIComponent(agentReplyMatch[1] ?? '');
    const payload = parseJsonBody(init);
    const action = String(payload.action_label ?? payload.action ?? '继续');
    const reply = action.includes('审批') || action.includes('批准')
      ? '离线演示模式已记录你的审批意见，研究流程将进入下一阶段。'
      : `离线演示模式已收到指令：“${action}”。建议继续查看右侧结果面板或进入证据链。`;
    queueOfflineAgentMessage(studyId, reply, 'action_response', {
      action: payload.action ?? '',
      action_label: payload.action_label ?? '',
    });
    return { status: 'accepted', reply } as T;
  }
  const agentStartMatch = pathname.match(/^\/studies\/([^/]+)\/agent\/start$/);
  if (method === 'POST' && agentStartMatch) {
    const studyId = decodeURIComponent(agentStartMatch[1] ?? '');
    const projection = ensureOfflineProjection(studyId);
    queueOfflineAgentMessage(
      studyId,
      '我已经基于当前输入生成了离线演示版研究计划。你可以先审阅方案，再决定是否启动下一阶段。',
      'progress',
    );
    return {
      status: 'started',
      plan_version_id: projection.latest_plan_version?.id,
      run_id: projection.current_run?.id,
    } as T;
  }
  if (method === 'POST' && pathname === '/persona-profiles/generate') {
    const payload = parseJsonBody(init);
    return createOfflinePersona(
      String(payload.text ?? ''),
      String(payload.audience_label ?? '目标人群'),
    ) as T;
  }
  const personaChatMatch = pathname.match(/^\/persona-profiles\/([^/]+)\/chat$/);
  if (method === 'POST' && personaChatMatch) {
    const profileId = decodeURIComponent(personaChatMatch[1] ?? '');
    const twin = offlineRuntime.twins.find((item) => String(item.latest_version_id).includes(profileId) || item.id === profileId);
    const payload = parseJsonBody(init);
    const name = String(twin?.persona_profile_snapshot_json?.name ?? twin?.target_audience_label ?? '消费者');
    return {
      reply: `我是 ${name}。离线演示模式下，我会优先关注“安全感、真实感、是否适合长期喝”。你刚才提到的是：“${String(payload.message ?? '')}”。`,
    } as T;
  }
  return undefined;
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

class RuntimeRequestTimeoutError extends Error {
  constructor() {
    super('请求超时，已切换到演示数据');
    this.name = 'RuntimeRequestTimeoutError';
  }
}

function shouldUseOfflineDemo(error: unknown): boolean {
  if (isAbortError(error)) {
    return false;
  }
  const message = error instanceof Error ? error.message : '';
  return error instanceof RuntimeRequestTimeoutError
    || error instanceof TypeError
    || /failed to fetch|fetch failed|networkerror|timed out|timeout|请求超时/i.test(message);
}

function getApiBase(): string {
  return resolveRuntimeApiBase();
}

function formatErrorMessage(response: Response): string {
  return `请求失败：${response.status} ${response.statusText}`;
}

function buildAbortError(): Error {
  try {
    return new DOMException('The operation was aborted.', 'AbortError');
  } catch {
    const error = new Error('The operation was aborted.');
    error.name = 'AbortError';
    return error;
  }
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
): Promise<Response> {
  const externalSignal = init.signal;
  if (externalSignal?.aborted) {
    throw buildAbortError();
  }

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const removeAbortListenerRef: { current?: () => void } = {};

  const fetchPromise = fetch(url, {
    ...init,
    signal: controller?.signal ?? externalSignal,
  });

  const races: Array<Promise<Response>> = [fetchPromise];

  if (externalSignal) {
    races.push(new Promise<Response>((_, reject) => {
      const onAbort = () => {
        controller?.abort(externalSignal.reason);
        reject(buildAbortError());
      };
      externalSignal.addEventListener('abort', onAbort, { once: true });
      removeAbortListenerRef.current = () => externalSignal.removeEventListener('abort', onAbort);
    }));
  }

  races.push(new Promise<Response>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new RuntimeRequestTimeoutError());
      setTimeout(() => controller?.abort(), 0);
    }, REQUEST_TIMEOUT_MS);
  }));

  try {
    return await Promise.race(races);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    removeAbortListenerRef.current?.();
  }
}

async function readErrorDetail(response: Response): Promise<string | null> {
  try {
    const payload = await response.clone().json() as { detail?: string; code?: string };
    if (typeof payload.detail === 'string' && payload.detail.trim()) {
      return payload.detail;
    }
  } catch {
    // ignore parse failures and fall back to status text
  }
  return null;
}

async function requestJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const apiBase = getApiBase();
  const headers = new Headers(init.headers ?? {});
  const activeTeamId = getActiveTeamId();
  if (activeTeamId && !headers.has('X-Team-Id')) {
    headers.set('X-Team-Id', activeTeamId);
  }
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const responseInit: RequestInit = {
    ...init,
    credentials: 'include',
  };
  if ([...headers.keys()].length > 0) {
    responseInit.headers = headers;
  }
  try {
    const response = await fetchWithTimeout(`${apiBase}${path}`, responseInit);

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        clearAuthSession();
        redirectToLogin();
        throw new Error('登录状态已失效，请重新登录后继续。');
      }
      if (response.status >= 500) {
        const offlineResponse = resolveOfflineRequest<T>(path, responseInit);
        if (offlineResponse !== undefined) {
          return offlineResponse;
        }
      }
      const detail = await readErrorDetail(response);
      throw new Error(detail ?? formatErrorMessage(response));
    }

    return (await response.json()) as T;
  } catch (error) {
    if (shouldUseOfflineDemo(error)) {
      const offlineResponse = resolveOfflineRequest<T>(path, responseInit);
      if (offlineResponse !== undefined) {
        return offlineResponse;
      }
    }
    throw error;
  }
}

async function requestText(
  path: string,
  init: RequestInit = {},
): Promise<string> {
  const apiBase = getApiBase();
  const headers = new Headers(init.headers ?? {});
  const activeTeamId = getActiveTeamId();
  if (activeTeamId && !headers.has('X-Team-Id')) {
    headers.set('X-Team-Id', activeTeamId);
  }

  const response = await fetchWithTimeout(`${apiBase}${path}`, {
    ...init,
    credentials: 'include',
    headers,
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      clearAuthSession();
      redirectToLogin();
      throw new Error('登录状态已失效，请重新登录后继续。');
    }
    const detail = await readErrorDetail(response);
    throw new Error(detail ?? formatErrorMessage(response));
  }

  return response.text();
}

export async function fetchWorkbenchProjection(
  studyId: string,
  options: { signal?: AbortSignal } = {},
): Promise<StudyDetailProjection> {
  return requestJson<StudyDetailProjection>(
    `/studies/${encodeURIComponent(studyId)}/detail`,
    { signal: options.signal },
  );
}

export async function listStudies(
  options: { signal?: AbortSignal } = {},
): Promise<StudyListItem[]> {
  return requestJson<StudyListItem[]>('/studies', { signal: options.signal });
}

export async function bootstrapSeedAssets(): Promise<SeedAssetPack> {
  return requestJson<SeedAssetPack>('/bootstrap/seed-assets', {
    method: 'POST',
  });
}

export async function listConsumerTwins(
  options: { signal?: AbortSignal } = {},
): Promise<ConsumerTwinRecord[]> {
  return requestJson<ConsumerTwinRecord[]>('/consumer-twins', { signal: options.signal });
}

export async function listTargetAudiences(
  options: { signal?: AbortSignal } = {},
): Promise<TargetAudienceRecord[]> {
  return requestJson<TargetAudienceRecord[]>('/target-audiences', { signal: options.signal });
}

export async function listPersonaProfiles(
  options: { signal?: AbortSignal } = {},
): Promise<PersonaProfileRecord[]> {
  return requestJson<PersonaProfileRecord[]>('/persona-profiles', { signal: options.signal });
}

export async function listTwinVersions(
  options: { signal?: AbortSignal } = {},
): Promise<TwinVersionRecord[]> {
  return requestJson<TwinVersionRecord[]>('/twin-versions', { signal: options.signal });
}

export async function listStimuli(
  options: { signal?: AbortSignal } = {},
): Promise<StimulusRecord[]> {
  return requestJson<StimulusRecord[]>('/stimuli', { signal: options.signal });
}

export async function importAsset(
  payload: {
    asset_kind: string;
    name: string;
    source_format: string;
    storage_uri: string;
    created_by?: string;
    metadata?: Record<string, unknown>;
    study_id?: string;
  },
): Promise<AssetImportResponse> {
  return requestJson<AssetImportResponse>('/assets/import', {
    method: 'POST',
    body: JSON.stringify({
      ...payload,
      created_by: payload.created_by ?? DEFAULT_ACTOR,
      metadata: payload.metadata ?? {},
    }),
  });
}

export async function listIngestionJobs(
  options: { signal?: AbortSignal } = {},
): Promise<IngestionJob[]> {
  return requestJson<IngestionJob[]>('/ingestion/jobs', { signal: options.signal });
}

export async function listDatasetMappings(
  options: { signal?: AbortSignal } = {},
): Promise<DatasetMapping[]> {
  return requestJson<DatasetMapping[]>('/datasets/mappings', { signal: options.signal });
}

export async function listBenchmarkPacks(
  options: { signal?: AbortSignal } = {},
): Promise<BenchmarkPack[]> {
  return requestJson<BenchmarkPack[]>('/benchmark-packs', { signal: options.signal });
}

export async function listCalibrationRuns(
  options: { signal?: AbortSignal } = {},
): Promise<CalibrationRun[]> {
  return requestJson<CalibrationRun[]>('/calibration-runs', { signal: options.signal });
}

export async function listConfidenceSnapshots(
  options: { signal?: AbortSignal } = {},
): Promise<ConfidenceSnapshot[]> {
  return requestJson<ConfidenceSnapshot[]>('/confidence-snapshots', { signal: options.signal });
}

export async function listDriftAlerts(
  options: { signal?: AbortSignal } = {},
): Promise<DriftAlert[]> {
  return requestJson<DriftAlert[]>('/drift-alerts', { signal: options.signal });
}

export async function listAllMemories(
  options: { signal?: AbortSignal } = {},
): Promise<StudyMemoryRecord[]> {
  return requestJson<StudyMemoryRecord[]>('/memories', { signal: options.signal });
}

export async function listStudyMemories(
  studyId: string,
  options: { signal?: AbortSignal } = {},
): Promise<StudyMemoryRecord[]> {
  return requestJson<StudyMemoryRecord[]>(
    `/studies/${encodeURIComponent(studyId)}/memories`,
    { signal: options.signal },
  );
}

export type PodcastResult = {
  study_id: string;
  script: string;
  duration_estimate: string;
  format: string;
};

export async function generatePodcast(
  studyId: string,
): Promise<PodcastResult> {
  return requestJson<PodcastResult>(
    `/studies/${encodeURIComponent(studyId)}/podcast`,
    { method: 'POST' },
  );
}

export async function createDemoStudy(
  actor = DEFAULT_ACTOR,
  question?: string,
  options?: {
    twinVersionIds?: string[];
    stimulusIds?: string[];
  },
): Promise<StudyBundleResponse> {
  const seedPack = await bootstrapSeedAssets();
  const curatedDefaultTwinIds = seedPack.twin_versions
    .filter((item) => item.default_demo)
    .map((item) => item.id);
  const twinVersionIds = options?.twinVersionIds?.length
    ? options.twinVersionIds
    : (curatedDefaultTwinIds.length > 0 ? curatedDefaultTwinIds : seedPack.twin_versions.map((item) => item.id));
  const stimulusIds = options?.stimulusIds?.length
    ? options.stimulusIds
    : seedPack.stimuli.map((item) => item.id);
  const selectedTargetGroups = [...new Set(
    seedPack.twin_versions
      .filter((item) => twinVersionIds.includes(item.id))
      .map((item) => item.target_audience_label)
      .filter((item): item is string => Boolean(item)),
  )];
  return requestJson<StudyBundleResponse>('/studies', {
    method: 'POST',
    body: JSON.stringify({
      business_question: question || '哪一个母婴饮品概念值得进入真实消费者验证？',
      study_type: 'concept_screening',
      brand: OFFLINE_BRAND,
      category: 'Maternal beverage',
      target_groups: selectedTargetGroups.length > 0 ? selectedTargetGroups : ['Pregnant Women', 'New Mom'],
      business_goal: {
        objective: '筛出最值得进入下一轮验证的概念',
        decision: 'winner_selection',
      },
      twin_version_ids: twinVersionIds,
      stimulus_ids: stimulusIds,
      qual_config: { mode: 'ai_idi', interviews: twinVersionIds.length * stimulusIds.length },
      quant_config: { mode: 'replica_scoring', replicas: 3 },
      generated_by: actor,
      approval_required: true,
    }),
  });
}

export async function fetchStudyReportHtml(studyId: string): Promise<string> {
  return requestText(`/studies/${encodeURIComponent(studyId)}/report`);
}

export async function submitPlanForApproval(
  studyId: string,
  versionId: string,
  _actor = DEFAULT_ACTOR,
): Promise<{ status: string }> {
  return requestJson<{ status: string }>(
    `/studies/${encodeURIComponent(studyId)}/plan-versions/${encodeURIComponent(versionId)}/submit`,
    {
      method: 'POST',
      body: JSON.stringify({}),
    },
  );
}

export async function approvePlan(
  studyId: string,
  versionId: string,
  _actor = DEFAULT_ACTOR,
  decisionComment = 'Approved from workbench',
): Promise<PlanVersionSummary> {
  return requestJson<PlanVersionSummary>(
    `/studies/${encodeURIComponent(studyId)}/plan-versions/${encodeURIComponent(versionId)}/approve`,
    {
      method: 'POST',
      body: JSON.stringify({
        decision_comment: decisionComment,
      }),
    },
  );
}

export async function startRun(
  studyId: string,
  versionId: string,
  _actor = DEFAULT_ACTOR,
): Promise<RunSummary> {
  return requestJson<RunSummary>(`/studies/${encodeURIComponent(studyId)}/runs`, {
    method: 'POST',
    body: JSON.stringify({
      study_plan_version_id: versionId,
    }),
  });
}

export async function resumeRun(
  studyId: string,
  runId: string,
  _actor = DEFAULT_ACTOR,
  decisionComment = 'Continue the study run',
  action = 'continue',
): Promise<RunSummary> {
  return requestJson<RunSummary>(
    `/studies/${encodeURIComponent(studyId)}/runs/${encodeURIComponent(runId)}/resume`,
    {
      method: 'POST',
      body: JSON.stringify({
        action,
        decision_comment: decisionComment,
      }),
    },
  );
}

export async function sendChatMessage(
  studyId: string,
  message: string,
  history?: Array<{ role: string; content: string }>,
): Promise<{ reply: string }> {
  return requestJson<{ reply: string }>(
    `/studies/${encodeURIComponent(studyId)}/chat`,
    {
      method: 'POST',
      body: JSON.stringify({ message, history: history ?? [] }),
    },
  );
}

// ---------------------------------------------------------------------------
//  Agent conversation API
// ---------------------------------------------------------------------------

export type AgentMessage = {
  id: string;
  study_id: string;
  role: 'agent' | 'user' | 'system';
  content: string;
  message_type: 'text' | 'action_request' | 'action_response' | 'progress' | 'card' | 'error';
  metadata_json: Record<string, unknown>;
  created_at: string;
};

export async function fetchAgentMessages(
  studyId: string,
  afterId?: string,
): Promise<{ messages: AgentMessage[] }> {
  const params = afterId ? `?after=${encodeURIComponent(afterId)}` : '';
  return requestJson<{ messages: AgentMessage[] }>(
    `/studies/${encodeURIComponent(studyId)}/agent/messages${params}`,
  );
}

export async function postAgentReply(
  studyId: string,
  payload: { action_id?: string; action: string; action_label?: string; comment?: string },
): Promise<{ status: string; reply?: string }> {
  return requestJson<{ status: string; reply?: string }>(
    `/studies/${encodeURIComponent(studyId)}/agent/reply`,
    {
      method: 'POST',
      body: JSON.stringify({
        action_id: payload.action_id ?? '',
        action: payload.action,
        action_label: payload.action_label,
        comment: payload.comment,
      }),
    },
  );
}

export async function startAgent(
  studyId: string,
): Promise<{ status: string; plan_version_id?: string; run_id?: string }> {
  return requestJson<{ status: string; plan_version_id?: string; run_id?: string }>(
    `/studies/${encodeURIComponent(studyId)}/agent/start`,
    { method: 'POST' },
  );
}

export type GeneratePersonaResult = {
  target_audience_id: string;
  persona_profile_id: string;
  consumer_twin_id: string;
  twin_version_id: string;
  name: string;
  audience_label: string;
  profile: Record<string, unknown>;
};

export async function generatePersona(
  text: string,
  audienceLabel: string,
): Promise<GeneratePersonaResult> {
  return requestJson<GeneratePersonaResult>('/persona-profiles/generate', {
    method: 'POST',
    body: JSON.stringify({ text, audience_label: audienceLabel }),
  });
}

export async function chatWithPersona(
  profileId: string,
  message: string,
  history: Array<{ role: string; content: string }> = [],
): Promise<{ reply: string }> {
  return requestJson<{ reply: string }>(
    `/persona-profiles/${encodeURIComponent(profileId)}/chat`,
    {
      method: 'POST',
      body: JSON.stringify({ message, history }),
    },
  );
}

export async function uploadPersonaPDF(
  file: File,
  audienceLabel: string,
): Promise<GeneratePersonaResult> {
  const apiBase = getApiBase();
  const formData = new FormData();
  formData.append('file', file);
  formData.append('audience_label', audienceLabel);
  try {
    const response = await fetch(`${apiBase}/persona-profiles/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      throw new Error(formatErrorMessage(response));
    }
    return (await response.json()) as GeneratePersonaResult;
  } catch (error) {
    if (shouldUseOfflineDemo(error)) {
      return createOfflinePersona(file.name.replace(/\.[^.]+$/, ''), audienceLabel);
    }
    throw error;
  }
}
import { resolveRuntimeApiBase } from './runtimeApiBase';
