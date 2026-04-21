from __future__ import annotations

from typing import Any
from uuid import NAMESPACE_URL, uuid5


def _uuid(scope: str, key: str) -> str:
    return str(uuid5(NAMESPACE_URL, f"https://aipersona.demo/{scope}/{key}"))


def _pick(values: list[str], index: int) -> str:
    return values[index % len(values)]


CITY_CATALOG: dict[str, dict[str, Any]] = {
    "shanghai": {"city": "上海", "tier": "一线", "region": "华东", "residences": ["浦东新区", "徐汇区", "静安区"]},
    "beijing": {"city": "北京", "tier": "一线", "region": "华北", "residences": ["朝阳区", "海淀区", "望京"]},
    "shenzhen": {"city": "深圳", "tier": "一线", "region": "华南", "residences": ["南山区", "福田区", "宝安区"]},
    "guangzhou": {"city": "广州", "tier": "一线", "region": "华南", "residences": ["天河区", "番禺区", "海珠区"]},
    "hangzhou": {"city": "杭州", "tier": "新一线", "region": "华东", "residences": ["滨江区", "西湖区", "余杭区"]},
    "chengdu": {"city": "成都", "tier": "新一线", "region": "西南", "residences": ["高新区", "锦江区", "双流区"]},
    "nanjing": {"city": "南京", "tier": "新一线", "region": "华东", "residences": ["建邺区", "江宁区", "鼓楼区"]},
    "wuhan": {"city": "武汉", "tier": "新一线", "region": "华中", "residences": ["武昌区", "洪山区", "光谷"]},
    "suzhou": {"city": "苏州", "tier": "新一线", "region": "华东", "residences": ["工业园区", "高新区", "相城区"]},
    "xiamen": {"city": "厦门", "tier": "新一线", "region": "华东", "residences": ["思明区", "湖里区", "集美区"]},
    "qingdao": {"city": "青岛", "tier": "新一线", "region": "华东", "residences": ["市南区", "崂山区", "黄岛区"]},
    "changsha": {"city": "长沙", "tier": "新一线", "region": "华中", "residences": ["岳麓区", "雨花区", "开福区"]},
    "kunming": {"city": "昆明", "tier": "二线", "region": "西南", "residences": ["盘龙区", "五华区", "西山区"]},
    "hefei": {"city": "合肥", "tier": "二线", "region": "华东", "residences": ["政务区", "蜀山区", "包河区"]},
    "zhengzhou": {"city": "郑州", "tier": "二线", "region": "华中", "residences": ["郑东新区", "金水区", "高新区"]},
    "foshan": {"city": "佛山", "tier": "二线", "region": "华南", "residences": ["南海区", "顺德区", "禅城区"]},
    "nantong": {"city": "南通", "tier": "三线", "region": "华东", "residences": ["崇川区", "开发区", "通州区"]},
    "luoyang": {"city": "洛阳", "tier": "三线", "region": "华中", "residences": ["洛龙区", "西工区", "涧西区"]},
    "yantai": {"city": "烟台", "tier": "三线", "region": "华东", "residences": ["芝罘区", "莱山区", "开发区"]},
    "weifang": {"city": "潍坊", "tier": "三线", "region": "华东", "residences": ["奎文区", "高新区", "坊子区"]},
}

SURNAMES = [
    "林", "周", "陈", "许", "沈", "梁", "顾", "韩", "江", "何",
    "宋", "彭", "罗", "苏", "温", "潘", "唐", "程", "叶", "曹",
]
FEMALE_GIVEN_NAMES = [
    "若溪", "以宁", "思琪", "念安", "清妍", "知夏", "子衿", "悦心", "安禾", "语桐",
    "佳澄", "沐晴", "书妍", "听澜", "可昕", "映秋", "一诺", "景宁", "舒窈", "今禾",
]
MALE_GIVEN_NAMES = [
    "景川", "明赫", "泽远", "子骞", "奕辰", "知行", "柏言", "承宇", "彦博", "晟一",
]

BRANDS: dict[str, dict[str, str]] = {
    "aptamil": {
        "label": "爱他美",
        "category": "婴幼儿配方",
        "description": "聚焦配方信任、成长营养和精细化育儿决策。",
    },
    "nutrilon": {
        "label": "诺优能",
        "category": "婴幼儿配方",
        "description": "聚焦理性比配方、荷兰来源感和跨境替代信任。",
    },
    "nutricia": {
        "label": "纽迪希亚",
        "category": "医学营养",
        "description": "聚焦术后、慢病、康复与家庭照护决策。",
    },
    "mizone": {
        "label": "脉动",
        "category": "功能饮料",
        "description": "聚焦补水、电解质、活力恢复和高频饮用场景。",
    },
    "evian": {
        "label": "依云",
        "category": "高端饮用水",
        "description": "聚焦高端生活方式、场景体面感和天然纯净认知。",
    },
    "alpro": {
        "label": "Alpro",
        "category": "植物基",
        "description": "聚焦轻负担早餐、植物基替代和生活方式表达。",
    },
}

