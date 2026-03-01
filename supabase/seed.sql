-- Pool Party - Seed Data

-- Create a demo group
insert into groups (name, invite_code, settings)
values 
('Pool Party Lakewood Ranch 🍷', 'POOLPARTY-LWR-24', '{"supportPct": 0.05, "enabledTipouts": ["Bartender", "Host"], "timezone": "EST"}'::jsonb),
('Sarasota Servers 🏖️', 'SRQ-SRV-2024', '{"supportPct": 0.045, "enabledTipouts": ["Busser"], "timezone": "EST"}'::jsonb);

-- Tipout rules for demo group 1
insert into tipout_rules (group_id, name, type, value)
values 
((select id from groups where invite_code = 'POOLPARTY-LWR-24' limit 1), 'Bartender', 'percentOfSales', 1.5),
((select id from groups where invite_code = 'POOLPARTY-LWR-24' limit 1), 'Host', 'flat', 15.0);
