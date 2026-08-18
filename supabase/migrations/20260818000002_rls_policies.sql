-- RLS Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for rounds
CREATE POLICY "Rounds are viewable by everyone"
  ON rounds FOR SELECT
  USING (true);

CREATE POLICY "Staff and Admin can insert rounds"
  ON rounds
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('staff', 'admin')
    )
  );

CREATE POLICY "Staff and Admin can update rounds"
  ON rounds FOR UPDATE
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('staff', 'admin')
    )
  );

CREATE POLICY "Admin can delete rounds"
  ON rounds FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for queue_entries
CREATE POLICY "Queue entries are viewable by everyone"
  ON queue_entries FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert queue entries when round is accepting"
  ON queue_entries FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rounds
      WHERE rounds.id = round_id
      AND rounds.accepting_entries = true
      AND rounds.status IN ('open', 'processing')
    )
  );

CREATE POLICY "Staff and Admin can update queue entries"
  ON queue_entries FOR UPDATE
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('staff', 'admin')
    )
  );

CREATE POLICY "Staff and Admin can delete queue entries"
  ON queue_entries FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('staff', 'admin')
    )
  );

-- RLS Policies for audit_logs
CREATE POLICY "Audit logs are viewable by staff and admin"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('staff', 'admin')
    )
  );

CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);