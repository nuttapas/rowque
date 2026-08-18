-- Function to get next queue number atomically
CREATE OR REPLACE FUNCTION generate_queue_number(
  p_round_id UUID,
  p_position queue_position
) RETURNS TEXT AS $$
DECLARE
  v_prefix TEXT;
  v_next_num INTEGER;
  v_queue_number TEXT;
BEGIN
  -- Set prefix based on position
  IF p_position = 'support' THEN
    v_prefix := 'S-';
  ELSE
    v_prefix := 'G-';
  END IF;
  
  -- Get next number atomically with lock
  -- Acquire an advisory lock scoped to the round and position to serialize
  -- queue number generation. Avoid using FOR UPDATE together with aggregate
  -- functions; instead use an advisory lock to prevent concurrent generators
  -- from producing the same number.
  PERFORM pg_advisory_xact_lock(
    hashtext(p_round_id::text),
    CASE WHEN p_position = 'support' THEN 1 ELSE 2 END
  );

  SELECT COALESCE(
    MAX(
      CAST(
        SUBSTRING(queue_number FROM 3) AS INTEGER
      )
    ), 0
  ) + 1 INTO v_next_num
  FROM queue_entries
  WHERE round_id = p_round_id
    AND position = p_position
    AND queue_number LIKE v_prefix || '%';
  
  -- Format queue number with leading zeros
  v_queue_number := v_prefix || LPAD(v_next_num::TEXT, 3, '0');
  
  RETURN v_queue_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to register queue entry atomically
CREATE OR REPLACE FUNCTION register_queue_entry(
  p_round_id UUID,
  p_player_name TEXT,
  p_contact TEXT,
  p_position queue_position
) RETURNS UUID AS $$
DECLARE
  v_queue_number TEXT;
  v_entry_id UUID;
BEGIN
  -- Generate queue number atomically
  v_queue_number := generate_queue_number(p_round_id, p_position);
  
  -- Insert queue entry
  INSERT INTO queue_entries (
    round_id,
    queue_number,
    player_name,
    contact,
    position,
    status
  ) VALUES (
    p_round_id,
    v_queue_number,
    p_player_name,
    p_contact,
    p_position,
    'waiting'
  ) RETURNING id INTO v_entry_id;
  
  -- Log audit
  INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (
    auth.uid(),
    'register_queue',
    'queue_entry',
    v_entry_id,
    jsonb_build_object(
      'queue_number', v_queue_number,
      'position', p_position,
      'round_id', p_round_id
    )
  );
  
  RETURN v_entry_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to random select queue entry (atomic with race condition protection)
CREATE OR REPLACE FUNCTION random_select_queue(
  p_round_id UUID,
  p_position queue_position,
  p_count INTEGER DEFAULT 1
) RETURNS JSONB AS $$
DECLARE
  v_entry queue_entries%ROWTYPE;
  v_results JSONB := '[]'::JSONB;
  i INTEGER := 0;
