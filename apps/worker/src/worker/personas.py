"""Pre-built twin personas and stimulus descriptions for the demo scenario."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class TwinPersona:
    id: str
    name: str
    system_prompt: str


@dataclass(frozen=True)
class StimulusDescription:
    id: str
    name: str
    description: str


# --- Twin Personas ---

TWIN_PREGNANT_WOMAN = TwinPersona(
    id="7f4a4e61-5b21-4d4e-8a4e-4f312f6b1001",
    name="孕期女性",
    system_prompt=(
        "你是一位 28 岁的孕期女性消费者，居住在上海，怀孕 6 个月。"
        "你对食品安全和营养成分非常在意，会仔细阅读产品配料表。"
        '你倾向于选择天然、无添加的饮品，对"清"和"纯"等字眼有积极联想。'
        "你的丈夫是 IT 行业从业者，家庭月收入约 3.5 万元。"
        "你平时通过小红书和孕妈群了解母婴产品信息。"
        "在回答问题时，你要表现得像真实的消费者，用口语化的方式表达，"
        "分享你的真实感受、顾虑和期待。不要使用营销术语。"
    ),
)

TWIN_NEW_MOM = TwinPersona(
    id="7f4a4e61-5b21-4d4e-8a4e-4f312f6b1002",
    name="新手妈妈",
    system_prompt=(
        "你是一位 31 岁的新手妈妈，居住在成都，宝宝 8 个月大。"
        "你正在哺乳期，对营养补充有需求，但更关注产品的口感和便携性。"
        "你比较务实，对价格敏感度中等，更看重性价比和品牌口碑。"
        "你有一个 3 岁的大宝，对母婴产品有一定的经验和判断力。"
        "你的信息来源主要是抖音和朋友推荐。"
        "在回答问题时，你要像真实消费者一样用口语表达，"
        "可以提到带娃的日常场景，表达对便携性和口感的关注。"
    ),
)

DEMO_TWINS = [TWIN_PREGNANT_WOMAN, TWIN_NEW_MOM]

# --- Stimulus Descriptions ---

STIMULUS_QINGQUAN = StimulusDescription(
    id="8f5b5f72-6c32-4e5f-9b5f-5f42307c2001",
    name="清泉+",
    description=(
        "产品概念：清泉+ 孕期营养饮品\n"
        '核心卖点：以"清"和"泉"为品牌联想，强调天然矿泉水基底 + 叶酸/DHA 精准配比。\n'
        "包装：透明瓶身，浅蓝色标签，简约清爽设计。\n"
        "价格定位：38 元/瓶（300ml），中高端定位。\n"
        "目标场景：孕期日常补充，替代普通矿泉水。"
    ),
)

STIMULUS_CHUYUAN = StimulusDescription(
    id="8f5b5f72-6c32-4e5f-9b5f-5f42307c2002",
    name="初元优养",
    description=(
        "产品概念：初元优养 母婴营养液\n"
        '核心卖点：强调"初"（初始、初心）的养育理念，添加益生菌 + 铁 + 钙三合一。\n'
        "包装：白色瓶身，粉色渐变标签，温暖感设计。\n"
        "价格定位：32 元/瓶（250ml），中端定位。\n"
        "目标场景：孕期到哺乳期全程营养补充。"
    ),
)

STIMULUS_ANCHUN = StimulusDescription(
    id="8f5b5f72-6c32-4e5f-9b5f-5f42307c2003",
    name="安纯",
    description=(
        "产品概念：安纯 有机孕妈饮\n"
        '核心卖点：有机认证 + 零添加，强调"安心"和"纯净"的品牌价值。\n'
        "包装：磨砂玻璃瓶，深绿色标签，高端有机感。\n"
        "价格定位：45 元/瓶（280ml），高端定位。\n"
        "目标场景：高端孕妈的日常营养仪式。"
    ),
)

DEMO_STIMULI = [STIMULUS_QINGQUAN, STIMULUS_CHUYUAN, STIMULUS_ANCHUN]


def get_twin_by_id(twin_id: str) -> TwinPersona | None:
    for twin in DEMO_TWINS:
        if twin.id == twin_id:
            return twin
    return None


def get_stimulus_by_id(stimulus_id: str) -> StimulusDescription | None:
    for stimulus in DEMO_STIMULI:
        if stimulus.id == stimulus_id:
            return stimulus
    return None
