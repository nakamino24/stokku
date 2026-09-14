# Architecture Decision Records

| ADR  | Decision                                 | Status              |
| ---- | ---------------------------------------- | ------------------- |
| 0001 | WMS-only product boundary                | Accepted for review |
| 0002 | Modular monolith and deployment topology | Accepted for review |
| 0003 | Tenant and warehouse authorization       | Accepted for review |
| 0004 | Authentication and session model         | Accepted for review |
| 0005 | Inventory ledger and projection          | Accepted for review |
| 0006 | UOM, lot, and serial tracking            | Accepted for review |
| 0007 | API versioning and command contract      | Accepted for review |
| 0008 | Outbox and asynchronous jobs             | Accepted for review |
| 0009 | Migration, backup, and recovery strategy | Accepted for review |
| 0010 | Mobile and barcode execution             | Accepted for review |
| 0011 | Argon2id password hashing                | Reference hardening |
| 0012 | Managed refresh sessions                 | Reference hardening |
| 0013 | Transactional email provider             | Reference hardening |
| 0014 | Transactional email outbox               | Reference hardening |
| 0015 | Append-only ledger and audit controls    | Reference hardening |
| 0016 | Target architecture transition           | Accepted for review |
| 0017 | Authorization adapter parity probe       | Approved — implemented under feature flag |

"Accepted for review" means the proposal is the working baseline. "Reference
hardening" records a control applied to the active implementation; it does not
select the target framework or persistence architecture. "Approved — implemented
under feature flag" means the ADR passes review and its implementation is
inactive until the flag is enabled. A superseding ADR must link the prior
decision; identifiers are never reused.
