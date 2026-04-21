from __future__ import annotations

import unittest
from collections import Counter

from app.study_runtime.seed_pack import SEED_PERSONA_PROFILES, SEED_TWIN_VERSIONS


class SeedPackCompositionTests(unittest.TestCase):
    def test_seed_pack_contains_hundred_personas_for_six_danone_brands(self) -> None:
        brand_counts = Counter(
            str(profile["profile_json"].get("brand_name"))
            for profile in SEED_PERSONA_PROFILES
        )

        self.assertEqual(len(SEED_PERSONA_PROFILES), 100)
        self.assertEqual(len(SEED_TWIN_VERSIONS), 100)
        self.assertEqual(
            brand_counts,
            {
                "爱他美": 24,
                "诺优能": 16,
                "纽迪希亚": 12,
                "脉动": 22,
                "依云": 14,
                "Alpro": 12,
            },
        )

    def test_core_personas_and_default_demo_subset_are_marked(self) -> None:
        core_profiles = [
            profile
            for profile in SEED_PERSONA_PROFILES
            if profile["profile_json"].get("persona_tier") == "core"
        ]
        default_demo_versions = [
            version
            for version in SEED_TWIN_VERSIONS
            if version["source_lineage"].get("default_demo") is True
        ]

        self.assertEqual(len(core_profiles), 20)
        self.assertEqual(len(default_demo_versions), 4)


if __name__ == "__main__":
    unittest.main()
