# UJU Cycle Live v4.0 — Standard Operating Procedures (SOP)
## Human Intervention Manual v4.0

---

## 🚨 EMERGENCY PROTOCOLS (5-Minute Response)

### E-01: System-Wide Performance Collapse
**Trigger:** P95 response time > 30 seconds for 3 consecutive minutes

**AI Auto-Resolution Attempted (Already Run):**
- [x] Horizontal scaling (+2 replicas)
- [x] Redis cache flush
- [x] Read replicas enabled
- [x] Rate limiting increased

**If Still Failing, Execute:**

```bash
# Step 1: SSH into ops instance
ssh admin@uju-ops.uju.ai -i ~/.ssh/uju_admin

# Step 2: Run full diagnostic
/opt/uju/bin/emergency_diagnostic.sh --output /tmp/diag-$(date +%s).json

# Step 3: Identify bottleneck (output will highlight in RED)
grep -E "CRITICAL|FAILED" /tmp/diag-*.json

# Step 4: Apply fix based on bottleneck:
# - Database: /opt/uju/bin/fix_db.sh --mode emergency
# - API Gateway: systemctl restart uju-gateway
# - Model Server: /opt/uju/bin/rollback_model.sh --to previous
# - Network: /opt/uju/bin/reset_network_policies.sh

# Step 5: Verify fix
watch -n 5 'curl -s http://localhost:8000/health | jq .p95_response_time'

# Step 6: If resolved, document:
/opt/uju/bin/log_incident.sh --status resolved --notes "$(cat /tmp/resolution_notes)"
```

**SLA:** 5 minutes from alert to human action

---

### E-02: Security Breach Confirmed
**Trigger:** Active exploit detected or confirmed data exfiltration

**CRITICAL: DO NOT DELAY — EXECUTE IMMEDIATELY**

```bash
# Step 1: Isolate (RUN THIS FIRST)
/opt/uju/security/isolate_breach.sh --severity critical

# Step 2: Preserve evidence (DO NOT DELETE ANYTHING)
/opt/uju/security/collect_forensics.sh \
  --output /secure/forensics/incident-$(date +%Y%m%d-%H%M%S) \
  --preserve-logs \
  --capture-memory

# Step 3: Revoke all access (temporary)
/opt/uju/security/revoke_all_access.sh --reason breach --restore-after 3600

# Step 4: Rotate ALL secrets
/opt/uju/security/rotate_secrets.sh --all

# Step 5: Activate legal response
/opt/uju/legal/breach_notification.sh --level data-exfil

# Step 6: After containment, analyze:
/opt/uju/security/breach_analyzer.sh --forensics /secure/forensics/latest
```

**SLA:** Immediate (0 minutes — automated response)

---

### E-03: Data Corruption Detected
**Trigger:** Checksum mismatch or transaction log inconsistency

```bash
# Step 1: HALT WRITES (prevents further corruption)
/opt/uju/database/pause_writes.sh --reason corruption --timeout 3600

# Step 2: Identify corruption scope
psql -U uju_admin -d uju_production -c "
  SELECT schemaname, tablename, n_dead_tup, last_vacuum 
  FROM pg_stat_user_tables 
  WHERE n_dead_tup > 10000;
"

# Step 3: Run deep consistency check
/opt/uju/database/consistency_check.sh --full --output /tmp/consistency.json

# Step 4: Determine restore point
# Look for most recent clean checkpoint in /var/log/postgresql/checkpoint.log

# Step 5: Restore from backup
./restore_postgres.sh \
  --backup-id latest_clean \
  --timestamp "$(cat /var/log/postgresql/last_clean_checkpoint)" \
  --point-in-time

# Step 6: Verify integrity
./verify_database.sh --checksum-all

# Step 7: Resume writes
/opt/uju/database/resume_writes.sh
```

**SLA:** 15 minutes

---

## ⚠️ CRITICAL PROTOCOLS (15-Minute Response)

### C-01: Model Drift > 15%
**Trigger:** Accuracy drop > 15% on validation set

```bash
# Step 1: Review drift report
/opt/uju/ml/model_drift_report.sh --latest

# Step 2: Test rollback
/opt/uju/ml/rollback_model.sh --version previous --canary true

# Step 3: Validate canary (wait 5 minutes)
/opt/uju/ml/compare_models.sh --baseline production --candidate rollback

# Step 4: If rollback improves, make permanent
/opt/uju/ml/promote_model.sh --version previous --reason drift

# Step 5: If rollback doesn't help, trigger emergency retraining
/opt/uju/ml/retrain_model.sh --emergency --data-last 7d

# Step 6: Deploy new model with canary
/opt/uju/ml/deploy_model.sh --canary-percentage 5 --monitor 3600
```

---

### C-02: Court Order Received
**Trigger:** Legal team validates court order

**IMPORTANT: Human must verify authenticity BEFORE any action**

