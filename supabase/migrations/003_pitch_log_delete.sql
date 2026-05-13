-- Allow head coaches to delete pitch_log rows.
-- The "Edit innings & pitches" flow rewrites a game's pitch_log by
-- delete-then-insert; without this policy the DELETE silently does nothing
-- (RLS denies it) and duplicate rows accumulate.

CREATE POLICY "Head coaches can delete pitch log"
  ON pitch_log FOR DELETE
  USING (
    game_id IN (
      SELECT id FROM games WHERE team_id IN (
        SELECT id FROM teams WHERE created_by = auth.uid()
        UNION
        SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role = 'head_coach'
      )
    )
  );
