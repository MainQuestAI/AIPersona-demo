from __future__ import annotations

import asyncio
import unittest
from typing import Any

from app.study_runtime.routes import (
    AssetImportRequest,
    bootstrap_seed_assets,
    get_study_detail,
    import_asset,
    list_consumer_twins,
    list_dataset_mappings,
    list_ingestion_jobs,
    list_persona_profiles,
    list_stimuli,
    list_studies,
    list_target_audiences,
    list_twin_versions,
)


class FakeCatalogService:
    def __init__(self) -> None:
        self._detail = {
            "study": {
                "id": "study-42",
                "business_question": "哪一个母婴饮品概念最值得进入消费者验证？",
                "status": "completed",
            },
            "planning": {
                "current_execution_version_id": "version-2",
                "latest_plan_version": {
                    "id": "version-2",
                    "version_no": 2,
                    "estimated_cost": "88.50",
                },
            },
            "execution": {
                "current_run": {
                    "id": "run-9",
                    "status": "succeeded",
                    "step_count": 4,
                },
                "cost_summary": {
                    "estimated_cost": "88.50",
                    "actual_cost": "23.10",
                    "total_prompt_tokens": 3210,
                    "total_completion_tokens": 1888,
                },
            },
            "insights": {
                "qual": {
                    "themes": ["情绪安全感", "日常饮用适配度"],
                    "overall_insight": "清泉+ 更容易被理解为日常补水替代选择。",
                },
                "quant": {
                    "ranking": [
                        {"stimulus_name": "清泉+", "score": 74, "confidence_label": "82 / 高"},
                        {"stimulus_name": "初元优养", "score": 61, "confidence_label": "71 / 中"},
                    ]
                },
                "recommendation": {
                    "winner": "清泉+",
                    "confidence_label": "82 / 高",
                    "next_action": "进入消费者验证",
                },
                "replay": {
                    "title": "Beverage TA v2.1 runtime replay",
                    "stages": [{"id": "plan", "label": "计划"}],
                },
            },
            "assets": {
                "twins": [
                    {
                        "id": "twin-version-1",
                        "name": "孕期女性孪生",
                        "target_audience_label": "孕期女性",
                        "source_lineage": {"asset_ids": ["asset-transcript-1"]},
                    }
                ],
                "stimuli": [
                    {
                        "id": "stimulus-1",
                        "name": "清泉+",
                        "stimulus_type": "concept",
                        "status": "ready",
                    }
                ],
            },
        }
        self._studies = [
            {
                "id": "study-42",
                "business_question": "哪一个母婴饮品概念最值得进入消费者验证？",
                "status": "completed",
                "current_run_status": "succeeded",
                "latest_plan_version_no": 2,
            }
        ]
        self._twins = [
            {
                "id": "twin-1",
                "name": "孕期女性孪生",
                "latest_version_id": "twin-version-1",
                "latest_version_no": 2,
                "target_audience_label": "孕期女性",
            }
        ]
        self._target_audiences = [
            {
                "id": "aud-1",
                "label": "孕期女性",
                "category": "Maternal beverage",
            }
        ]
        self._persona_profiles = [
            {
                "id": "profile-1",
                "label": "孕期女性画像",
                "target_audience_label": "孕期女性",
            }
        ]
        self._twin_versions = [
            {
                "id": "twin-version-1",
                "version_no": 2,
                "target_audience_label": "孕期女性",
            }
        ]
        self._stimuli = [
            {
                "id": "stimulus-1",
                "name": "清泉+",
                "stimulus_type": "concept",
                "status": "ready",
            }
        ]
        self._jobs = [
            {
                "id": "job-1",
                "status": "pending_review",
                "asset_manifest_id": "asset-1",
            }
        ]
        self._mappings = [
            {
                "id": "mapping-1",
                "mapping_status": "pending_review",
                "asset_manifest_id": "asset-1",
            }
        ]

    def bootstrap_seed_assets(self) -> dict[str, Any]:
        return {
            "target_audiences": [{"id": "aud-1", "label": "孕期女性"}],
            "twin_versions": [{"id": "twin-version-1", "name": "孕期女性孪生", "version_no": 1}],
            "stimuli": [{"id": "stimulus-1", "name": "清泉+", "stimulus_type": "concept"}],
        }

    def list_studies(self) -> list[dict[str, Any]]:
        return list(self._studies)

    def get_study_detail(self, study_id: str) -> dict[str, Any]:
        if study_id != "study-42":
            raise AssertionError("unexpected study id")
        return self._detail

    def list_consumer_twins(self) -> list[dict[str, Any]]:
        return list(self._twins)

    def list_target_audiences(self) -> list[dict[str, Any]]:
        return list(self._target_audiences)

    def list_persona_profiles(self) -> list[dict[str, Any]]:
        return list(self._persona_profiles)

    def list_twin_versions(self) -> list[dict[str, Any]]:
        return list(self._twin_versions)

    def list_stimuli(self) -> list[dict[str, Any]]:
        return list(self._stimuli)

    def import_asset(self, payload: Any) -> dict[str, Any]:
        asset_kind = payload.asset_kind
        response = {
            "asset": {
                "id": "asset-1",
                "asset_kind": asset_kind,
                "source_format": payload.source_format,
                "name": payload.name,
            },
            "job": {
                "id": "job-1",
                "status": "ready" if asset_kind != "quant_dataset" else "pending_review",
            },
        }
        if asset_kind == "quant_dataset":
            response["dataset_mapping"] = {
                "id": "mapping-1",
                "mapping_status": "pending_review",
            }
        return response

    def list_ingestion_jobs(self) -> list[dict[str, Any]]:
        return list(self._jobs)

    def list_dataset_mappings(self) -> list[dict[str, Any]]:
        return list(self._mappings)


