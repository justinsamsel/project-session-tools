# Examples

GOOD/BAD pairs demonstrating expected output quality. Use these to calibrate extraction specificity, merge behavior, and file structure. Not copy-paste templates; patterns to match.

---

## Example 1: STATUS.md Entry

### GOOD

```markdown
## 2026-03-15, Branch Office Incident Triage

**Completed:**
- Triaged INC-000259 (paging/printing/reporting slowness) and INC-000258 (printer failures) as correlated incidents at Contoso branch office
- Identified spooler service hang on CORP-PRINT-01 as root cause for INC-000258
- Manually restarted Print Spooler service on CORP-PRINT-01; confirmed printing restored for Contoso warehouse floor
- Cleared [EDR platform] process alert on CORP-PRINT-01 as false positive

**In Progress:**
- Root cause analysis for INC-000259 reporting slowness (suspected but not confirmed link to CORP-PRINT-01 spooler hang)

**Next Steps:**
- Monitor branch office printing stability for 48 hours post-fix
- Escalate INC-000259 to Robin if reporting slowness persists after CORP-PRINT-01 stabilization
```

**Why this is GOOD:** Each item has the ticket number, affected system, specific action taken, and outcome. The "In Progress" item is honest about what's confirmed vs. suspected. Next steps are concrete with a time window and escalation path.

### BAD

```markdown
## 2026-03-15, Session Update

**Completed:**
- Looked into the branch office printing issues
- Fixed the printer problem
- Investigated a security alert

**In Progress:**
- Still working on slowness issues

**Next Steps:**
- Keep monitoring
- Follow up later
```

**Why this is BAD:** No ticket numbers, no server names, no specifics on what was done. "Fixed the printer problem": which printer? Which server? What fix? "Keep monitoring": monitoring what, for how long, what constitutes success? A future session reading this would need to re-investigate from scratch.

---

## Example 2: DECISIONS.md Entry

### GOOD

```markdown
### EAP-TLS over EAP-PEAP for 802.1X, 2026-02-20

**Context:** Wi-Fi upgrade requires 802.1X authentication. Two viable protocols: EAP-TLS (certificate-based) and EAP-PEAP (password-based with server cert validation). Decision needed before Casey Rowe begins NPS/RADIUS configuration.
**Decision:** EAP-TLS with device certificates issued from two-tier AD CS PKI (offline root + online issuing CA).
**Alternatives considered:** EAP-PEAP rejected because it still depends on AD passwords, which are being phased out for workstation auth. Also creates a credential exposure surface if the RADIUS shared secret is compromised.
**Implications:** Requires full AD CS PKI deployment (two-tier) before Wi-Fi cutover. Certificate auto-enrollment GPO must target all domain-joined machines. Renewal lifecycle management becomes an ongoing operational responsibility. NPS policies will reference certificate OIDs, not user/group membership.
```

**Why this is GOOD:** Context explains why the decision existed and who it blocked. Decision is specific (EAP-TLS, two-tier PKI, device certs). Alternatives section names the rejected option with the key reason. Implications list concrete downstream work items that a future session can act on.

### BAD

```markdown
### Wi-Fi Authentication, 2026-02-20

**Context:** Need to set up Wi-Fi auth.
**Decision:** Using certificates.
**Alternatives considered:** Could have used passwords but decided not to.
**Implications:** Need to set up a PKI.
```

**Why this is BAD:** "Using certificates": which protocol? What kind of certificates? From what CA? "Could have used passwords": which protocol specifically? Why was it rejected? "Need to set up a PKI": one-tier? Two-tier? What's the deployment sequence? Every line is true but operationally useless.

---

## Example 3: Conflict Handling

> **Merge principle:** Clean-state merge adds new facts to existing rows without dropping untouched content. Never rebuild a section from only what was discussed this session. Preserve all existing rows and values; add or update in place.

### GOOD: Superseded Decision

Existing DECISIONS.md entry:
```markdown
### Terraform for VM provisioning, 2026-01-10

**Context:** Need repeatable VM provisioning on Hyper-V cluster.
**Decision:** Use Terraform with the Hyper-V provider for VM lifecycle management.
**Alternatives considered:** Ansible alone, rejected because state tracking for VMs is weaker without a state file.
**Implications:** Terraform state stored in Azure Blob backend. All VM changes must go through Terraform. No manual Hyper-V Manager changes.
```

Session conversation: "We tried the Terraform Hyper-V provider and it's too buggy. Keeps losing state on VHOST05. Switching to Ansible with a custom inventory plugin instead."

Updated DECISIONS.md:
```markdown
### Terraform for VM provisioning, 2026-01-10

**Superseded:** 2026-03-20, see "Ansible for VM provisioning"

**Context:** Need repeatable VM provisioning on Hyper-V cluster.
**Decision:** Use Terraform with the Hyper-V provider for VM lifecycle management.
**Alternatives considered:** Ansible alone, rejected because state tracking for VMs is weaker without a state file.
**Implications:** Terraform state stored in Azure Blob backend. All VM changes must go through Terraform. No manual Hyper-V Manager changes.

---

### Ansible for VM provisioning, 2026-03-20

**Context:** Terraform Hyper-V provider proved unstable. Persistent state loss on VHOST05 made it unreliable for production VM lifecycle management. Supersedes prior Terraform decision.
**Decision:** Ansible with a custom inventory plugin for Hyper-V VM provisioning.
**Alternatives considered:** Terraform (original choice), rejected due to Hyper-V provider state loss bugs on VHOST05. The state-tracking advantage no longer outweighs the reliability risk.
**Implications:** No external state file. Ansible inventory plugin queries Hyper-V directly. Playbooks must be idempotent since there's no drift detection via state comparison. Existing Terraform state in Azure Blob backend should be archived, not deleted.
```

