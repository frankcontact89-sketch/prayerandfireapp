#!/usr/bin/env bash
set -euo pipefail

# Local-only test harness. It creates and drops only the fixed sandbox database below through the
# local PostgreSQL Unix socket; it never reads project credentials or contacts Lovable Cloud.
DB_NAME="pf_direct_chat_rls_fixture"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FIXTURE="$ROOT_DIR/supabase/tests/community_direct_chat_rls_fixture.sql"

if [[ "${PGHOST:-}" != "" || "${PGPORT:-}" != "" || "${DATABASE_URL:-}" != "" ]]; then
  echo "Refusing external PostgreSQL connection variables; local fixture only." >&2
  exit 2
fi

if [[ ! -f "$FIXTURE" ]]; then
  echo "Missing fixture: $FIXTURE" >&2
  exit 2
fi

sudo pg_ctlcluster 16 main start >/dev/null 2>&1 || true
sudo -u postgres dropdb --if-exists "$DB_NAME" >/dev/null
sudo -u postgres createdb "$DB_NAME"
sudo -u postgres psql -v ON_ERROR_STOP=1 -d "$DB_NAME" <<'SQL'
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
END;
$$;
SQL
cat "$FIXTURE" | sudo -u postgres psql -v ON_ERROR_STOP=1 -d "$DB_NAME" >/dev/null

psql_as() {
  local user_id="$1"
  shift
  sudo -u postgres psql -X -v ON_ERROR_STOP=1 -qAt -d "$DB_NAME" <<SQL
BEGIN;
SET LOCAL ROLE authenticated;
DO \$\$ BEGIN PERFORM set_config('request.jwt.claim.sub', '$user_id', true); END \$\$;
$*
ROLLBACK;
SQL
}

expect_denied_or_zero_rows() {
  local name="$1"
  local user_id="$2"
  local sql="$3"
  local output
  if output="$(psql_as "$user_id" "$sql" 2>/tmp/pf_rls_test.err)"; then
    output="$(printf '%s' "$output" | tr -d '[:space:]')"
    if [[ -n "$output" ]]; then
      echo "FAIL: $name unexpectedly changed a row: $output" >&2
      exit 1
    fi
  fi
  echo "PASS: $name"
}

expect_rejected() {
  local name="$1"
  local user_id="$2"
  local sql="$3"
  if psql_as "$user_id" "$sql" >/tmp/pf_rls_test.out 2>/tmp/pf_rls_test.err; then
    echo "FAIL: $name unexpectedly succeeded" >&2
    cat /tmp/pf_rls_test.out >&2 || true
    exit 1
  fi
  echo "PASS: $name"
}

expect_value() {
  local name="$1"
  local user_id="$2"
  local sql="$3"
  local expected="$4"
  local value
  value="$(psql_as "$user_id" "$sql" | tr -d '[:space:]')"
  if [[ "$value" != "$expected" ]]; then
    echo "FAIL: $name expected '$expected', got '$value'" >&2
    exit 1
  fi
  echo "PASS: $name"
}

ADMIN='00000000-0000-0000-0000-000000000001'
MEMBER='00000000-0000-0000-0000-000000000002'
OTHER_ADMIN='00000000-0000-0000-0000-000000000003'
GROUP_ADMIN='00000000-0000-0000-0000-000000000004'
NORMAL_GROUP='00000000-0000-0000-0000-000000000101'
OTHER_GROUP='00000000-0000-0000-0000-000000000102'
DIRECT_GROUP='00000000-0000-0000-0000-000000000201'