```bash
# Step 1: Verify court order signature
/opt/uju/legal/verify_court_order.sh --order-id "$ORDER_ID"

# Step 2: If valid, log to immutable ledger
/opt/uju/legal/log_court_order.sh \
  --order-id "$ORDER_ID" \
  --user "$TARGET_USER" \
  --duration "$VALID_DAYS"

# Step 3: Generate judicial access token
JUDICIAL_TOKEN=$(/opt/uju/security/generate_judicial_token.sh \
  --user "$TARGET_USER" \
  --duration "$VALID_DAYS" \
  --reason "$COURT_REASON")

# Step 4: Notify user (legal requirement)
/opt/uju/legal/notify_user_court_order.sh \
  --user "$TARGET_USER" \
  --order-id "$ORDER_ID" \
  --token "$JUDICIAL_TOKEN"

# Step 5: Provide access to authorized party (only after steps 1-4)
/opt/uju/legal/provide_judicial_access.sh \
  --token "$JUDICIAL_TOKEN" \
  --recipient "$COURT_DESIGNATED_EMAIL"
```

---

### C-03: Resource Exhaustion Imminent
**Trigger:** CPU > 85% for 10 minutes OR Memory > 90%

```bash
# Step 1: Check auto-scale status
/opt/uju/infra/check_auto_scale_status.sh

# Step 2: If quota exhausted, request increase
aws service-quotas request-service-quota-increase \
  --service-code ec2 \
  --quota-code L-12345678 \
  --desired-value 100

# Step 3: Aggressive cache clearing
/opt/uju/cache/clear_all.sh --force

# Step 4: Archive old sessions
/opt/uju/database/archive_sessions.sh --older-than 90d --archive-s3

# Step 5: Enable aggressive compression
psql -U uju_admin -d uju_production -c "
  ALTER TABLE sessions SET (toast_compression = lz4);
  VACUUM FULL sessions;
"

# Step 6: Scale down non-critical services
/opt/uju/infra/scale_down.sh --services model_review,export_queue
```

---

## ℹ️ ROUTINE PROTOCOLS (60-Minute Response)

### R-01: User Data Deletion Request (GDPR/CCPA)
**Trigger:** User requests data deletion (not automated)

```bash
# Step 1: Verify user identity
/opt/uju/compliance/verify_user_identity.sh --user "$USER_ID" --method support-ticket

# Step 2: Generate deletion report
/opt/uju/compliance/generate_deletion_report.sh --user "$USER_ID" --output /tmp/deletion.json

# Step 3: Anonymize user data
/opt/uju/compliance/anonymize_user.sh --user "$USER_ID" --keep-legal-required

# Step 4: Log deletion for compliance
/opt/uju/compliance/log_deletion.sh --user "$USER_ID" --type gdpr --timestamp "$(date -u +%Y-%m-%dT%H:%M:%SZ)"

# Step 5: Send confirmation to user
/opt/uju/compliance/send_deletion_confirmation.sh --user "$USER_ID"
```

---

### R-02: Model Version Update (Scheduled)
**Trigger:** Weekly retraining complete

```bash
# Step 1: Review validation metrics
/opt/uju/ml/validation_report.sh --latest --output /tmp/validation.html

# Step 2: If metrics improved, approve promotion
/opt/uju/ml/approve_promotion.sh --version latest --reason "Weekly retraining"

# Step 3: Deploy to canary (5% traffic)
/opt/uju/ml/deploy_model.sh --version latest --canary-percentage 5

# Step 4: Monitor for 1 hour
watch -n 30 '/opt/uju/ml/model_health.sh --version latest'

# Step 5: If stable, full deploy
/opt/uju/ml/promote_model.sh --version latest --rollout 100

# Step 6: Update documentation
/opt/uju/ml/update_model_docs.sh --version latest
```

---

## 📊 INCIDENT LOG FORMAT

All incidents must be logged to the immutable audit ledger:

```json
{
  "incident_id": "INC-20260429-001",
  "timestamp": "2026-04-29T05:45:00Z",
  "severity": "CRITICAL",
  "category": "performance_degradation",
  "description": "P95 latency > 30s for 5 minutes",
  "auto_resolved": false,
  "human_assigned": "admin@uju.ai",
  "resolution_steps": [
    "Identified database connection pool exhaustion",
    "Increased max_connections from 100 to 200",
    "Restarted connection pooler",
    "Verified P95 < 1s"
  ],
  "resolution_time_minutes": 12,
  "sla_met": true
}
```

---

## 📞 ESCALATION CONTACTS

| Role | Email | Phone | Slack |
|------|-------|-------|--------|
| **Primary On-Call** | oncall@uju.ai | +1-555-0199 | @oncall |
| **Security Lead** | security@uju.ai | +1-555-0200 | @security |
| **Legal** | legal@uju.ai | +1-555-0201 | @legal |
| **CEO (Emergency)** | ceo@uju.ai | +1-555-0202 | @ceo |

---

## ✅ FINAL CHECKLIST BEFORE LAUNCH

- [ ] All SOPs documented and tested
- [ ] On-call rotation set up (PagerDuty)
- [ ] All alerts configured (Slack + SMS)
- [ ] Legal review completed
- [ ] SOC2 Type I audit passed
- [ ] Penetration test passed
- [ ] Load testing completed (100 concurrent users)
- [ ] Backup restoration tested
- [ ] Court order simulation completed
- [ ] User deletion flow verified
- [ ] All admin dashboard metrics verified

---

*"The UJU Cycle is 95% autonomous. These SOPs cover the 5% that needs you. Follow them precisely."*