ARCHETYPE_DEFAULTS: dict[str, dict[str, Any]] = {
    "maternal": {
        "gender_options": ["女"],
        "income_options": ["家庭月入 2-3 万", "家庭月入 3-5 万", "家庭月入 5 万+"],
        "education_options": ["本科", "硕士", "大专"],
        "shopping_channels": ["天猫国际/京东", "母婴店/山姆", "小红书种草后下单"],
        "info_sources": ["小红书 + 丁香妈妈", "妈妈群 + 儿科医生", "抖音测评 + 电商评论"],
        "purchase_frequencies": ["月度集中囤货", "按阶段补货", "大促节点囤货"],
        "brand_loyalty_options": ["中高，需要持续验证", "高，认准后不轻易换", "中，遇到更强配方会切换"],
        "anxiety_levels": ["中高", "高", "中"],
        "digital_literacy_options": ["高", "中高"],
        "app_usages": ["小红书/天猫/丁香妈妈", "抖音/京东/妈妈网", "微信社群/山姆/美团"],
        "ai_attitudes": ["愿意参考，但更信权威背书", "把 AI 当效率工具，不会完全采信"],
        "family_influences": ["伴侣与长辈共同参与", "妈妈群和儿科建议都会参考", "自己拍板，但会听医生意见"],
        "peer_influences": ["真实妈妈口碑是关键决策锚点", "身边同龄妈妈的实际反馈很重要"],
        "kol_influences": ["关注医生号和育儿博主", "会看成分党测评号与母婴 KOL"],
        "research_readiness": ["概念筛选", "命名测试", "沟通素材测试"],
        "applicable_scenarios": ["concept_screening", "message_test", "packaging_test"],
    },
    "medical": {
        "gender_options": ["女", "男"],
        "income_options": ["家庭月入 1.5-2.5 万", "家庭月入 2-4 万", "家庭月入 4 万+"],
        "education_options": ["本科", "大专", "硕士"],
        "shopping_channels": ["医院药房/电商旗舰店", "医生建议后到线下渠道购买", "社群推荐后补货"],
        "info_sources": ["医生建议 + 病友群", "康复社群 + 电商问诊", "营养师建议 + 家庭讨论"],
        "purchase_frequencies": ["按疗程补货", "按恢复阶段购买", "遇到复诊节点集中采购"],
        "brand_loyalty_options": ["高，只换医生明确建议的方案", "中高，前提是恢复效果稳定"],
        "anxiety_levels": ["高", "中高"],
        "digital_literacy_options": ["中高", "中"],
        "app_usages": ["微信/京东健康/医院小程序", "抖音搜索/病友群/美团买药"],
        "ai_attitudes": ["会拿 AI 做信息梳理，但最终听医生", "只把 AI 当检索，不会直接决定"],
        "family_influences": ["家属一起决策，照护者压力大", "医生意见优先，家庭只负责执行"],
        "peer_influences": ["病友经验能明显影响选择", "同类恢复案例会被反复比较"],
        "kol_influences": ["关注康复科普账号和营养师", "更信专业机构而不是普通博主"],
        "research_readiness": ["照护旅程访谈", "话术清晰度测试", "渠道沟通测试"],
        "applicable_scenarios": ["care_pathway_test", "message_clarity_test", "channel_script_test"],
    },
    "beverage": {
        "gender_options": ["女", "男"],
        "income_options": ["月入 8k-1.5 万", "月入 1.5-2.5 万", "月入 2.5 万+"],
        "education_options": ["本科", "大专", "硕士"],
        "shopping_channels": ["便利店/即时零售", "电商囤货 + 线下补买", "自动贩卖机/商超"],
        "info_sources": ["抖音 + 小红书", "朋友推荐 + 货架直觉", "运动博主 + 电商评论"],
        "purchase_frequencies": ["高频即买即喝", "每周补货", "运动或加班时集中购买"],
        "brand_loyalty_options": ["中，更多看场景和口感", "中低，谁更顺手就买谁", "中高，认准补水效率"],
        "anxiety_levels": ["低", "中"],
        "digital_literacy_options": ["高", "中高"],
        "app_usages": ["抖音/美团/小红书", "Keep/淘宝/京东到家", "微信/饿了么/哔哩哔哩"],
        "ai_attitudes": ["愿意拿 AI 做训练和健康建议参考", "对 AI 中性，更多看真实体验"],
        "family_influences": ["基本自己决定", "伴侣会影响囤货选择"],
        "peer_influences": ["同事和朋友的真实反馈很关键", "健身搭子和队友推荐影响大"],
        "kol_influences": ["看运动、效率、职场类博主", "对明星代言不敏感，更信真实测评"],
        "research_readiness": ["概念筛选", "场景测试", "货架文案测试"],
        "applicable_scenarios": ["concept_screening", "occasion_test", "message_test"],
    },
    "lifestyle": {
        "gender_options": ["女", "男"],
        "income_options": ["月入 1.5-2.5 万", "月入 2.5-4 万", "月入 4 万+"],
        "education_options": ["本科", "硕士"],
        "shopping_channels": ["Ole'/精品超市", "酒店/机场/便利店", "电商 + 线下商超"],
        "info_sources": ["生活方式博主 + 小红书", "朋友推荐 + 线下体验", "酒店/餐饮场景感知"],
        "purchase_frequencies": ["按场景购买", "周度补货", "差旅时高频购买"],
        "brand_loyalty_options": ["中高，认同品牌气质", "高，对稳定体验要求高"],
        "anxiety_levels": ["低", "中低"],
        "digital_literacy_options": ["高", "中高"],
        "app_usages": ["小红书/飞书/美团", "微信/携程/淘宝", "小红书/大众点评/盒马"],
        "ai_attitudes": ["愿意让 AI 帮忙做选择建议", "认为 AI 适合做效率辅助"],
        "family_influences": ["主要自己决定", "伴侣会影响家庭采购"],
        "peer_influences": ["同层级朋友的消费习惯会影响选择", "圈层认同感会强化品牌偏好"],
        "kol_influences": ["关注生活方式和酒店旅行博主", "会受高质量品牌内容影响"],
        "research_readiness": ["包装测试", "高端场景测试", "传播素材测试"],
        "applicable_scenarios": ["packaging_test", "premium_message_test", "occasion_test"],
    },
    "plant": {
        "gender_options": ["女", "男"],
        "income_options": ["月入 1-2 万", "月入 2-3 万", "月入 3 万+"],
        "education_options": ["本科", "硕士"],
        "shopping_channels": ["盒马/山姆/天猫", "精品超市 + 电商", "办公室周边便利店"],
        "info_sources": ["小红书 + 健身博主", "播客 + 生活方式 KOL", "营养科普号 + 配料表"],
        "purchase_frequencies": ["每周补货", "早餐场景高频复购", "看到新口味会尝试"],
        "brand_loyalty_options": ["中高，认同植物基理念", "中，看口感和负担感是否平衡"],
        "anxiety_levels": ["低", "中"],
        "digital_literacy_options": ["高", "中高"],
        "app_usages": ["小红书/Keep/盒马", "支付宝/淘宝/播客", "微信读书/山姆/美团"],
        "ai_attitudes": ["会让 AI 规划饮食和运动", "愿意参考 AI，但最终看自己身体反馈"],
        "family_influences": ["主要自己决定", "伴侣接受度会影响复购"],
        "peer_influences": ["健身和轻食圈层会明显影响选择", "朋友试喝评价很重要"],
        "kol_influences": ["关注营养学和可持续生活博主", "喜欢真实减脂、早餐类内容"],
        "research_readiness": ["早餐场景测试", "概念筛选", "价格带测试"],
        "applicable_scenarios": ["breakfast_test", "concept_screening", "pricing_test"],
    },
}


