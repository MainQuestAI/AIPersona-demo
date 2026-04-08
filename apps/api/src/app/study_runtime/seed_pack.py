from __future__ import annotations

from typing import Any


SEED_TARGET_AUDIENCES: list[dict[str, Any]] = [
    {
        "id": "6f4a4e61-5b21-4d4e-8a4e-4f312f6b3001",
        "label": "孕期女性",
        "category": "Maternal beverage",
        "description": "孕 4-8 个月的一线城市女性，对食品安全和成分透明度高度敏感。",
    },
    {
        "id": "6f4a4e61-5b21-4d4e-8a4e-4f312f6b3002",
        "label": "新手妈妈",
        "category": "Maternal beverage",
        "description": "0-1 岁宝宝妈妈，对营养补充、口感和便携性同时敏感。",
    },
]


SEED_PERSONA_PROFILES: list[dict[str, Any]] = [
    {
        "id": "6f4a4e61-5b21-4d4e-8a4e-4f312f6b4001",
        "target_audience_id": "6f4a4e61-5b21-4d4e-8a4e-4f312f6b3001",
        "label": "孕期女性画像",
        "profile_json": {
            "name": "孕期女性",
            "audience_label": "孕期女性",
            "age_range": "28-32 岁",
            "built_from": "Seed Asset Pack · 孕产人群定性摘要",
            "research_readiness": ["概念筛选", "命名测试", "沟通素材测试"],
            "version_notes": "基于上海孕期女性的安全感与成分敏感度画像。",
            "system_prompt": (
                "你是一位 28 岁的孕期女性消费者，居住在上海，怀孕 6 个月。"
                "你对食品安全和营养成分非常在意，会仔细阅读产品配料表。"
                '你倾向于选择天然、无添加的饮品，对"清"和"纯"等字眼有积极联想。'
                "在回答问题时，你要表现得像真实消费者，用口语表达真实感受。"
            ),
        },
    },
    {
        "id": "6f4a4e61-5b21-4d4e-8a4e-4f312f6b4002",
        "target_audience_id": "6f4a4e61-5b21-4d4e-8a4e-4f312f6b3002",
        "label": "新手妈妈画像",
        "profile_json": {
            "name": "新手妈妈",
            "audience_label": "新手妈妈",
            "age_range": "30-34 岁",
            "built_from": "Seed Asset Pack · 母婴消费场景访谈摘要",
            "research_readiness": ["概念筛选", "命名测试", "沟通素材测试"],
            "version_notes": "基于成都新手妈妈的喂养与日常补水场景画像。",
            "system_prompt": (
                "你是一位 31 岁的新手妈妈，居住在成都，宝宝 8 个月大。"
                "你比较务实，对价格敏感度中等，更看重性价比和品牌口碑。"
                "在回答问题时，请像真实消费者一样用口语表达，并提到带娃场景。"
            ),
        },
    },
]


SEED_CONSUMER_TWINS: list[dict[str, Any]] = [
    {
        "id": "7f4a4e61-5b21-4d4e-8a4e-4f312f6b2001",
        "target_audience_id": "6f4a4e61-5b21-4d4e-8a4e-4f312f6b3001",
        "persona_profile_id": "6f4a4e61-5b21-4d4e-8a4e-4f312f6b4001",
        "business_purpose": "代表孕期女性评估母婴饮品概念与命名。",
        "applicable_scenarios": ["concept_screening", "naming_test", "communication_test"],
        "owner": "Danone",
    },
    {
        "id": "7f4a4e61-5b21-4d4e-8a4e-4f312f6b2002",
        "target_audience_id": "6f4a4e61-5b21-4d4e-8a4e-4f312f6b3002",
        "persona_profile_id": "6f4a4e61-5b21-4d4e-8a4e-4f312f6b4002",
        "business_purpose": "代表新手妈妈评估母婴饮品概念与沟通素材。",
        "applicable_scenarios": ["concept_screening", "naming_test", "communication_test"],
        "owner": "Danone",
    },
]