# Ordinary member privilege-escalation and membership-moving regression tests.
expect_denied_or_zero_rows "normal member cannot promote role" "$MEMBER" "UPDATE public.community_group_members SET role = 'owner' WHERE group_id = '$NORMAL_GROUP' AND user_id = '$MEMBER' RETURNING role;"
expect_denied_or_zero_rows "normal member cannot change group_id" "$MEMBER" "UPDATE public.community_group_members SET group_id = '$OTHER_GROUP' WHERE group_id = '$NORMAL_GROUP' AND user_id = '$MEMBER' RETURNING group_id;"
expect_denied_or_zero_rows "normal member cannot change user_id" "$MEMBER" "UPDATE public.community_group_members SET user_id = '$ADMIN' WHERE group_id = '$NORMAL_GROUP' AND user_id = '$MEMBER' RETURNING user_id;"
expect_denied_or_zero_rows "normal member cannot join another group by moving row" "$MEMBER" "UPDATE public.community_group_members SET group_id = '$OTHER_GROUP' WHERE group_id = '$NORMAL_GROUP' AND user_id = '$MEMBER' RETURNING group_id;"

# A non-owner administrator can manage ordinary memberships in their normal group but cannot alter
# the creator's owner membership. The creator retains ordinary-member management as well.
expect_denied_or_zero_rows "non-owner admin cannot demote creator membership" "$GROUP_ADMIN" "UPDATE public.community_group_members SET role = 'member' WHERE group_id = '$NORMAL_GROUP' AND user_id = '$ADMIN' RETURNING role;"
expect_denied_or_zero_rows "non-owner admin cannot delete creator membership" "$GROUP_ADMIN" "DELETE FROM public.community_group_members WHERE group_id = '$NORMAL_GROUP' AND user_id = '$ADMIN' RETURNING user_id;"
expect_value "non-owner admin can change ordinary member role" "$GROUP_ADMIN" "UPDATE public.community_group_members SET role = 'admin' WHERE group_id = '$NORMAL_GROUP' AND user_id = '$MEMBER' RETURNING role;" "admin"
expect_value "creator can still manage ordinary member" "$ADMIN" "UPDATE public.community_group_members SET role = 'admin' WHERE group_id = '$NORMAL_GROUP' AND user_id = '$MEMBER' RETURNING role;" "admin"
expect_denied_or_zero_rows "normal group admin cannot move membership row" "$GROUP_ADMIN" "UPDATE public.community_group_members SET group_id = '$OTHER_GROUP' WHERE group_id = '$NORMAL_GROUP' AND user_id = '$MEMBER' RETURNING group_id;"
expect_denied_or_zero_rows "unrelated group admin cannot manage another group" "$OTHER_ADMIN" "UPDATE public.community_group_members SET role = 'admin' WHERE group_id = '$NORMAL_GROUP' AND user_id = '$MEMBER' RETURNING role;"

# Direct memberships are immutable for participants and third parties.
expect_denied_or_zero_rows "direct participant cannot change direct role" "$MEMBER" "UPDATE public.community_group_members SET role = 'owner' WHERE group_id = '$DIRECT_GROUP' AND user_id = '$MEMBER' RETURNING role;"
expect_denied_or_zero_rows "direct participant cannot move direct membership" "$MEMBER" "UPDATE public.community_group_members SET group_id = '$OTHER_GROUP' WHERE group_id = '$DIRECT_GROUP' AND user_id = '$MEMBER' RETURNING group_id;"
expect_denied_or_zero_rows "direct participant cannot reassign direct membership" "$MEMBER" "UPDATE public.community_group_members SET user_id = '$OTHER_ADMIN' WHERE group_id = '$DIRECT_GROUP' AND user_id = '$MEMBER' RETURNING user_id;"
expect_denied_or_zero_rows "direct participant cannot leave direct chat" "$MEMBER" "DELETE FROM public.community_group_members WHERE group_id = '$DIRECT_GROUP' AND user_id = '$MEMBER' RETURNING user_id;"
expect_denied_or_zero_rows "third user cannot modify direct membership" "$OTHER_ADMIN" "UPDATE public.community_group_members SET role = 'admin' WHERE group_id = '$DIRECT_GROUP' AND user_id = '$MEMBER' RETURNING role;"
expect_denied_or_zero_rows "third user cannot add a direct-chat member" "$OTHER_ADMIN" "INSERT INTO public.community_group_members (group_id, user_id, role) VALUES ('$DIRECT_GROUP', '$OTHER_ADMIN', 'member') RETURNING user_id;"

