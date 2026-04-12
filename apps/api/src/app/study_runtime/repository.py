from __future__ import annotations

from contextlib import contextmanager
from dataclasses import asdict
from decimal import Decimal
from uuid import UUID
from typing import Any, Iterator

import psycopg
from psycopg.rows import dict_row
from psycopg.types.json import Json

from app.study_runtime.seed_pack import (
    SEED_ASSET_MANIFESTS,
    SEED_CONSUMER_TWINS,
    SEED_PERSONA_PROFILES,
    SEED_STIMULI,
    SEED_TARGET_AUDIENCES,
    SEED_TWIN_VERSIONS,
)
from app.study_runtime.service import CreateStudyCommand, ImportAssetCommand


class PostgresStudyRuntimeRepository:
    def __init__(self, database_url: str) -> None:
        self._database_url = database_url

    @contextmanager
    def _connect(self) -> Iterator[psycopg.Connection[Any]]:
        with psycopg.connect(self._database_url, row_factory=dict_row) as connection:
            yield connection

    def create_study_bundle(self, command: CreateStudyCommand) -> dict[str, Any]:
        payload = asdict(command)
        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO study (
                      business_question,
                      study_type,
                      brand,
                      category,
                      target_groups,
                      status,
                      owner_team_id
                    )
                    VALUES (%(business_question)s, %(study_type)s, %(brand)s, %(category)s, %(target_groups)s, 'draft', %(owner_team_id)s)
                    RETURNING *
                    """,
                    payload,
                )
                study = cursor.fetchone()

                cursor.execute(
                    """
                    INSERT INTO study_plan (
                      study_id,
                      draft_status,
                      last_generated_by
                    )
                    VALUES (%s, 'drafting', %s)
                    RETURNING *
                    """,
                    (study["id"], command.generated_by),
                )
                study_plan = cursor.fetchone()

                cursor.execute(
                    """
                    INSERT INTO study_plan_version (
                      study_id,
                      version_no,
                      business_goal_json,
                      twin_version_ids,
                      stimulus_ids,
                      anchor_set_id,
                      agent_config_ids,
                      qual_config_json,
                      quant_config_json,
                      estimated_cost,
                      approval_required,
                      approval_status,
                      generated_by,
                      status
                    )
                    VALUES (%s, 1, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'draft', %s, 'draft')
                    RETURNING *
                    """,
                    (
                        study["id"],
                        Json(command.business_goal),
                        command.twin_version_ids,
                        command.stimulus_ids,
                        command.anchor_set_id,
                        command.agent_config_ids,
                        Json(command.qual_config),
                        Json(command.quant_config),
                        command.estimated_cost,
                        command.approval_required,
                        command.generated_by,
                    ),
                )
                version = cursor.fetchone()

                cursor.execute(
                    """
                    UPDATE study_plan
                    SET current_draft_version_id = %s, updated_at = now()
                    WHERE id = %s
                    RETURNING *
                    """,
                    (version["id"], study_plan["id"]),
                )
                study_plan = cursor.fetchone()

            connection.commit()

        return {
            "study": self._serialize_record(study),
            "study_plan": self._serialize_record(study_plan),
            "study_plan_version": self._serialize_record(version),
        }

    def get_study_bundle(self, study_id: str) -> dict[str, Any] | None:
        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute("SELECT * FROM study WHERE id = %s", (study_id,))
                study = cursor.fetchone()
                if study is None:
                    return None

                cursor.execute("SELECT * FROM study_plan WHERE study_id = %s", (study_id,))
                plan = cursor.fetchone()

                cursor.execute(
                    "SELECT * FROM study_plan_version WHERE study_id = %s ORDER BY version_no",
                    (study_id,),
                )
                versions = cursor.fetchall()

                cursor.execute(
                    """
                    SELECT * FROM approval_gate
                    WHERE scope_type = 'study_plan_version'
                      AND scope_ref_id = ANY(%s::uuid[])
                    ORDER BY created_at
                    """,
                    ([version["id"] for version in versions] or [None],),
                )
                approval_gates = cursor.fetchall()

                cursor.execute(
                    "SELECT * FROM study_run WHERE study_id = %s ORDER BY created_at DESC",
                    (study_id,),
                )
                runs = cursor.fetchall()

                run_ids = [run["id"] for run in runs]
                run_steps: list[dict[str, Any]] = []
                run_approval_gates: list[dict[str, Any]] = []
                if run_ids:
                    cursor.execute(
                        """
                        SELECT * FROM run_step
                        WHERE study_run_id = ANY(%s::uuid[])
                        ORDER BY created_at
                        """,
                        (run_ids,),
                    )
                    run_steps = cursor.fetchall()
                    cursor.execute(
                        """
                        SELECT * FROM approval_gate
                        WHERE scope_type = 'study_run'
                          AND scope_ref_id = ANY(%s::uuid[])
                        ORDER BY created_at
                        """,
                        (run_ids,),
                    )
                    run_approval_gates = cursor.fetchall()

                # Fetch artifacts for all runs
                artifacts: list[dict[str, Any]] = []
                if run_ids:
                    cursor.execute(
                        """
                        SELECT * FROM artifact
                        WHERE study_run_id = ANY(%s::uuid[])
                        ORDER BY created_at
                        """,
                        (run_ids,),
                    )
                    artifacts = cursor.fetchall()

        steps_by_run: dict[str, list[dict[str, Any]]] = {}
        for step in run_steps:
            steps_by_run.setdefault(str(step["study_run_id"]), []).append(self._serialize_record(step))

        approvals_by_run: dict[str, list[dict[str, Any]]] = {}
        for gate in run_approval_gates:
            approvals_by_run.setdefault(str(gate["scope_ref_id"]), []).append(self._serialize_record(gate))

        serialized_runs: list[dict[str, Any]] = []
        for run in runs:
            serialized_run = self._serialize_record(run)
            run_id = str(run["id"])
            serialized_run["run_steps"] = steps_by_run.get(run_id, [])
            serialized_run["approval_gates"] = approvals_by_run.get(run_id, [])
            serialized_runs.append(serialized_run)

        return {
            "study": self._serialize_record(study),
            "study_plan": self._serialize_record(plan),
            "plan_versions": [self._serialize_record(version) for version in versions],
            "approval_gates": [self._serialize_record(gate) for gate in approval_gates],
            "study_runs": serialized_runs,
            "artifacts": [self._serialize_record(a) for a in artifacts],
        }

    def get_plan_version(self, study_id: str, version_id: str) -> dict[str, Any] | None:
        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT * FROM study_plan_version WHERE study_id = %s AND id = %s",
                    (study_id, version_id),
                )
                record = cursor.fetchone()
        return self._serialize_record(record) if record else None

    def submit_plan_for_approval(self, study_id: str, version_id: str, requested_by: str) -> dict[str, Any]:
        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    UPDATE study_plan_version
                    SET approval_status = 'pending_approval', updated_at = now()
                    WHERE study_id = %s AND id = %s
                    """,
                    (study_id, version_id),
                )
                cursor.execute(
                    """
                    INSERT INTO approval_gate (
                      scope_type,
                      scope_ref_id,
                      approval_type,
                      status,
                      requested_by
                    )
                    VALUES ('study_plan_version', %s, 'plan', 'requested', %s)
                    RETURNING *
                    """,
                    (version_id, requested_by),
                )
                gate = cursor.fetchone()
                cursor.execute(
                    """
                    UPDATE study_plan
                    SET draft_status = 'awaiting_review', updated_at = now()
                    WHERE study_id = %s
                    """,
                    (study_id,),
                )
                cursor.execute(
                    """
                    UPDATE study
                    SET status = 'planning', updated_at = now()
                    WHERE id = %s
                    """,
                    (study_id,),
                )
            connection.commit()
        return self._serialize_record(gate)

    def approve_plan(self, study_id: str, version_id: str, approved_by: str, decision_comment: str | None) -> dict[str, Any]:
        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    UPDATE study_plan_version
                    SET approval_status = 'approved',
                        approved_at = now(),
                        status = 'active',
                        updated_at = now()
                    WHERE study_id = %s AND id = %s
                    RETURNING *
                    """,
                    (study_id, version_id),
                )
                version = cursor.fetchone()
                cursor.execute(
                    """
                    UPDATE approval_gate
                    SET status = 'approved',
                        approved_by = %s,
                        decision_comment = %s,
                        updated_at = now()
                    WHERE scope_type = 'study_plan_version'
                      AND scope_ref_id = %s
                      AND approval_type = 'plan'
                      AND status = 'requested'
                    """,
                    (approved_by, decision_comment, version_id),
                )
                cursor.execute(
                    """
                    UPDATE study_plan
                    SET latest_approved_version_id = %s,
                        current_execution_version_id = %s,
                        draft_status = 'approved',
                        updated_at = now()
                    WHERE study_id = %s
                    """,
                    (version_id, version_id, study_id),
                )
                cursor.execute(
                    """
                    UPDATE study
                    SET status = 'planning',
                        updated_at = now()
                    WHERE id = %s
                    """,
                    (study_id,),
                )
            connection.commit()
        return self._serialize_record(version)

    def create_run(self, study_id: str, version_id: str, requested_by: str) -> dict[str, Any]:
        del requested_by
        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO study_run (
                      study_id,
                      study_plan_version_id,
                      run_type,
                      status
                    )
                    VALUES (%s, %s, 'initial', 'queued')
                    RETURNING *
                    """,
                    (study_id, version_id),
                )
                run = cursor.fetchone()
                cursor.execute(
                    """
                    INSERT INTO run_step (
                      study_run_id,
                      step_type,
                      status,
                      attempt_no
                    )
                    VALUES (%s, 'twin_preparation', 'pending', 1)
                    RETURNING *
                    """,
                    (run["id"],),
                )
                cursor.fetchone()
                cursor.execute(
                    """
                    UPDATE study
                    SET status = 'running',
                        updated_at = now()
                    WHERE id = %s
                    """,
                    (study_id,),
                )
            connection.commit()
        return self._serialize_record(run)

    def bind_workflow(self, run_id: str, workflow_id: str, workflow_run_id: str | None) -> None:
        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    UPDATE study_run
                    SET workflow_id = %s,
                        workflow_run_id = %s,
                        updated_at = now()
                    WHERE id = %s
                    """,
                    (workflow_id, workflow_run_id, run_id),
                )
            connection.commit()

    def get_run(self, study_id: str, run_id: str) -> dict[str, Any] | None:
        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT * FROM study_run WHERE study_id = %s AND id = %s",
                    (study_id, run_id),
                )
                run = cursor.fetchone()
                if run is None:
                    return None
                cursor.execute(
                    "SELECT * FROM run_step WHERE study_run_id = %s ORDER BY created_at",
                    (run_id,),
                )
                steps = cursor.fetchall()
                cursor.execute(
                    """
                    SELECT * FROM approval_gate
                    WHERE (scope_type = 'study_run' AND scope_ref_id = %s)
                       OR (scope_type = 'run_step' AND scope_ref_id IN (
                            SELECT id FROM run_step WHERE study_run_id = %s
                          ))
                    ORDER BY created_at
                    """,
                    (run_id, run_id),
                )
                approval_gates = cursor.fetchall()
        payload = self._serialize_record(run)
        payload["run_steps"] = [self._serialize_record(step) for step in steps]
        payload["approval_gates"] = [self._serialize_record(gate) for gate in approval_gates]
        return payload

    def bootstrap_seed_assets(self) -> dict[str, Any]:
        with self._connect() as connection:
            with connection.cursor() as cursor:
                for audience in SEED_TARGET_AUDIENCES:
                    cursor.execute(
                        """
                        INSERT INTO target_audience (id, label, category, description)
                        VALUES (%s, %s, %s, %s)
                        ON CONFLICT (id) DO UPDATE
                        SET label = EXCLUDED.label,
                            category = EXCLUDED.category,
                            description = EXCLUDED.description,
                            updated_at = now()
                        """,
                        (
                            audience["id"],
                            audience["label"],
                            audience["category"],
                            audience["description"],
                        ),
                    )

                for profile in SEED_PERSONA_PROFILES:
                    cursor.execute(
                        """
                        INSERT INTO persona_profile (id, target_audience_id, label, profile_json)
                        VALUES (%s, %s, %s, %s)
                        ON CONFLICT (id) DO UPDATE
                        SET target_audience_id = EXCLUDED.target_audience_id,
                            label = EXCLUDED.label,
                            profile_json = EXCLUDED.profile_json,
                            updated_at = now()
                        """,
                        (
                            profile["id"],
                            profile["target_audience_id"],
                            profile["label"],
                            Json(profile["profile_json"]),
                        ),
                    )

                for asset in SEED_ASSET_MANIFESTS:
                    cursor.execute(
                        """
                        INSERT INTO asset_manifest (
                          id, asset_kind, name, source_format, storage_uri, metadata_json, review_status, created_by
                        )
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (id) DO UPDATE
                        SET name = EXCLUDED.name,
                            source_format = EXCLUDED.source_format,
                            storage_uri = EXCLUDED.storage_uri,
                            metadata_json = EXCLUDED.metadata_json,
                            review_status = EXCLUDED.review_status,
                            updated_at = now()
                        """,
                        (
                            asset["id"],
                            asset["asset_kind"],
                            asset["name"],
                            asset["source_format"],
                            asset["storage_uri"],
                            Json(asset["metadata_json"]),
                            asset["review_status"],
                            asset["created_by"],
                        ),
                    )

                for twin in SEED_CONSUMER_TWINS:
                    cursor.execute(
                        """
                        INSERT INTO consumer_twin (
                          id, target_audience_id, persona_profile_id, business_purpose, applicable_scenarios, owner
                        )
                        VALUES (%s, %s, %s, %s, %s, %s)
                        ON CONFLICT (id) DO UPDATE
                        SET target_audience_id = EXCLUDED.target_audience_id,
                            persona_profile_id = EXCLUDED.persona_profile_id,
                            business_purpose = EXCLUDED.business_purpose,
                            applicable_scenarios = EXCLUDED.applicable_scenarios,
                            owner = EXCLUDED.owner,
                            updated_at = now()
                        """,
                        (
                            twin["id"],
                            twin["target_audience_id"],
                            twin["persona_profile_id"],
                            twin["business_purpose"],
                            twin["applicable_scenarios"],
                            twin["owner"],
                        ),
                    )

                for version in SEED_TWIN_VERSIONS:
                    cursor.execute(
                        """
                        INSERT INTO twin_version (
                          id, consumer_twin_id, version_no, persona_profile_snapshot_json, anchor_set_id,
                          agent_config_id, source_lineage, benchmark_status
                        )
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (id) DO UPDATE
                        SET persona_profile_snapshot_json = EXCLUDED.persona_profile_snapshot_json,
                            source_lineage = EXCLUDED.source_lineage,
                            benchmark_status = EXCLUDED.benchmark_status
                        """,
                        (
                            version["id"],
                            version["consumer_twin_id"],
                            version["version_no"],
                            Json(version["persona_profile_snapshot_json"]),
                            version["anchor_set_id"],
                            version["agent_config_id"],
                            Json(version["source_lineage"]),
                            version["benchmark_status"],
                        ),
                    )

                for stimulus in SEED_STIMULI:
                    cursor.execute(
                        """
                        INSERT INTO stimulus (
                          id, name, stimulus_type, asset_manifest_id, description, stimulus_json, status
                        )
                        VALUES (%s, %s, %s, %s, %s, %s, 'ready')
                        ON CONFLICT (id) DO UPDATE
                        SET name = EXCLUDED.name,
                            stimulus_type = EXCLUDED.stimulus_type,
                            asset_manifest_id = EXCLUDED.asset_manifest_id,
                            description = EXCLUDED.description,
                            stimulus_json = EXCLUDED.stimulus_json,
                            updated_at = now()
                        """,
                        (
                            stimulus["id"],
                            stimulus["name"],
                            stimulus["stimulus_type"],
                            stimulus["asset_manifest_id"],
                            stimulus["description"],
                            Json(stimulus["stimulus_json"]),
                        ),
                    )
            connection.commit()

        return {
            "target_audiences": [self._serialize_record(item) for item in SEED_TARGET_AUDIENCES],
            "twin_versions": [
                {
                    "id": item["id"],
                    "name": item["persona_profile_snapshot_json"].get("name"),
                    "version_no": item["version_no"],
                }
                for item in SEED_TWIN_VERSIONS
            ],
            "stimuli": [
                {
                    "id": item["id"],
                    "name": item["name"],
                    "stimulus_type": item["stimulus_type"],
                }
                for item in SEED_STIMULI
            ],
        }

    def list_studies(self) -> list[dict[str, Any]]:
        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT
                      s.*,
                      sp.current_execution_version_id,
                      spv.version_no AS latest_plan_version_no,
                      sr.status AS current_run_status
                    FROM study s
                    LEFT JOIN study_plan sp ON sp.study_id = s.id
                    LEFT JOIN study_plan_version spv ON spv.id = sp.latest_approved_version_id
                    LEFT JOIN LATERAL (
                      SELECT status
                      FROM study_run
                      WHERE study_id = s.id
                      ORDER BY created_at DESC
                      LIMIT 1
                    ) sr ON TRUE
                    ORDER BY s.updated_at DESC
                    """
                )
                rows = cursor.fetchall()
        return [self._serialize_record(row) for row in rows]

    def list_consumer_twins(self) -> list[dict[str, Any]]:
        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT
                      ct.id,
                      ct.business_purpose,
                      ct.status,
                      ct.owner,
                      ta.label AS target_audience_label,
                      tv.id AS latest_version_id,
                      tv.version_no AS latest_version_no,
                      tv.persona_profile_snapshot_json,
                      tv.source_lineage
                    FROM consumer_twin ct
                    LEFT JOIN target_audience ta ON ta.id = ct.target_audience_id
                    LEFT JOIN LATERAL (
                      SELECT *
                      FROM twin_version
                      WHERE consumer_twin_id = ct.id
                      ORDER BY version_no DESC
                      LIMIT 1
                    ) tv ON TRUE
                    ORDER BY ct.created_at
                    """
                )
                rows = cursor.fetchall()
        return [self._serialize_record(row) for row in rows]

    def list_target_audiences(self) -> list[dict[str, Any]]:
        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT *
                    FROM target_audience
                    ORDER BY created_at
                    """
                )
                rows = cursor.fetchall()
        return [self._serialize_record(row) for row in rows]

    def list_persona_profiles(self) -> list[dict[str, Any]]:
        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT
                      pp.*,
                      ta.label AS target_audience_label
                    FROM persona_profile pp
                    JOIN target_audience ta ON ta.id = pp.target_audience_id
                    ORDER BY pp.created_at
                    """
                )
                rows = cursor.fetchall()
        return [self._serialize_record(row) for row in rows]

    def get_persona_profile(self, profile_id: str) -> dict[str, Any] | None:
        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT
                      pp.*,
                      ta.label AS target_audience_label
                    FROM persona_profile pp
                    JOIN target_audience ta ON ta.id = pp.target_audience_id
                    WHERE pp.id = %s
                    """,
                    (profile_id,),
                )
                row = cursor.fetchone()
        return self._serialize_record(row) if row else None

    def list_twin_versions(self) -> list[dict[str, Any]]:
        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT
                      tv.*,
                      ct.business_purpose,
                      ta.label AS target_audience_label
                    FROM twin_version tv
                    JOIN consumer_twin ct ON ct.id = tv.consumer_twin_id
                    LEFT JOIN target_audience ta ON ta.id = ct.target_audience_id
                    ORDER BY ct.created_at, tv.version_no DESC
                    """
                )
                rows = cursor.fetchall()
        return [self._serialize_record(row) for row in rows]

    def get_twin_versions(self, twin_version_ids: list[str]) -> list[dict[str, Any]]:
        if not twin_version_ids:
            return []
        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT
                      tv.*,
                      ct.business_purpose,
                      ta.label AS target_audience_label
                    FROM twin_version tv
                    JOIN consumer_twin ct ON ct.id = tv.consumer_twin_id
                    LEFT JOIN target_audience ta ON ta.id = ct.target_audience_id
                    WHERE tv.id = ANY(%s::uuid[])
                    ORDER BY tv.version_no DESC
                    """,
                    (twin_version_ids,),
                )
                rows = cursor.fetchall()
        return [self._serialize_record(row) for row in rows]

    def list_stimuli(self) -> list[dict[str, Any]]:
        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT
                      s.*,
                      am.name AS asset_name,
                      am.review_status
                    FROM stimulus s
                    LEFT JOIN asset_manifest am ON am.id = s.asset_manifest_id
                    ORDER BY s.created_at
                    """
                )
                rows = cursor.fetchall()
        return [self._serialize_record(row) for row in rows]

    def get_stimuli_by_ids(self, stimulus_ids: list[str]) -> list[dict[str, Any]]:
        if not stimulus_ids:
            return []
        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT
                      s.*,
                      am.name AS asset_name,
                      am.review_status
                    FROM stimulus s
                    LEFT JOIN asset_manifest am ON am.id = s.asset_manifest_id
                    WHERE s.id = ANY(%s::uuid[])
                    ORDER BY s.created_at
                    """,
                    (stimulus_ids,),
                )
                rows = cursor.fetchall()
        return [self._serialize_record(row) for row in rows]

    def import_asset(self, command: ImportAssetCommand) -> dict[str, Any]:
        payload = asdict(command)
        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO asset_manifest (
                      asset_kind, name, source_format, storage_uri, metadata_json, review_status, created_by
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    RETURNING *
                    """,
                    (
                        command.asset_kind,
                        command.name,
                        command.source_format,
                        command.storage_uri,
                        Json(command.metadata),
                        "pending_review" if command.asset_kind == "quant_dataset" else "approved",
                        command.created_by,
                    ),
                )
                asset = cursor.fetchone()

                job_status = "pending_review" if command.asset_kind == "quant_dataset" else "ready"
                cursor.execute(
                    """
                    INSERT INTO ingestion_job (
                      asset_manifest_id, job_type, status, result_json
                    )
                    VALUES (%s, %s, %s, %s)
                    RETURNING *
                    """,
                    (
                        asset["id"],
                        "mapping" if command.asset_kind == "quant_dataset" else "parse",
                        job_status,
                        Json({"study_id": command.study_id, "asset_kind": command.asset_kind}),
                    ),
                )
                job = cursor.fetchone()

                dataset_mapping = None
                if command.asset_kind == "quant_dataset":
                    cursor.execute(
                        """
                        INSERT INTO dataset_schema_mapping (
                          asset_manifest_id, mapping_status, mapping_json
                        )
                        VALUES (%s, 'pending_review', %s)
                        RETURNING *
                        """,
                        (
                            asset["id"],
                            Json({"columns": payload["metadata"].get("columns", []), "notes": "Awaiting human review"}),
                        ),
                    )
                    dataset_mapping = cursor.fetchone()

                derived_stimulus = None
                if command.asset_kind == "stimulus_asset":
                    cursor.execute(
                        """
                        INSERT INTO stimulus (
                          name, stimulus_type, asset_manifest_id, description, stimulus_json, status
                        )
                        VALUES (%s, %s, %s, %s, %s, 'ready')
                        RETURNING *
                        """,
                        (
                            command.name,
                            str(command.metadata.get("stimulus_type", "concept")),
                            asset["id"],
                            str(command.metadata.get("description", "")),
                            Json(command.metadata),
                        ),
                    )
                    derived_stimulus = cursor.fetchone()
            connection.commit()

        response = {
            "asset": self._serialize_record(asset),
            "job": self._serialize_record(job),
        }
        if dataset_mapping:
            response["dataset_mapping"] = self._serialize_record(dataset_mapping)
        if derived_stimulus:
            response["stimulus"] = self._serialize_record(derived_stimulus)
        return response

    def list_ingestion_jobs(self) -> list[dict[str, Any]]:
        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute("SELECT * FROM ingestion_job ORDER BY created_at DESC")
                rows = cursor.fetchall()
        return [self._serialize_record(row) for row in rows]

    def list_dataset_mappings(self) -> list[dict[str, Any]]:
        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute("SELECT * FROM dataset_schema_mapping ORDER BY created_at DESC")
                rows = cursor.fetchall()
        return [self._serialize_record(row) for row in rows]

    def _serialize_record(self, record: dict[str, Any] | None) -> dict[str, Any] | None:
        if record is None:
            return None
        return {key: self._serialize_value(value) for key, value in record.items()}

    def _serialize_value(self, value: Any) -> Any:
        if isinstance(value, dict):
            return {key: self._serialize_value(item) for key, item in value.items()}
        if isinstance(value, list):
            return [self._serialize_value(item) for item in value]
        if isinstance(value, tuple):
            return [self._serialize_value(item) for item in value]
        if isinstance(value, Decimal):
            return str(value)
        if isinstance(value, UUID):
            return str(value)
        if hasattr(value, "isoformat"):
            return value.isoformat()
        return value

    # ------------------------------------------------------------------
    #  Agent messages
    # ------------------------------------------------------------------

    def get_study_messages(
        self,
        study_id: str,
        *,
        after_id: str | None = None,
        limit: int = 100,
    ) -> list[dict[str, Any]]:
        with self._connect() as connection:
            with connection.cursor() as cursor:
                if after_id:
                    cursor.execute(
                        """
                        SELECT * FROM study_message
                        WHERE study_id = %s AND created_at > (
                            SELECT created_at FROM study_message WHERE id = %s
                        )
                        ORDER BY created_at ASC
                        LIMIT %s
                        """,
                        (study_id, after_id, limit),
                    )
                else:
                    cursor.execute(
                        """
                        SELECT * FROM study_message
                        WHERE study_id = %s
                        ORDER BY created_at ASC
                        LIMIT %s
                        """,
                        (study_id, limit),
                    )
                rows = cursor.fetchall()
        return [self._serialize_record(row) for row in rows]

    def create_study_message(
        self,
        study_id: str,
        role: str,
        content: str,
        message_type: str = "text",
        metadata: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        from psycopg.types.json import Json as PgJson

        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO study_message (study_id, role, content, message_type, metadata_json)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING *
                    """,
                    (study_id, role, content, message_type, PgJson(metadata or {})),
                )
                row = cursor.fetchone()
            connection.commit()
        return self._serialize_record(row)

    def create_persona_chain(
        self,
        audience_label: str,
        profile_data: dict[str, Any],
    ) -> dict[str, Any]:
        """Create target_audience → persona_profile → consumer_twin → twin_version in one transaction."""
        from psycopg.types.json import Json as PgJson

        name = profile_data.get("name", audience_label)
        profile_json = {
            "name": name,
            "audience_label": audience_label,
            "age_range": profile_data.get("age_range", "未知"),
            "built_from": "访谈文本 AI 提取",
            "research_readiness": ["概念筛选", "命名测试"],
            "version_notes": f"基于 {audience_label} 访谈文本自动生成。",
            "system_prompt": profile_data.get("system_prompt", f"你是一位{audience_label}消费者。"),
            "demographics": profile_data.get("demographics", ""),
            "behavioral": profile_data.get("behavioral", ""),
            "psychological": profile_data.get("psychological", ""),
            "needs_pain_points": profile_data.get("needs_pain_points", ""),
        }

        with self._connect() as connection:
            with connection.cursor() as cursor:
                # 1. target_audience
                cursor.execute(
                    """
                    INSERT INTO target_audience (label, category, description)
                    VALUES (%s, %s, %s)
                    RETURNING id
                    """,
                    (audience_label, "User Generated", profile_data.get("demographics", "")),
                )
                ta_id = str(cursor.fetchone()["id"])

                # 2. persona_profile
                cursor.execute(
                    """
                    INSERT INTO persona_profile (target_audience_id, label, profile_json)
                    VALUES (%s, %s, %s)
                    RETURNING id
                    """,
                    (ta_id, f"{name}画像", PgJson(profile_json)),
                )
                pp_id = str(cursor.fetchone()["id"])

                # 3. consumer_twin
                cursor.execute(
                    """
                    INSERT INTO consumer_twin (target_audience_id, persona_profile_id, business_purpose, applicable_scenarios, owner)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING id
                    """,
                    (ta_id, pp_id, f"代表{audience_label}评估消费者研究。", ["concept_screening", "naming_test"], "User"),
                )
                ct_id = str(cursor.fetchone()["id"])

                # 4. twin_version
                cursor.execute(
                    """
                    INSERT INTO twin_version (consumer_twin_id, version_no, persona_profile_snapshot_json, source_lineage, benchmark_status)
                    VALUES (%s, 1, %s, %s, 'draft')
                    RETURNING id
                    """,
                    (
                        ct_id,
                        PgJson(profile_json),
                        PgJson({"source": "interview_text_extraction", "notes": f"AI extracted from {audience_label} interview text"}),
                    ),
                )
                tv_id = str(cursor.fetchone()["id"])

            connection.commit()

        return {
            "target_audience_id": ta_id,
            "persona_profile_id": pp_id,
            "consumer_twin_id": ct_id,
            "twin_version_id": tv_id,
            "name": name,
            "audience_label": audience_label,
            "profile": profile_json,
        }

    def create_plan_version_from_edit(
        self,
        study_id: str,
        base_version: dict[str, Any],
        twin_version_ids: list[str],
        stimulus_ids: list[str],
    ) -> dict[str, Any]:
        """Create a new study_plan_version based on an edited configuration."""
        from psycopg.types.json import Json as PgJson

        plan_id = str(base_version.get("study_plan_id", ""))
        base_version_no = int(base_version.get("version_no", 0))
        new_version_no = base_version_no + 1

        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO study_plan_version (
                      study_plan_id, version_no, approval_status,
                      twin_version_ids, stimulus_ids,
                      qual_config_json, quant_config_json,
                      generated_by, approval_required
                    )
                    VALUES (%s, %s, 'draft', %s, %s, %s, %s, %s, true)
                    RETURNING *
                    """,
                    (
                        plan_id,
                        new_version_no,
                        twin_version_ids,
                        stimulus_ids,
                        PgJson(base_version.get("qual_config_json", {})),
                        PgJson(base_version.get("quant_config_json", {})),
                        "user_edit",
                    ),
                )
                row = cursor.fetchone()
            connection.commit()
        return self._serialize_record(row)

    # ------------------------------------------------------------------
    #  Memory
    # ------------------------------------------------------------------

    def list_recent_memories(self, *, limit: int = 10) -> list[dict[str, Any]]:
        """Return the most recent memories across all studies."""
        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT * FROM study_memory
                    WHERE superseded_by IS NULL
                    ORDER BY extracted_at DESC
                    LIMIT %s
                    """,
                    (limit,),
                )
                rows = cursor.fetchall()
        return [self._serialize_record(row) for row in rows]

    def list_study_memories(self, study_id: str) -> list[dict[str, Any]]:
        """Return memories for a specific study."""
        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT * FROM study_memory
                    WHERE study_id = %s
                    ORDER BY extracted_at DESC
                    """,
                    (study_id,),
                )
                rows = cursor.fetchall()
        return [self._serialize_record(row) for row in rows]

    def list_all_memories(self) -> list[dict[str, Any]]:
        """Return all active memories across studies."""
        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT sm.*, s.business_question AS study_question
                    FROM study_memory sm
                    JOIN study s ON s.id = sm.study_id
                    WHERE sm.superseded_by IS NULL
                    ORDER BY sm.extracted_at DESC
                    """
                )
                rows = cursor.fetchall()
        return [self._serialize_record(row) for row in rows]