SEED_ASSET_MANIFESTS: list[dict[str, Any]] = [
    {
        "id": "9f6c6073-7d43-4f60-9c60-6043407c5001",
        "asset_kind": "transcript",
        "name": "Seed 孕期女性访谈摘要",
        "source_format": "json",
        "storage_uri": "seed://assets/pregnant-woman-transcript",
        "metadata_json": {"scope": "seed_pack", "category": "Maternal beverage"},
        "review_status": "approved",
        "created_by": "system",
    },
    {
        "id": "9f6c6073-7d43-4f60-9c60-6043407c5002",
        "asset_kind": "transcript",
        "name": "Seed 新手妈妈访谈摘要",
        "source_format": "json",
        "storage_uri": "seed://assets/new-mom-transcript",
        "metadata_json": {"scope": "seed_pack", "category": "Maternal beverage"},
        "review_status": "approved",
        "created_by": "system",
    },
    {
        "id": "9f6c6073-7d43-4f60-9c60-6043407c5003",
        "asset_kind": "stimulus_asset",
        "name": "清泉+ Seed 概念卡",
        "source_format": "json",
        "storage_uri": "seed://stimuli/qingquan-plus",
        "metadata_json": {"scope": "seed_pack", "kind": "concept"},
        "review_status": "approved",
        "created_by": "system",
    },
    {
        "id": "9f6c6073-7d43-4f60-9c60-6043407c5004",
        "asset_kind": "stimulus_asset",
        "name": "初元优养 Seed 概念卡",
        "source_format": "json",
        "storage_uri": "seed://stimuli/chuyuan-youyang",
        "metadata_json": {"scope": "seed_pack", "kind": "concept"},
        "review_status": "approved",
        "created_by": "system",
    },
    {
        "id": "9f6c6073-7d43-4f60-9c60-6043407c5005",
        "asset_kind": "stimulus_asset",
        "name": "安纯 Seed 概念卡",
        "source_format": "json",
        "storage_uri": "seed://stimuli/anchun",
        "metadata_json": {"scope": "seed_pack", "kind": "concept"},
        "review_status": "approved",
        "created_by": "system",
    },
]


SEED_TWIN_VERSIONS: list[dict[str, Any]] = [
    {
        "id": "7f4a4e61-5b21-4d4e-8a4e-4f312f6b1001",
        "consumer_twin_id": "7f4a4e61-5b21-4d4e-8a4e-4f312f6b2001",
        "version_no": 1,
        "anchor_set_id": None,
        "agent_config_id": None,
        "benchmark_status": "draft",
        "persona_profile_snapshot_json": SEED_PERSONA_PROFILES[0]["profile_json"],
        "source_lineage": {
            "asset_ids": ["9f6c6073-7d43-4f60-9c60-6043407c5001"],
            "notes": "Seed pack baseline twin built from maternal-language transcript summary.",
        },
    },
    {
        "id": "7f4a4e61-5b21-4d4e-8a4e-4f312f6b1002",
        "consumer_twin_id": "7f4a4e61-5b21-4d4e-8a4e-4f312f6b2002",
        "version_no": 1,
        "anchor_set_id": None,
        "agent_config_id": None,
        "benchmark_status": "draft",
        "persona_profile_snapshot_json": SEED_PERSONA_PROFILES[1]["profile_json"],
        "source_lineage": {
            "asset_ids": ["9f6c6073-7d43-4f60-9c60-6043407c5002"],
            "notes": "Seed pack baseline twin built from new-mom transcript summary.",
        },
    },
]


SEED_STIMULI: list[dict[str, Any]] = [
    {
        "id": "8f5b5f72-6c32-4e5f-9b5f-5f42307c2001",
        "name": "清泉+",
        "stimulus_type": "concept",
        "asset_manifest_id": "9f6c6073-7d43-4f60-9c60-6043407c5003",
        "description": "天然矿泉水基底 + 叶酸/DHA 精准配比，强调天然、纯净、无负担。",
        "stimulus_json": {
            "price": "38 元/瓶",
            "packaging": "透明瓶身，浅蓝色标签",
            "target_scene": "孕期日常补充，替代普通矿泉水",
        },
    },
    {
        "id": "8f5b5f72-6c32-4e5f-9b5f-5f42307c2002",
        "name": "初元优养",
        "stimulus_type": "concept",
        "asset_manifest_id": "9f6c6073-7d43-4f60-9c60-6043407c5004",
        "description": "益生菌 + 铁 + 钙三合一，强调营养完整与照护感。",
        "stimulus_json": {
            "price": "32 元/瓶",
            "packaging": "白色瓶身，粉色渐变标签",
            "target_scene": "孕期到哺乳期全程营养补充",
        },
    },
    {
        "id": "8f5b5f72-6c32-4e5f-9b5f-5f42307c2003",
        "name": "安纯",
        "stimulus_type": "concept",
        "asset_manifest_id": "9f6c6073-7d43-4f60-9c60-6043407c5005",
        "description": "有机认证 + 零添加，强调安心与纯净的高端日常营养仪式。",
        "stimulus_json": {
            "price": "45 元/瓶",
            "packaging": "磨砂玻璃瓶，深绿色标签",
            "target_scene": "高端孕妈的日常营养仪式",
        },
    },
]
