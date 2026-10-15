-- Cover the suppression ledger's foreign keys without exposing its contents.
create index recipient_suppressions_lead on private.recipient_suppressions(lead_id);
create index recipient_suppressions_actor on private.recipient_suppressions(actor_id);
