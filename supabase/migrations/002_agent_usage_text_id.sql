-- Fix agent_usage for backend JWT uids (text, not uuid)
alter table if exists agent_usage alter column user_id type text using user_id::text;
