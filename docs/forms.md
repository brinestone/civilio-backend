# Forms Documentation

Forms permit users to update existing survey data, import new data as well as perform deletions and revisions.

Users are also permitted to define/import form structure from different sources.

* **xlsf** - Import form structures exported from external tools (e.g. KoboToolbox, etc) in **XLSF format**.

## Database Structure Overview

```mermaid
erDiagram
    form_definitions ||--o{ form_versions : "defines"
    form_versions ||--o{ form_sections : "contains"
    form_versions ||--o{ form_fields : "has"
    form_versions ||--o{ form_submissions : "tracks"
    form_versions ||--o{ submission_versions : "historical record"
    
    form_versions ||--o| form_versions : "parent version"
    
    form_sections ||--o{ form_fields : "groups"
    
    form_fields ||--o| facility_meta_fields : "metadata"
    form_fields ||--o{ submission_responses : "answered in"
    
    form_submissions ||--o{ submission_versions : "versions"
    
    submission_versions ||--o{ submission_responses : "contains values"

    form_definitions {
        text slug PK
        text label
        text logo
        text description
        text createdBy
        timestamp createdAt
        timestamp updatedAt
    }

    form_versions {
        uuid id PK
        text label
        text form FK
        uuid parent_id FK
        boolean isCurrent
        timestamp createdAt
        timestamp updatedAt
    }

    form_sections {
        text key PK
        uuid formVersion PK, FK
        text title
        jsonb relevance
        timestamp createdAt
        timestamp updatedAt
    }

    form_fields {
        uuid fieldId PK
        uuid formVersion PK, FK
        text sectionKey FK
        text title
        text description
        integer span
        jsonb relevance
        formFieldType fieldType
    }

    facility_meta_fields {
        uuid fieldId PK, FK
        uuid formVersion PK, FK
        text metaLabel
        text metaDescription
    }

    form_submissions {
        bigint index PK
        uuid formVersion FK
        text validationCode
        timestamp recordedAt
        timestamp updatedAt
    }

    submission_versions {
        uuid id PK
        bigint submissionIndex FK
        uuid formVersion FK
        boolean approved
        timestamp approvedAt
        boolean isCurrent
    }

    submission_responses {
        bigint submissionIndex PK, FK
        uuid fieldId PK, FK
        uuid formVersion PK, FK
        uuid responseVersionId PK, FK
        text value
    }

```

### Referential Integrity & Cascades

| Table | Dependency (FK) | On Delete | Description |
| --- | --- | --- | --- |
| **form_versions** | `form` | `CASCADE` | Versions are deleted if the parent definition is removed. |
| **form_versions** | `parent_id` | `SET NULL` | Preserves history if the immediate parent version is deleted. |
| **form_sections** | `formVersion` | `CASCADE` | Deleting a version removes its UI structure. |
| **form_fields** | `sectionKey` | `CASCADE` | Fields are cleaned up if their section is deleted. |
| **form_submissions** | `formVersion` | `CASCADE` | Deleting a version wipes all associated data entries. |
| **submission_versions** | `index` | `CASCADE` | Removing a submission wipes all historical revisions. |
| **submission_responses** | `responseVersionId` | `CASCADE` | Responses are purged when their specific version is deleted. |
