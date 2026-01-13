INSERT INTO mtl_cc_entries_interface (
  cc_entry_interface_id,
  organization_id,
  last_update_date,
  last_updated_by,
  creation_date,
  created_by,
  action_code,
  cycle_count_header_id,
  item_segment1,
  revision,
  subinventory,
  locator_id,
  lot_number,
  count_date,
  employee_id,
  lock_flag,
  process_flag,
  process_mode,
  valid_flag,
  delete_flag,
  status_flag,
  transaction_reason_id,
  reference,
  count_uom,
  count_quantity
) VALUES (
  MTL_CC_ENTRIES_INTERFACE_S1.NEXTVAL,
  l_organization_id,     -- e.g., 207 for M1
  SYSDATE,
  l_user_id,             -- e.g., 1068 for MFG
  SYSDATE,
  l_user_id,
  14,                    -- G_PROCESS
  l_cycle_count_id,      -- Lookup in MTL_CYCLE_COUNT_HEADERS
  l_item,
  '',
  l_Subinventory,     -- e.g., 'FGI'
  '',
  '',
  SYSDATE,
  l_emp_id,
  2,                   -- UNLOCK
  1,                   -- READY
  3,                   -- Background
  1,                   -- VALID
  2,                   -- Not Deleted
  4,                   -- Marked for Reprocessing
  '',
  'Test API',
  'Ea',
  l_quantity
);

COMMIT;