def _blueprint(archetype: str, **overrides: Any) -> dict[str, Any]:
    payload = dict(ARCHETYPE_DEFAULTS[archetype])
    payload["archetype"] = archetype
    payload.update(overrides)
    return payload


AUDIENCE_BLUEPRINTS: list[dict[str, Any]] = [
    _blueprint(
        "maternal",
        key="aptamil-formula-newmom",
        brand_key="aptamil",
        label="精研配方新手妈妈",
        description="首娃 0-12 个月阶段，会把配方、来源和口碑逐项比对。",
        count=4,
        core_count=1,
        age_min=27,
        age_max=33,
        city_keys=["shanghai", "hangzhou", "beijing", "shenzhen"],
        occupations=["品牌经理", "财务主管", "律师", "产品经理"],
        self_identity="有方法论的新手妈妈",
        core_value="把每一次入口选择都做成理性决策",
        primary_need="确认配方和来源足够可靠",
        secondary_need="兼顾吸收表现和日常喂养效率",
        unmet_need="很难快速判断哪些卖点是真差异而不是营销词",
        business_purpose="代表爱他美核心购买人群评估高信任感配方沟通。",
        default_demo=True,
    ),
    _blueprint(
        "maternal",
        key="aptamil-pregnant-care",
        brand_key="aptamil",
        label="孕晚期精养妈妈",
        description="孕晚期开始提前研究喂养方案，偏好科学、稳妥和可持续的品牌。",
        count=4,
        core_count=1,
        age_min=28,
        age_max=35,
        city_keys=["beijing", "shanghai", "suzhou", "xiamen"],
        occupations=["咨询顾问", "人力经理", "设计总监", "高校行政"],
        self_identity="提前做功课的规划型妈妈",
        core_value="尽早降低新生儿喂养不确定性",
        primary_need="提前建立喂养方案的心理安全感",
        secondary_need="减少产后临时做决策的压力",
        unmet_need="缺少既专业又不制造焦虑的品牌表达",
        business_purpose="代表爱他美预备型人群评估孕晚期沟通和安心感建立。",
    ),
    _blueprint(
        "maternal",
        key="aptamil-career-mom",
        brand_key="aptamil",
        label="成分党职场妈妈",
        description="返岗后时间紧，但依然愿意为高确信度配方支付溢价。",
        count=4,
        core_count=1,
        age_min=30,
        age_max=36,
        city_keys=["shenzhen", "guangzhou", "hangzhou", "chengdu"],
        occupations=["互联网运营总监", "投行助理总监", "甲方市场经理", "数据分析师"],
        self_identity="效率优先但不愿牺牲标准的妈妈",
        core_value="缩短判断时间，但不降低决策质量",
        primary_need="快速锁定值得长期复购的品牌",
        secondary_need="品牌表达既专业又不显得过度说教",
        unmet_need="职场返岗后缺少低判断成本的高信任选择",
        business_purpose="代表爱他美返岗妈妈评估高效率决策场景。",
    ),
    _blueprint(
        "maternal",
        key="aptamil-second-baby",
        brand_key="aptamil",
        label="二胎效率妈妈",
        description="有育儿经验，对营销更挑剔，更看执行效率与稳定口碑。",
        count=4,
        core_count=1,
        age_min=32,
        age_max=38,
        city_keys=["nanjing", "wuhan", "qingdao", "changsha"],
        occupations=["会计主管", "教培创业者", "采购经理", "保险顾问"],
        self_identity="经验老到、讨厌被忽悠的妈妈",
        core_value="用成熟经验帮自己节省精力",
        primary_need="稳定、省事、不反复踩坑",
        secondary_need="一旦确认有效，希望全家执行一致",
        unmet_need="大多数配方卖点听起来都太像",
        business_purpose="代表爱他美效率型老用户评估复购与升级沟通。",
    ),
    _blueprint(
        "maternal",
        key="aptamil-overseas-educated",
        brand_key="aptamil",
        label="高知海归妈妈",
        description="关注国际来源、科研背书和长期成长叙事。",
        count=4,
        core_count=1,
        age_min=29,
        age_max=35,
        city_keys=["shanghai", "beijing", "shenzhen", "hangzhou"],
        occupations=["高校教师", "科技公司策略经理", "医药注册经理", "用户研究负责人"],
        self_identity="用证据和世界经验做育儿决策",
        core_value="国际标准和长期成长逻辑",
        primary_need="确认品牌叙事和配方逻辑一致",
        secondary_need="对来源、科研和监管有清晰说明",
        unmet_need="很少有品牌能把专业性讲得足够克制",
        business_purpose="代表爱他美高知人群评估科研与国际化沟通。",
    ),
    _blueprint(
        "maternal",
        key="aptamil-township-safe",
        brand_key="aptamil",
        label="下沉市场稳妥妈妈",
        description="价格敏感但并非只看低价，更在意买得放心、全家都认可。",
        count=4,
        core_count=0,
        age_min=27,
        age_max=34,
        city_keys=["nantong", "luoyang", "weifang", "yantai"],
        occupations=["事业单位职员", "县城店主", "中学老师", "银行柜员"],
        self_identity="务实但愿意为孩子升级消费的妈妈",
        core_value="买贵一点没关系，但不能买错",
        primary_need="确认品牌靠谱且不需要反复解释",
        secondary_need="线下也容易买到，补货方便",
        unmet_need="很多高端品牌看起来离自己太远",
        business_purpose="代表爱他美下沉市场人群评估普适化信任表达。",
    ),
    _blueprint(
        "maternal",
        key="nutrilon-rational-formula",
        brand_key="nutrilon",
        label="理性比配方妈妈",
        description="会把配方、价格、来源做成表格比较，偏好有逻辑的说法。",
        count=4,
        core_count=1,
        age_min=27,
        age_max=34,
        city_keys=["shanghai", "suzhou", "hefei", "beijing"],
        occupations=["审计经理", "供应链经理", "投后经理", "财务分析师"],
        self_identity="把育儿消费当成理性采购项目的妈妈",
        core_value="同价位下要看得见的配方优势",
        primary_need="在可接受价格带内找到更优逻辑",
        secondary_need="品牌要说得明白，不要绕概念",
        unmet_need="跨境、国行和不同系列的信息很难横向比较",
        business_purpose="代表诺优能的理性对比型用户评估配方表达。",
        default_demo=True,
    ),
    _blueprint(
        "maternal",
        key="nutrilon-mixed-feeding",
        brand_key="nutrilon",
        label="混合喂养过渡妈妈",
        description="正在经历母乳、奶粉、辅食之间的过渡期，关注适配与稳定。",
        count=4,
        core_count=1,
        age_min=26,
        age_max=33,
        city_keys=["chengdu", "wuhan", "zhengzhou", "qingdao"],
        occupations=["保险运营", "互联网客服主管", "培训老师", "公关专员"],
        self_identity="边试边学、但很怕踩坑的妈妈",
        core_value="换阶段时尽量平稳，不要折腾孩子",
        primary_need="确认阶段切换时的稳定性和适应性",
        secondary_need="得到足够清晰的喂养建议",
        unmet_need="品牌很少真正理解过渡期的焦虑",
        business_purpose="代表诺优能过渡阶段用户评估适配与稳定感沟通。",
    ),
    _blueprint(
        "maternal",
        key="nutrilon-cross-border",
        brand_key="nutrilon",
        label="跨境转国行妈妈",
        description="曾经依赖海淘或代购，现在希望回归稳定、合规、可持续购买。",
        count=4,
        core_count=1,
        age_min=28,
        age_max=35,
        city_keys=["beijing", "shenzhen", "guangzhou", "xiamen"],
        occupations=["跨境电商运营", "广告策略经理", "采购主管", "医生"],
        self_identity="对来源和合规有敏感度的精明妈妈",
        core_value="稳定供应和放心购买比猎奇更重要",
        primary_need="找到能替代海淘确定感的国行方案",
        secondary_need="对来源差异有透明说明",
        unmet_need="担心换渠道后品质感知下降",
        business_purpose="代表诺优能跨境替代用户评估来源与合规叙事。",
    ),
    _blueprint(
        "maternal",
        key="nutrilon-township-family",
        brand_key="nutrilon",
        label="小镇家庭决策妈妈",
        description="家庭共同决策更明显，需要兼顾老人意见、预算和品牌面子。",
        count=4,
        core_count=0,
        age_min=27,
        age_max=35,
        city_keys=["nantong", "yantai", "luoyang", "foshan"],
        occupations=["护士", "事业单位科员", "县城门店老板", "中学老师"],
        self_identity="在家庭拉扯中寻求平衡的妈妈",
        core_value="让全家都接受且不折腾",
        primary_need="老人听得懂、自己也认可的品牌逻辑",
        secondary_need="价格别超出长期承受范围",
        unmet_need="很多国际品牌讲法太高冷",
        business_purpose="代表诺优能下沉家庭场景评估沟通普适性。",
    ),
    _blueprint(
        "medical",
        key="nutricia-post-surgery",
        brand_key="nutricia",
        label="术后恢复照护者",
        description="负责家人术后恢复营养，追求恢复效果和执行便利性。",
        count=3,
        core_count=1,
        age_min=34,
        age_max=45,
        city_keys=["beijing", "shanghai", "wuhan"],
        occupations=["项目经理", "行政总监", "自由职业者"],
        self_identity="希望把复杂恢复过程管理清楚的照护者",
        core_value="恢复效率和执行可持续性",
        primary_need="让家人愿意持续喝并看到改善",
        secondary_need="医生和自己都能接受的方案",
        unmet_need="很难在专业和口感接受度之间平衡",
        business_purpose="代表纽迪希亚术后恢复照护者评估路径沟通。",
    ),
    _blueprint(
        "medical",
        key="nutricia-senior-manager",
        brand_key="nutricia",
        label="银发营养管理者",
        description="为父母长期营养补充做决策，关注依从性、吞咽负担和家庭预算。",
        count=3,
        core_count=1,
        age_min=36,
        age_max=48,
        city_keys=["nanjing", "hangzhou", "chengdu"],
        occupations=["HRD", "药企销售经理", "国企干部"],
        self_identity="用系统化方式照顾父母健康的家庭中坚",
        core_value="长期可执行比短期激进更重要",
        primary_need="建立稳定、家庭愿意坚持的营养方案",
        secondary_need="对功能收益和适用边界有清晰认知",
        unmet_need="很多产品听起来专业，但家人未必愿意配合",
        business_purpose="代表纽迪希亚银发照护场景评估依从性表达。",
    ),
    _blueprint(
        "medical",
        key="nutricia-oncology-caregiver",
        brand_key="nutricia",
        label="肿瘤康复陪护家属",
        description="处于高压恢复周期，信息搜寻强度高，对口味与情绪接受度都很敏感。",
        count=3,
        core_count=0,
        age_min=31,
        age_max=43,
        city_keys=["guangzhou", "changsha", "zhengzhou"],
        occupations=["地产运营", "会展策划", "教师"],
        self_identity="在强压力下尽力把每个细节做好的人",
        core_value="少走弯路、别给病人增加额外负担",
        primary_need="既专业又不让人心理排斥",
        secondary_need="家属购买与使用步骤足够清晰",
        unmet_need="很多沟通太专业、太硬，不利于执行",
        business_purpose="代表纽迪希亚高压康复场景评估情绪化表达边界。",
    ),
    _blueprint(
        "medical",
        key="nutricia-swallowing-support",
        brand_key="nutricia",
        label="吞咽困难照护决策者",
        description="照护老人或慢病患者，对形态、顺滑度和风险提示非常敏感。",
        count=3,
        core_count=0,
        age_min=35,
        age_max=50,
        city_keys=["shanghai", "qingdao", "foshan"],
        occupations=["社区医院护士长", "家政管理者", "康复中心运营"],
        self_identity="习惯把照护流程拆解得很细的人",
        core_value="把风险降到最低",
        primary_need="确保产品形态真的适合特殊人群",
        secondary_need="让家属使用时不犯错",
        unmet_need="包装与说明经常不够直观",
        business_purpose="代表纽迪希亚特殊照护场景评估说明清晰度。",
    ),
    _blueprint(
        "beverage",
        key="mizone-commuter",
        brand_key="mizone",
        label="通勤提神白领",
        description="高频通勤和长时间开会，需要稳定、顺口、随手可得的补水方案。",
        count=4,
        core_count=1,
        age_min=24,
        age_max=31,
        city_keys=["shanghai", "beijing", "shenzhen", "hangzhou"],
        occupations=["品牌专员", "产品运营", "咨询顾问", "广告策划"],
        self_identity="把效率和状态保持看得很重的职场人",
        core_value="补得快、喝着没负担、不会显得很刻意",
        primary_need="午后和会前快速恢复状态",
        secondary_need="放在工位上也不尴尬",
        unmet_need="功能饮料经常不是太甜就是太猛",
        business_purpose="代表脉动办公室高频饮用场景评估轻功能表达。",
        default_demo=True,
    ),
    _blueprint(
        "beverage",
        key="mizone-campus-sports",
        brand_key="mizone",
        label="校园运动青年",
        description="课间、球场、社团活动之间切换，追求性价比和即时恢复感。",
        count=4,
        core_count=1,
        age_min=19,
        age_max=24,
        city_keys=["wuhan", "chengdu", "changsha", "qingdao"],
        occupations=["大学生", "研究生", "体育社团干部", "校园新媒体学生"],
        self_identity="精力旺盛、愿意为活动状态买单的年轻人",
        core_value="补水要快，口味也要好接受",
        primary_need="运动后及时补充和提气",
        secondary_need="价格别太高，校园里容易买到",
        unmet_need="很多运动饮料看起来像专业选手专用，离日常太远",
        business_purpose="代表脉动校园运动场景评估大众化补水沟通。",
    ),
    _blueprint(
        "beverage",
        key="mizone-fitness",
        brand_key="mizone",
        label="健身减脂人群",
        description="对糖感、热量和电解质平衡敏感，希望功能感明确但不负担。",
        count=4,
        core_count=1,
        age_min=23,
        age_max=33,
        city_keys=["shenzhen", "guangzhou", "hangzhou", "xiamen"],
        occupations=["健身教练", "自媒体博主", "互联网设计师", "律师"],
        self_identity="追求体型管理和效率恢复的自律人群",
        core_value="补充要服务训练目标，而不是破坏计划",
        primary_need="在训练前后稳定补充且不增加罪恶感",
        secondary_need="品牌表达别太土，适合社交分享",
        unmet_need="功能和轻负担常常很难兼得",
        business_purpose="代表脉动健身人群评估轻负担功能饮料定位。",
    ),
    _blueprint(
        "beverage",
        key="mizone-rider-driver",
        brand_key="mizone",
        label="外卖骑手与司机",
        description="长时间在路上，高温、出汗和即时补给需求明显。",
        count=3,
        core_count=0,
        age_min=24,
        age_max=38,
        city_keys=["guangzhou", "wuhan", "zhengzhou"],
        occupations=["外卖骑手", "网约车司机", "同城配送员"],
        self_identity="靠体力和节奏吃饭的高压劳动者",
        core_value="补给必须够快、够稳、够划算",
        primary_need="高温和长工时下快速恢复状态",
        secondary_need="路上容易买到，价格不能离谱",
        unmet_need="很多饮料喝完更口渴或者太甜",
        business_purpose="代表脉动高强度体力场景评估即时恢复表达。",
    ),
    _blueprint(
        "beverage",
        key="mizone-night-shift",
        brand_key="mizone",
        label="熬夜打工人",
        description="深夜加班和赶工时需要提神，但排斥过强刺激和身体负担。",
        count=4,
        core_count=1,
        age_min=24,
        age_max=34,
        city_keys=["beijing", "shanghai", "chengdu", "hangzhou"],
        occupations=["程序员", "审片师", "投流运营", "游戏策划"],
        self_identity="知道自己不健康但想把伤害降到最低的人",
        core_value="能撑住状态，但别透支太狠",
        primary_need="加班时获得温和但有效的续航感",
        secondary_need="避免喝完心慌或第二天更累",
        unmet_need="传统功能饮料太像硬顶，不像长期方案",
        business_purpose="代表脉动夜间工作场景评估温和恢复叙事。",
    ),
    _blueprint(
        "beverage",
        key="mizone-outdoor-weekend",
        brand_key="mizone",
        label="周末户外爱好者",
        description="徒步、骑行、露营等场景下，追求好带、好喝、有参与感的补给。",
        count=3,
        core_count=0,
        age_min=25,
        age_max=36,
        city_keys=["xiamen", "qingdao", "kunming"],
        occupations=["户外俱乐部主理人", "摄影师", "产品经理"],
        self_identity="把周末体验质量看得很重的人",
        core_value="补给要融入户外氛围，而不是破坏体验",
        primary_need="在运动和社交之间保持舒适状态",
        secondary_need="包装和口味有记忆点，愿意带出去",
        unmet_need="很多功能饮料缺少生活方式感",
        business_purpose="代表脉动户外休闲场景评估社交化表达。",
    ),
    _blueprint(
        "lifestyle",
        key="evian-parenting",
        brand_key="evian",
        label="高端亲子生活妈妈",
        description="在亲子、出游和家庭接待场景里，会把水的品牌视作生活方式的一部分。",
        count=4,
        core_count=1,
        age_min=30,
        age_max=38,
        city_keys=["shanghai", "beijing", "shenzhen", "hangzhou"],
        occupations=["买手店主理人", "品牌咨询顾问", "私募合伙人助理", "艺术教育机构负责人"],
        self_identity="在生活细节上维持审美与体面感的妈妈",
        core_value="日常消费也要体现家庭生活方式标准",
        primary_need="在亲子和家庭场景里保持天然、干净、拿得出手",
        secondary_need="品牌最好自带国际感和体面感",
        unmet_need="很多高端水只停留在价格，没有真正的生活方式表达",
        business_purpose="代表依云高端家庭场景评估天然与体面感叙事。",
        default_demo=True,
    ),
    _blueprint(
        "lifestyle",
        key="evian-urban-professional",
        brand_key="evian",
        label="都市精致白领",
        description="工作节奏快，但对办公桌面、会议和健身后的品牌选择有审美标准。",
        count=4,
        core_count=1,
        age_min=25,
        age_max=34,
        city_keys=["shanghai", "guangzhou", "shenzhen", "chengdu"],
        occupations=["公关经理", "时尚编辑", "产品经理", "投行分析师"],
        self_identity="希望效率与精致感并存的都市人",
        core_value="日常也不要用看起来很随便的东西",
        primary_need="在办公室和差旅中维持稳定、体面的补水选择",
        secondary_need="品牌不能过于夸张，最好天然克制",
        unmet_need="很多瓶装水没有情绪价值",
        business_purpose="代表依云都市办公场景评估高端日常感。",
    ),
    _blueprint(
        "lifestyle",
        key="evian-hotel-travel",
        brand_key="evian",
        label="酒店差旅人士",
        description="常住酒店和机场，对品牌的一致体验、国际识别和低决策成本敏感。",
        count=3,
        core_count=1,
        age_min=28,
        age_max=42,
        city_keys=["beijing", "shanghai", "guangzhou"],
        occupations=["区域销售总监", "咨询顾问", "航空公司培训经理"],
        self_identity="在移动中追求稳定体验的差旅人",
        core_value="少做决定，但每次都靠谱",
        primary_need="差旅环境下获得熟悉、稳定、国际化的选择",
        secondary_need="不想在酒店和机场随便喝",
        unmet_need="很多替代品缺少熟悉的品质感",
        business_purpose="代表依云差旅场景评估国际感和稳定体验。",
    ),
    _blueprint(
        "lifestyle",
        key="evian-event-host",
        brand_key="evian",
        label="婚礼派对采购人",
        description="对包装、桌面呈现和宾客感知敏感，重视品牌是否提升整体氛围。",
        count=3,
        core_count=0,
        age_min=27,
        age_max=38,
        city_keys=["shanghai", "xiamen", "chengdu"],
        occupations=["婚礼策划师", "活动主理人", "精品民宿店长"],
        self_identity="习惯把细节做成体验的一部分",
        core_value="每个物件都应该服务整体质感",
        primary_need="让饮用水也成为氛围的一部分",
        secondary_need="采购和落地执行都省心",
        unmet_need="大多数水没有视觉记忆点",
        business_purpose="代表依云活动场景评估包装与体面感表达。",
    ),
    _blueprint(
        "plant",
        key="alpro-breakfast-white-collar",
        brand_key="alpro",
        label="轻负担早餐白领",
        description="早餐讲求快、轻、顺口，对植物基接受度高，关注状态和饱腹感。",
        count=3,
        core_count=1,
        age_min=24,
        age_max=32,
        city_keys=["shanghai", "hangzhou", "guangzhou"],
        occupations=["咨询分析师", "品牌策划", "交互设计师"],
        self_identity="用早餐管理状态的都市白领",
        core_value="一天开始得轻一点，后面才稳",
        primary_need="快速完成一顿不油不撑的早餐",
        secondary_need="品牌要有现代感，不像功能性代餐",
        unmet_need="很多植物基产品口感和饱腹感难兼顾",
        business_purpose="代表 Alpro 早餐替代场景评估轻负担价值。",
    ),
    _blueprint(
        "plant",
        key="alpro-lactose-free",
        brand_key="alpro",
        label="乳糖不耐白领",
        description="把植物基视为解决方案而不是潮流，关注身体反馈和长期稳定性。",
        count=3,
        core_count=1,
        age_min=25,
        age_max=35,
        city_keys=["shenzhen", "beijing", "wuhan"],
        occupations=["程序员", "律师", "品牌运营"],
        self_identity="不想再为了喝奶类产品冒险试错的人",
        core_value="身体舒服最重要",
        primary_need="找到顺口、稳定、不折腾肠胃的替代方案",
        secondary_need="不要被说教式地教育“为什么要植物基”",
        unmet_need="替代品常常牺牲口感或太像小众产品",
        business_purpose="代表 Alpro 功能替代人群评估真实需求沟通。",
    ),
    _blueprint(
        "plant",
        key="alpro-fitness-control",
        brand_key="alpro",
        label="健身控糖女性",
        description="在意早餐结构、卡路里和蛋白组合，喜欢兼顾社交分享与自律感。",
        count=3,
        core_count=1,
        age_min=24,
        age_max=33,
        city_keys=["shanghai", "shenzhen", "xiamen"],
        occupations=["瑜伽教练", "用户增长经理", "自媒体内容创作者"],
        self_identity="把体型管理和生活方式放在一起经营的人",
        core_value="看得见的轻盈感和长期坚持",
        primary_need="早餐补给不要破坏全天控糖计划",
        secondary_need="包装、口味和拍照友好度都要在线",
        unmet_need="很多健康产品一喝就像在受苦",
        business_purpose="代表 Alpro 控糖轻食场景评估口感与轻盈感叙事。",
    ),
    _blueprint(
        "plant",
        key="alpro-sustainable-young",
        brand_key="alpro",
        label="环保生活方式青年",
        description="把植物基和可持续当作身份表达的一部分，希望品牌价值观真实可信。",
        count=3,
        core_count=0,
        age_min=23,
        age_max=31,
        city_keys=["hangzhou", "chengdu", "kunming"],
        occupations=["可持续项目专员", "独立策展人", "播客主理人"],
        self_identity="想让消费和价值观对齐的年轻人",
        core_value="买的不只是产品，也是自己认同的生活方式",
        primary_need="品牌能把可持续讲得真实、不空洞",
        secondary_need="口味和日常便利性仍然要成立",
        unmet_need="价值观品牌很容易流于姿态",
        business_purpose="代表 Alpro 价值观导向人群评估品牌立场沟通。",
    ),
]