**Why this is GOOD:** The old decision is preserved with a `Superseded` marker pointing to its replacement. The new decision's Context explicitly references what it supersedes and why. The Implications include cleanup of the old approach (archive Terraform state). A future session can trace the full decision chain.

### BAD: Silent overwrite

Same scenario, but the old Terraform entry is simply deleted and replaced with the Ansible entry. A future session has no idea Terraform was ever tried, why it failed, or that there might be orphaned Terraform state in Azure Blob storage.

---

## Example 4: Confidence Scoring

### GOOD: Properly Tagged Extractions

Conversation excerpt:
> User: "We're deploying BitLocker via GPO to the Intune-MDM-Pilot group."
> Claude: "I'll also configure TPM+PIN startup since it's a prerequisite. Want me to target the same group?"
> User: "Yeah go ahead"
> [Claude generates a script targeting OU=Workstations,OU=ContosoComputers,DC=contoso,DC=com]

Extraction summary:
```
### STATUS.md
- [✅ high] Completed: Deploying BitLocker GPO targeting Intune-MDM-Pilot group
- [💡 medium] Completed: Configuring TPM+PIN for Intune-MDM-Pilot group (user confirmed when suggested)

### PROJECT_BRIEF.md
- [⚠️ low] [from artifact: Enable-CredGuard.ps1] Environment: Workstation OU path is OU=Workstations,OU=ContosoComputers,DC=contoso,DC=com
```

**Why this is GOOD:** The BitLocker deployment is high because the user explicitly stated it. TPM+PIN is medium because Claude suggested it and the user confirmed, but didn't originate the statement. The OU path is low because it appeared in the script but was never discussed in conversation. The user can quickly verify the low-confidence item.

### BAD: Everything Tagged High

Same scenario, extracted as:
```
- [✅ high] Deploying BitLocker via GPO
- [✅ high] Configuring TPM+PIN
- [✅ high] Workstation OU is OU=Workstations,OU=ContosoComputers,DC=contoso,DC=com
```

**Why this is BAD:** The TPM+PIN item is at best medium; the user said "yeah go ahead" to Claude's suggestion, not "we need to configure TPM+PIN." The OU path was never discussed; it appeared in generated code. Tagging everything high defeats the purpose of confidence scoring and hides the items that need verification.

---

## Example 5: Staleness Detection

### GOOD: Stale Items Surfaced With Options

STATUS.md contains:
```markdown
## 2026-03-01, PHS Recovery
**Next Steps:**
- Run `repadmin /replsummary` verification after business hours
- Check STORAGE volume free space on VHOST05
```

Current session date: 2026-03-20 (19 days later). Neither item appears in any later session entry.

Extraction summary includes:
```
### Stale Items Review

The following items from previous sessions have no follow-up after 14+ days:

1. **"Run `repadmin /replsummary` verification after business hours"** (from 2026-03-01, 19 days ago)
   → Still active / Completed / No longer relevant / Blocked

2. **"Check STORAGE volume free space on VHOST05"** (from 2026-03-01, 19 days ago)
   → Still active / Completed / No longer relevant / Blocked
```

**Why this is GOOD:** Both stale items surfaced with their source date and age. Interactive selections let the user resolve each one quickly. The items are presented before the new extraction summary so the user deals with old business first.

### BAD: Stale Items Silently Ignored

Same STATUS.md, same session date, but the extraction summary jumps straight to new extractions without mentioning the 19-day-old open items. They remain as unresolved "Next Steps" indefinitely, accumulating into a list that future sessions will assume are still active.

---

## Example 6: Cross-Project Flagging

### GOOD: Cross-Project Item Flagged

During a Wi-Fi migration session, the user discovers: "The Palo Alto firewall is blocking port 1812 for RADIUS traffic from the Contoso site. Had to add a rule."

Extraction summary includes:
```
### Wi-Fi EAP-TLS Migration, PROJECT_BRIEF.md
- [✅ high] Constraints: Palo Alto firewall required rule addition for RADIUS (port 1812) from Contoso site

### Cross-Project Relevance
⚠️ The firewall rule change (port 1812 for Contoso site RADIUS) may also affect:
- **Contoso Network Security** project: firewall rule inventory may need updating
  → Flag for Contoso Network Security / Not relevant / Unsure, skip
```

**Why this is GOOD:** The extraction goes into the current project's files where it's directly relevant. The cross-project flag is separate, clearly labeled, and requires explicit approval. It identifies the specific target project and explains why it might be relevant.

### BAD: Cross-Project Item Auto-Applied

Same scenario, but the skill silently generates an update to the Contoso Network Security project's files without asking. The user didn't approve the cross-project update and may not even have the Contoso Network Security context files in the current session, resulting in either an error or an unsanctioned update to files the user didn't ask to modify.