class CatalogRouteTests(unittest.TestCase):
    def setUp(self) -> None:
        self.service = FakeCatalogService()

    def test_seed_and_catalog_routes_expose_real_objects_for_mvp_shell(self) -> None:
        seed_pack = asyncio.run(bootstrap_seed_assets(service=self.service))
        studies = asyncio.run(list_studies(service=self.service))
        twins = asyncio.run(list_consumer_twins(service=self.service))
        target_audiences = asyncio.run(list_target_audiences(service=self.service))
        persona_profiles = asyncio.run(list_persona_profiles(service=self.service))
        twin_versions = asyncio.run(list_twin_versions(service=self.service))
        stimuli = asyncio.run(list_stimuli(service=self.service))

        self.assertEqual(seed_pack["twin_versions"][0]["name"], "孕期女性孪生")
        self.assertEqual(studies[0]["latest_plan_version_no"], 2)
        self.assertEqual(twins[0]["latest_version_no"], 2)
        self.assertEqual(target_audiences[0]["label"], "孕期女性")
        self.assertEqual(persona_profiles[0]["label"], "孕期女性画像")
        self.assertEqual(twin_versions[0]["version_no"], 2)
        self.assertEqual(stimuli[0]["name"], "清泉+")

    def test_study_detail_route_returns_assets_insights_and_cost_summary(self) -> None:
        detail = asyncio.run(get_study_detail("study-42", service=self.service))

        self.assertEqual(detail["study"]["id"], "study-42")
        self.assertEqual(detail["planning"]["latest_plan_version"]["version_no"], 2)
        self.assertEqual(detail["insights"]["recommendation"]["winner"], "清泉+")
        self.assertEqual(detail["assets"]["twins"][0]["target_audience_label"], "孕期女性")
        self.assertEqual(detail["execution"]["cost_summary"]["total_prompt_tokens"], 3210)

    def test_import_quant_dataset_returns_pending_review_mapping(self) -> None:
        result = asyncio.run(
            import_asset(
                AssetImportRequest(
                    asset_kind="quant_dataset",
                    name="Danone IMF Quant Batch 01",
                    source_format="csv",
                    storage_uri="file:///tmp/imf-01.csv",
                    created_by="boss",
                    metadata={"study_type": "concept_screening"},
                ),
                service=self.service,
            )
        )
        jobs = asyncio.run(list_ingestion_jobs(service=self.service))
        mappings = asyncio.run(list_dataset_mappings(service=self.service))

        self.assertEqual(result["asset"]["asset_kind"], "quant_dataset")
        self.assertEqual(result["job"]["status"], "pending_review")
        self.assertEqual(result["dataset_mapping"]["mapping_status"], "pending_review")
        self.assertEqual(jobs[0]["status"], "pending_review")
        self.assertEqual(mappings[0]["mapping_status"], "pending_review")


if __name__ == "__main__":
    unittest.main()