BEGIN
  IF p_count IS NULL OR p_count < 1 THEN
    p_count := 1;
  END IF;

  FOR i IN 1..p_count LOOP
    -- Select a random waiting entry and lock it to prevent concurrent claims
    SELECT * INTO v_entry
    FROM queue_entries
    WHERE round_id = p_round_id
      AND position = p_position
      AND status = 'waiting'
    ORDER BY random()
    FOR UPDATE SKIP LOCKED
    LIMIT 1;

    IF v_entry.id IS NULL THEN
      -- no more waiting entries
      EXIT;
    END IF;

    -- Attempt to mark as called (immediately call the selected entry)
    UPDATE queue_entries
    SET
      status = 'called',
      called_at = NOW(),
      called_by = auth.uid()
    WHERE id = v_entry.id
      AND status = 'waiting';

    IF NOT FOUND THEN
      -- another transaction claimed it; continue to next
      CONTINUE;
    END IF;

    -- Log audit for this entry
    INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
    VALUES (
      auth.uid(),
      'random_queue',
      'queue_entry',
      v_entry.id,
      jsonb_build_object(
        'queue_number', v_entry.queue_number,
        'position', v_entry.position,
        'round_id', p_round_id
      )
    );

    -- Append to results array (now called)
    v_results := v_results || jsonb_build_array(
      jsonb_build_object(
        'id', v_entry.id,
        'queue_number', v_entry.queue_number,
        'player_name', v_entry.player_name,
        'position', v_entry.position,
        'status', 'called'
      )
    );
  END LOOP;

  IF jsonb_array_length(v_results) = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'NO_WAITING_QUEUE',
      'message', 'ไม่มีคิวที่รออยู่ในขณะนี้'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'data', v_results
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to confirm random selection
CREATE OR REPLACE FUNCTION confirm_random_queue(
  p_entry_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_entry queue_entries%ROWTYPE;
BEGIN
  -- Get current entry
  -- Lock the selected row to prevent concurrent manual claims
  SELECT * INTO v_entry
  FROM queue_entries
  WHERE id = p_entry_id
  FOR UPDATE;
  
  IF v_entry.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'ENTRY_NOT_FOUND',
      'message', 'ไม่พบข้อมูลคิว'
    );
  END IF;
  
  IF v_entry.status != 'selected' THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'INVALID_STATUS',
      'message', 'สถานะคิวไม่ถูกต้อง'
    );
  END IF;
  
  -- Log audit
  INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (
    auth.uid(),
    'random_confirm',
    'queue_entry',
    p_entry_id,
    jsonb_build_object(
      'queue_number', v_entry.queue_number
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'ยืนยันผลการสุ่มสำเร็จ'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject random selection (return to waiting)
CREATE OR REPLACE FUNCTION reject_random_queue(
  p_entry_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_entry queue_entries%ROWTYPE;
BEGIN
  SELECT * INTO v_entry
  FROM queue_entries
  WHERE id = p_entry_id;
  
  IF v_entry.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'ENTRY_NOT_FOUND',
      'message', 'ไม่พบข้อมูลคิว'
    );
  END IF;
  
  IF v_entry.status != 'selected' THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'INVALID_STATUS',
      'message', 'สถานะคิวไม่ถูกต้อง'
    );
  END IF;
  
  -- Return to waiting status
  UPDATE queue_entries
  SET 
    status = 'waiting',
    selected_at = NULL,
    selected_by = NULL
  WHERE id = p_entry_id;
  
  -- Log audit
  INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (
    auth.uid(),
    'random_reject',
    'queue_entry',
    p_entry_id,
    jsonb_build_object(
      'queue_number', v_entry.queue_number
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'ยกเลิกผลการสุ่มสำเร็จ'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to manually call queue
CREATE OR REPLACE FUNCTION manual_call_queue(
  p_entry_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_entry queue_entries%ROWTYPE;
BEGIN
  SELECT *
  INTO v_entry
  FROM queue_entries
  WHERE id = p_entry_id
  FOR UPDATE;

  IF v_entry.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'ENTRY_NOT_FOUND',
      'message', 'ไม่พบข้อมูลคิว'
    );
  END IF;

  IF v_entry.status NOT IN ('waiting', 'selected', 'cancelled') THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'INVALID_STATUS',
      'message', 'ไม่สามารถเรียกคิวในสถานะนี้ได้'
    );
  END IF;

  UPDATE queue_entries
  SET
    status = 'called',
    called_at = NOW(),
    called_by = auth.uid()
  WHERE id = p_entry_id;

  INSERT INTO audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  VALUES (
    auth.uid(),
    'manual_call',
    'queue_entry',
    p_entry_id,
    jsonb_build_object(
      'queue_number', v_entry.queue_number
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'เรียกคิวสำเร็จ'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete queue
CREATE OR REPLACE FUNCTION complete_queue(
  p_entry_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_entry queue_entries%ROWTYPE;
BEGIN
  SELECT * INTO v_entry
  FROM queue_entries
  WHERE id = p_entry_id;
  
  IF v_entry.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'ENTRY_NOT_FOUND',
      'message', 'ไม่พบข้อมูลคิว'
    );
  END IF;
  
  IF v_entry.status NOT IN ('called', 'serving') THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'INVALID_STATUS',
      'message', 'ไม่สามารถทำเครื่องหมายว่าเสร็จสิ้นในสถานะนี้ได้'
    );
  END IF;
  
  -- Update to completed status
  UPDATE queue_entries
  SET 
    status = 'completed',
    completed_at = NOW(),
    completed_by = auth.uid()
  WHERE id = p_entry_id;
  
  -- Log audit
  INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (
    auth.uid(),
    'complete_queue',
    'queue_entry',
    p_entry_id,
    jsonb_build_object(
      'queue_number', v_entry.queue_number
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'ทำเครื่องหมายว่าเสร็จสิ้นสำเร็จ'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark no-show
CREATE OR REPLACE FUNCTION mark_no_show(
  p_entry_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_entry queue_entries%ROWTYPE;
BEGIN
  SELECT * INTO v_entry
  FROM queue_entries
  WHERE id = p_entry_id;
  
  IF v_entry.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'ENTRY_NOT_FOUND',
      'message', 'ไม่พบข้อมูลคิว'
    );
  END IF;
  
  IF v_entry.status NOT IN ('called', 'serving', 'selected') THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'INVALID_STATUS',
      'message', 'ไม่สามารถทำเครื่องหมายว่าไม่มาในสถานะนี้ได้'
    );
  END IF;
  
  -- Update to no_show status
  UPDATE queue_entries
  SET 
    status = 'no_show',
    completed_at = NOW(),
    completed_by = auth.uid()
  WHERE id = p_entry_id;
  
  -- Log audit
  INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (
    auth.uid(),
    'no_show',
    'queue_entry',
    p_entry_id,
    jsonb_build_object(
      'queue_number', v_entry.queue_number
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'ทำเครื่องหมายว่าไม่มาสำเร็จ'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cancel queue
CREATE OR REPLACE FUNCTION cancel_queue(
  p_entry_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_entry queue_entries%ROWTYPE;
BEGIN
  SELECT * INTO v_entry
  FROM queue_entries
  WHERE id = p_entry_id;
  
  IF v_entry.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'ENTRY_NOT_FOUND',
      'message', 'ไม่พบข้อมูลคิว'
    );
  END IF;
  
  IF v_entry.status NOT IN ('waiting', 'selected', 'called') THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'INVALID_STATUS',
      'message', 'ไม่สามารถยกเลิกคิวในสถานะนี้ได้'
    );
  END IF;
  
  -- Update to cancelled status
  UPDATE queue_entries
  SET 
    status = 'cancelled',
    cancelled_at = NOW()
  WHERE id = p_entry_id;
  
  -- Log audit
  INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (
    auth.uid(),
    'cancel_queue',
    'queue_entry',
    p_entry_id,
    jsonb_build_object(
      'queue_number', v_entry.queue_number
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'ยกเลิกคิวสำเร็จ'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reopen round
CREATE OR REPLACE FUNCTION reopen_round(
  p_round_id UUID,
  p_reason TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_round rounds%ROWTYPE;
BEGIN
  SELECT * INTO v_round
  FROM rounds
  WHERE id = p_round_id;
  
  IF v_round.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'ROUND_NOT_FOUND',
      'message', 'ไม่พบรอบนี้'
    );
  END IF;
  
  -- Update round to accept entries
  UPDATE rounds
  SET 
    accepting_entries = true,
    updated_at = NOW()
  WHERE id = p_round_id;
  
  -- Log audit
  INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (
    auth.uid(),
    'reopen_round',
    'round',
    p_round_id,
    jsonb_build_object(
      'round_number', v_round.round_number,
      'reason', p_reason
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'เปิดรับคิวรอบนี้อีกครั้งสำเร็จ'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
DECLARE
  v_role user_role;
BEGIN
  SELECT role INTO v_role
  FROM profiles
  WHERE id = auth.uid();
  
  RETURN COALESCE(v_role, 'player');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is staff or admin
CREATE OR REPLACE FUNCTION is_staff_or_admin()
RETURNS BOOLEAN AS $$
DECLARE
  v_role user_role;
BEGIN
  SELECT role INTO v_role
  FROM profiles
  WHERE id = auth.uid();
  
  RETURN v_role IN ('staff', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;