# The helper accepts only a group UUID and derives its caller from auth.uid(), so the caller cannot
# substitute another participant UUID. The self-only SELECT policy still hides the peer membership.
expect_rejected "direct-chat helper rejects caller UUID override" "$ADMIN" "SELECT public.direct_community_chat_is_blocked('$DIRECT_GROUP', '$MEMBER');"
expect_value "direct-chat helper derives authenticated caller" "$ADMIN" "SELECT public.direct_community_chat_is_blocked('$DIRECT_GROUP')::text;" "false"
expect_value "peer row is hidden by membership RLS" "$ADMIN" "SELECT count(*) FROM public.community_group_members WHERE group_id = '$DIRECT_GROUP';" "1"
expect_value "unblocked direct participant can read seed message" "$ADMIN" "SELECT count(*) FROM public.community_messages WHERE group_id = '$DIRECT_GROUP';" "1"

sudo -u postgres psql -v ON_ERROR_STOP=1 -d "$DB_NAME" -c "INSERT INTO public.community_blocks (blocker_id, blocked_id) VALUES ('$ADMIN', '$MEMBER');" >/dev/null
expect_denied_or_zero_rows "blocker cannot send direct message after own block" "$ADMIN" "INSERT INTO public.community_messages (group_id, sender_id, body) VALUES ('$DIRECT_GROUP', '$ADMIN', 'blocked send') RETURNING id;"
expect_denied_or_zero_rows "blocked peer cannot send direct message after reverse block" "$MEMBER" "INSERT INTO public.community_messages (group_id, sender_id, body) VALUES ('$DIRECT_GROUP', '$MEMBER', 'blocked send') RETURNING id;"
expect_value "blocker cannot read direct messages after own block" "$ADMIN" "SELECT count(*) FROM public.community_messages WHERE group_id = '$DIRECT_GROUP';" "0"
expect_value "blocked peer cannot read direct messages after reverse block" "$MEMBER" "SELECT count(*) FROM public.community_messages WHERE group_id = '$DIRECT_GROUP';" "0"

sudo -u postgres psql -v ON_ERROR_STOP=1 -d "$DB_NAME" -c "DELETE FROM public.community_blocks; INSERT INTO public.community_blocks (blocker_id, blocked_id) VALUES ('$MEMBER', '$ADMIN');" >/dev/null
expect_denied_or_zero_rows "blocked initiator cannot send after opposite block direction" "$ADMIN" "INSERT INTO public.community_messages (group_id, sender_id, body) VALUES ('$DIRECT_GROUP', '$ADMIN', 'blocked send') RETURNING id;"
expect_denied_or_zero_rows "opposite blocker cannot send after opposite block direction" "$MEMBER" "INSERT INTO public.community_messages (group_id, sender_id, body) VALUES ('$DIRECT_GROUP', '$MEMBER', 'blocked send') RETURNING id;"
expect_value "blocked initiator cannot read after opposite block direction" "$ADMIN" "SELECT count(*) FROM public.community_messages WHERE group_id = '$DIRECT_GROUP';" "0"
expect_value "opposite blocker cannot read after opposite block direction" "$MEMBER" "SELECT count(*) FROM public.community_messages WHERE group_id = '$DIRECT_GROUP';" "0"

# Fixed-field RPC succeeds for member notification preferences without changing identity or role.
expect_value "member preference RPC updates only muted" "$MEMBER" "SELECT public.set_community_membership_preferences('$NORMAL_GROUP', true, NULL); SELECT muted::text || ':' || role || ':' || group_id::text || ':' || user_id::text FROM public.community_group_members WHERE group_id = '$NORMAL_GROUP' AND user_id = '$MEMBER';" "true:member:00000000-0000-0000-0000-000000000101:00000000-0000-0000-0000-000000000002"

echo "PASS: executable authenticated RLS regression suite completed"
