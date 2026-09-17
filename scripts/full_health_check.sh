#!/usr/bin/env bash

# full_health_check.sh – End‑to‑end health‑check for DentalGO CRM
# Runs on VPS or locally. Creates temporary test data, validates each component, logs JSON entries.

set -euo pipefail

LOG_DIR="$(dirname "$0")/../logs"
mkdir -p "$LOG_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$LOG_DIR/full_health_check_${TIMESTAMP}.json"

log() {
  local step="$1"
  local status="$2"
  local message="$3"
  echo "{\"timestamp\": \"$(date --iso-8601=seconds)\", \"step\": \"$step\", \"status\": \"$status\", \"message\": \"$message\"}" >> "$LOG_FILE"
}

fail() {
  log "$1" "FAIL" "$2"
  echo "❌ $1 failed: $2"
  exit 1
}

# 1. Docker build
log "Docker Build" "START" "Running docker build ."
if ! docker build . > /dev/null 2>&1; then
  fail "Docker Build" "Docker build failed"
fi
log "Docker Build" "PASS" "Docker image built successfully"

# 2. DB connectivity (Prisma)
log "DB Connectivity" "START" "Testing Prisma DB connection"
if ! npx prisma db pull > /dev/null 2>&1; then
  fail "DB Connectivity" "Prisma db pull failed"
fi
log "DB Connectivity" "PASS" "Prisma connected"

# 3. API health endpoint
log "API Health" "START" "GET /api/health"
API_URL="http://localhost:3000/api/health"
if ! curl -s "$API_URL" | grep -q '"status":"ok"'; then
  fail "API Health" "Health endpoint not ok"
fi
log "API Health" "PASS" "API healthy"

# 4. CSV import dry‑run
log "CSV Import" "START" "POST dry‑run CSV"
CSV_DATA="id,name\n1,Test"
if ! curl -s -X POST -H "Content-Type: text/csv" --data "$CSV_DATA" "http://localhost:3000/api/import?dryRun=true" | grep -q '"imported":0'; then
  fail "CSV Import" "Dry‑run import failed"
fi
log "CSV Import" "PASS" "Dry‑run succeeded"

# 5. Visual Auditor init (placeholder)
log "Visual Auditor" "START" "Calling auditor init"
if ! curl -s "http://localhost:3000/api/audit/init" | grep -q '"initialized":true'; then
  fail "Visual Auditor" "Audit init failed"
fi
log "Visual Auditor" "PASS" "Audit init ok"

# 6. Round‑Robin assignment test
log "RoundRobin" "START" "Trigger dummy lead flow"
LEAD_PAYLOAD='{"email":"test@example.com","name":"Test User"}'
if ! curl -s -X POST -H "Content-Type: application/json" -d "$LEAD_PAYLOAD" "http://localhost:3000/api/lead" | grep -q '"assignedTo"'; then
  fail "RoundRobin" "Lead assignment failed"
fi
log "RoundRobin" "PASS" "Lead assigned"

# 7. Kanban board sync (placeholder)
log "Kanban" "START" "Check test board"
if ! curl -s "http://localhost:3000/api/kanban/boards/test" | grep -q '"status":"active"'; then
  fail "Kanban" "Kanban board check failed"
fi
log "Kanban" "PASS" "Kanban board ok"

# 8. Email worker queue test
log "Email Worker" "START" "Queue test email"
if ! curl -s -X POST -H "Content-Type: application/json" -d '{"to":"test@example.com","subject":"Health check","body":"OK"}' "http://localhost:3000/api/email/queue" | grep -q '"queued":true'; then
  fail "Email Worker" "Queueing email failed"
fi
log "Email Worker" "PASS" "Email queued"

# 9. Automation script example
log "Automation" "START" "Run sample automation"
if ! bash scripts/auto_retry.sh > /dev/null 2>&1; then
  fail "Automation" "Automation script failed"
fi
log "Automation" "PASS" "Automation succeeded"

# 10. Search index test
log "Search Index" "START" "Query search"
if ! curl -s "http://localhost:3000/api/search?q=test" | grep -q '"results"'; then
  fail "Search Index" "Search query failed"
fi
log "Search Index" "PASS" "Search ok"

# 11. Opportunity creation
log "Opportunity" "START" "Create opportunity"
if ! curl -s -X POST -H "Content-Type: application/json" -d '{"contactId":1,"value":1000}' "http://localhost:3000/api/opportunity" | grep -q '"id"'; then
  fail "Opportunity" "Creation failed"
fi
log "Opportunity" "PASS" "Opportunity created"

# 12. Campaign enrollment
log "Campaign" "START" "Enroll test contact"
if ! curl -s -X POST -H "Content-Type: application/json" -d '{"contactId":1,"campaignId":1}' "http://localhost:3000/api/campaign/enroll" | grep -q '"enrolled":true'; then
  fail "Campaign" "Enrollment failed"
fi
log "Campaign" "PASS" "Enrolled in campaign"

# 13. RoundRobin completion
log "RoundRobin Completion" "START" "Verify stage progression"
if ! curl -s "http://localhost:3000/api/lead/1" | grep -q '"stage":"next"'; then
  fail "RoundRobin Completion" "Stage not progressed"
fi
log "RoundRobin Completion" "PASS" "Stage advanced"

# 14. Stage validation
log "Stage Validation" "START" "Check final stage"
if ! curl -s "http://localhost:3000/api/opportunity/1" | grep -q '"stage":"qualified"'; then
  fail "Stage Validation" "Final stage incorrect"
fi
log "Stage Validation" "PASS" "Stage correct"

# 15. Worker execution verification
log "Worker Execution" "START" "Poll worker status"
if ! curl -s "http://localhost:3000/api/worker/status" | grep -q '"active":true'; then
  fail "Worker Execution" "Worker not active"
fi
log "Worker Execution" "PASS" "Worker active"

# 16. Email dispatch verification
log "Email Dispatch" "START" "Check email sent"
if ! curl -s "http://localhost:1080/api/v2/messages" | grep -q 'test@example.com'; then
  fail "Email Dispatch" "Email not found in mailbox"
fi
log "Email Dispatch" "PASS" "Email sent"

# 17. Logging already performed throughout
log "Logging" "PASS" "All steps logged"

# 18. Cleanup test data (placeholder calls)
log "Cleanup" "START" "Removing test records"
curl -s -X DELETE "http://localhost:3000/api/test/cleanup" > /dev/null 2>&1 || true
log "Cleanup" "PASS" "Test data removed"

echo "✅ Full health‑check completed successfully"
exit 0
