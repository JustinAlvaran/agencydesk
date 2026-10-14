-- Hosted follow-up to remove inherited privileges on internal action ledgers.
-- The lead workflow also includes these revocations for fresh installations.
revoke all on private.lead_call_actions,private.manual_lead_actions from service_role;