def _build_name(seed: int, gender: str) -> str:
    surname = SURNAMES[seed % len(SURNAMES)]
    given_pool = FEMALE_GIVEN_NAMES if gender == "女" else MALE_GIVEN_NAMES
    given = given_pool[((seed * 3) + (seed // len(SURNAMES)) + len(surname)) % len(given_pool)]
    return f"{surname}{given}"


def _build_system_prompt(
    *,
    name: str,
    age: int,
    city: str,
    occupation: str,
    audience_label: str,
    brand_name: str,
    primary_need: str,
    info_source: str,
    core_value: str,
) -> str:
    return (
        f"你是{name}，{age}岁，生活在{city}，职业是{occupation}，属于{audience_label}。"
        f"你会用{core_value}来判断是否值得继续了解{brand_name}相关产品。"
        f"你最在意的是{primary_need}，平时主要通过{info_source}获取信息。"
        "回答时请始终使用第一人称和真实消费者口吻，给出具体场景、真实顾虑和明确偏好，避免像分析师。"
    )


def _build_target_audiences() -> list[dict[str, Any]]:
    audiences: list[dict[str, Any]] = []
    for blueprint in AUDIENCE_BLUEPRINTS:
        brand = BRANDS[blueprint["brand_key"]]
        audiences.append(
            {
                "id": _uuid("target-audience", blueprint["key"]),
                "label": blueprint["label"],
                "category": brand["category"],
                "description": f"{brand['label']}：{blueprint['description']}",
            }
        )
    return audiences


SEED_TARGET_AUDIENCES: list[dict[str, Any]] = _build_target_audiences()


def _build_profiles() -> list[dict[str, Any]]:
    profiles: list[dict[str, Any]] = []
    global_index = 0
    for blueprint in AUDIENCE_BLUEPRINTS:
        brand = BRANDS[blueprint["brand_key"]]
        target_audience_id = _uuid("target-audience", blueprint["key"])
        for persona_index in range(blueprint["count"]):
            global_index += 1
            gender = _pick(blueprint["gender_options"], persona_index)
            city_key = _pick(blueprint["city_keys"], persona_index)
            city_meta = CITY_CATALOG[city_key]
            occupation = _pick(blueprint["occupations"], persona_index)
            age = blueprint["age_min"] + ((persona_index * 2 + global_index) % (blueprint["age_max"] - blueprint["age_min"] + 1))
            name = _build_name(global_index, gender)
            persona_tier = "core" if persona_index < blueprint["core_count"] else "scaled"
            age_range = f"{blueprint['age_min']}-{blueprint['age_max']} 岁"
            info_source = _pick(blueprint["info_sources"], global_index)
            primary_need = blueprint["primary_need"]
            core_value = blueprint["core_value"]
            profile_key = f"{blueprint['key']}-{persona_index + 1:02d}"

            profile_json = {
                "name": name,
                "brand_name": brand["label"],
                "brand_category": brand["category"],
                "audience_label": blueprint["label"],
                "age_range": age_range,
                "persona_tier": persona_tier,
                "built_from": f"Danone Brand Seed Pack · {brand['label']} {blueprint['label']}",
                "research_readiness": blueprint["research_readiness"],
                "version_notes": f"{brand['label']} {blueprint['label']}基线画像，用于快速铺设多品牌 Persona 资产库。",
                "system_prompt": _build_system_prompt(
                    name=name,
                    age=age,
                    city=city_meta["city"],
                    occupation=occupation,
                    audience_label=blueprint["label"],
                    brand_name=brand["label"],
                    primary_need=primary_need,
                    info_source=info_source,
                    core_value=core_value,
                ),
                "demographics": {
                    "gender": gender,
                    "age": age,
                    "income": _pick(blueprint["income_options"], global_index),
                    "education": _pick(blueprint["education_options"], global_index + 1),
                    "occupation": occupation,
                },
                "geographic": {
                    "city": city_meta["city"],
                    "tier": city_meta["tier"],
                    "region": city_meta["region"],
                    "residence": f"{city_meta['city']}{_pick(city_meta['residences'], global_index)}",
                },
                "behavioral": {
                    "shopping_channel": _pick(blueprint["shopping_channels"], global_index),
                    "info_source": info_source,
                    "purchase_frequency": _pick(blueprint["purchase_frequencies"], global_index + 2),
                    "brand_loyalty": _pick(blueprint["brand_loyalty_options"], global_index + 3),
                },
                "psychological": {
                    "core_value": core_value,
                    "anxiety_level": _pick(blueprint["anxiety_levels"], global_index),
                    "decision_style": "先缩小选项，再做深比较",
                    "self_identity": blueprint["self_identity"],
                },
                "needs": {
                    "primary": primary_need,
                    "secondary": blueprint["secondary_need"],
                    "unmet": blueprint["unmet_need"],
                },
                "tech_acceptance": {
                    "digital_literacy": _pick(blueprint["digital_literacy_options"], global_index),
                    "app_usage": _pick(blueprint["app_usages"], global_index + 1),
                    "ai_attitude": _pick(blueprint["ai_attitudes"], global_index + 2),
                },
                "social_relations": {
                    "family_influence": _pick(blueprint["family_influences"], global_index),
                    "peer_influence": _pick(blueprint["peer_influences"], global_index + 1),
                    "kol_influence": _pick(blueprint["kol_influences"], global_index + 2),
                },
            }
            profiles.append(
                {
                    "id": _uuid("persona-profile", profile_key),
                    "target_audience_id": target_audience_id,
                    "label": f"{brand['label']}·{blueprint['label']}画像",
                    "profile_json": profile_json,
                }
            )
    return profiles


SEED_PERSONA_PROFILES: list[dict[str, Any]] = _build_profiles()


def _brand_summary_assets() -> list[dict[str, Any]]:
    assets: list[dict[str, Any]] = []
    for brand_key, brand in BRANDS.items():
        assets.append(
            {
                "id": _uuid("asset-manifest", f"brand-{brand_key}-summary"),
                "asset_kind": "transcript",
                "name": f"{brand['label']} Brand Seed Summary",
                "source_format": "json",
                "storage_uri": f"seed://brands/{brand_key}/summary",
                "metadata_json": {"scope": "seed_pack", "brand_name": brand["label"], "category": brand["category"]},
                "review_status": "approved",
                "created_by": "system",
            }
        )
    return assets


def _stimulus_assets() -> list[dict[str, Any]]:
    return [
        {
            "id": _uuid("asset-manifest", "stimulus-qingquan-plus"),
            "asset_kind": "stimulus_asset",
            "name": "清泉+ Seed 概念卡",
            "source_format": "json",
            "storage_uri": "seed://stimuli/qingquan-plus",
            "metadata_json": {"scope": "seed_pack", "kind": "concept"},
            "review_status": "approved",
            "created_by": "system",
        },
        {
            "id": _uuid("asset-manifest", "stimulus-chuyuan-youyang"),
            "asset_kind": "stimulus_asset",
            "name": "初元优养 Seed 概念卡",
            "source_format": "json",
            "storage_uri": "seed://stimuli/chuyuan-youyang",
            "metadata_json": {"scope": "seed_pack", "kind": "concept"},
            "review_status": "approved",
            "created_by": "system",
        },
        {
            "id": _uuid("asset-manifest", "stimulus-anchun"),
            "asset_kind": "stimulus_asset",
            "name": "安纯 Seed 概念卡",
            "source_format": "json",
            "storage_uri": "seed://stimuli/anchun",
            "metadata_json": {"scope": "seed_pack", "kind": "concept"},
            "review_status": "approved",
            "created_by": "system",
        },
    ]


def _persona_assets() -> list[dict[str, Any]]:
    assets: list[dict[str, Any]] = []
    for profile in SEED_PERSONA_PROFILES:
        profile_json = profile["profile_json"]
        profile_key = str(profile["id"])
        assets.append(
            {
                "id": _uuid("asset-manifest", f"{profile_key}-transcript"),
                "asset_kind": "transcript",
                "name": f"{profile_json['brand_name']}·{profile_json['name']} Persona Seed",
                "source_format": "json",
                "storage_uri": f"seed://persona-transcripts/{profile_key}",
                "metadata_json": {
                    "scope": "seed_pack",
                    "brand_name": profile_json["brand_name"],
                    "persona_profile_id": profile["id"],
                    "persona_tier": profile_json["persona_tier"],
                },
                "review_status": "approved",
                "created_by": "system",
            }
        )
    return assets


SEED_ASSET_MANIFESTS: list[dict[str, Any]] = [
    *_brand_summary_assets(),
    *_stimulus_assets(),
    *_persona_assets(),
]


def _build_consumer_twins() -> list[dict[str, Any]]:
    twins: list[dict[str, Any]] = []
    for profile in SEED_PERSONA_PROFILES:
        profile_json = profile["profile_json"]
        audience_id = profile["target_audience_id"]
        twin_key = f"{profile['id']}-consumer-twin"
        twins.append(
            {
                "id": _uuid("consumer-twin", twin_key),
                "target_audience_id": audience_id,
                "persona_profile_id": profile["id"],
                "business_purpose": f"代表{profile_json['brand_name']}的{profile_json['audience_label']}，用于评估品牌概念、沟通素材与研究假设。",
                "applicable_scenarios": profile_json["research_readiness"],
                "owner": "Danone",
            }
        )
    return twins


SEED_CONSUMER_TWINS: list[dict[str, Any]] = _build_consumer_twins()


def _build_twin_versions() -> list[dict[str, Any]]:
    versions: list[dict[str, Any]] = []
    profile_index_by_id = {profile["id"]: idx for idx, profile in enumerate(SEED_PERSONA_PROFILES)}
    for profile, twin in zip(SEED_PERSONA_PROFILES, SEED_CONSUMER_TWINS):
        profile_json = profile["profile_json"]
        brand_key = next(key for key, brand in BRANDS.items() if brand["label"] == profile_json["brand_name"])
        persona_asset_id = _uuid("asset-manifest", f"{profile['id']}-transcript")
        brand_asset_id = _uuid("asset-manifest", f"brand-{brand_key}-summary")
        version_key = f"{twin['id']}-v1"
        persona_order = profile_index_by_id[profile["id"]]
        default_demo = bool(
            profile_json["brand_name"] in {"爱他美", "诺优能", "脉动", "依云"}
            and profile_json["persona_tier"] == "core"
            and profile_json["audience_label"] in {
                "精研配方新手妈妈",
                "理性比配方妈妈",
                "通勤提神白领",
                "高端亲子生活妈妈",
            }
        )
        versions.append(
            {
                "id": _uuid("twin-version", version_key),
                "consumer_twin_id": twin["id"],
                "version_no": 1,
                "anchor_set_id": None,
                "agent_config_id": None,
                "benchmark_status": "draft",
                "persona_profile_snapshot_json": profile_json,
                "source_lineage": {
                    "asset_ids": [brand_asset_id, persona_asset_id],
                    "brand_name": profile_json["brand_name"],
                    "persona_tier": profile_json["persona_tier"],
                    "default_demo": default_demo,
                    "seed_pack_version": "danone-brand-persona-v1",
                    "notes": f"Seed twin #{persona_order + 1} for {profile_json['brand_name']} · {profile_json['name']}.",
                },
            }
        )
    return versions


SEED_TWIN_VERSIONS: list[dict[str, Any]] = _build_twin_versions()


SEED_STIMULI: list[dict[str, Any]] = [
    {
        "id": _uuid("stimulus", "qingquan-plus"),
        "name": "清泉+",
        "stimulus_type": "concept",
        "asset_manifest_id": _uuid("asset-manifest", "stimulus-qingquan-plus"),
        "description": "天然矿泉水基底 + 叶酸/DHA 精准配比，强调天然、纯净、无负担。",
        "stimulus_json": {
            "price": "38 元/瓶",
            "packaging": "透明瓶身，浅蓝色标签",
            "target_scene": "孕期日常补充，替代普通矿泉水",
        },
    },
    {
        "id": _uuid("stimulus", "chuyuan-youyang"),
        "name": "初元优养",
        "stimulus_type": "concept",
        "asset_manifest_id": _uuid("asset-manifest", "stimulus-chuyuan-youyang"),
        "description": "益生菌 + 铁 + 钙三合一，强调营养完整与照护感。",
        "stimulus_json": {
            "price": "32 元/瓶",
            "packaging": "白色瓶身，粉色渐变标签",
            "target_scene": "孕期到哺乳期全程营养补充",
        },
    },
    {
        "id": _uuid("stimulus", "anchun"),
        "name": "安纯",
        "stimulus_type": "concept",
        "asset_manifest_id": _uuid("asset-manifest", "stimulus-anchun"),
        "description": "有机认证 + 零添加，强调安心与纯净的高端日常营养仪式。",
        "stimulus_json": {
            "price": "45 元/瓶",
            "packaging": "磨砂玻璃瓶，深绿色标签",
            "target_scene": "高端孕妈的日常营养仪式",
        },
    },
]
